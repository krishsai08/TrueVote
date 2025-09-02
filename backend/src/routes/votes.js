import express from 'express';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import FraudLog from '../models/FraudLog.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { auth } from '../middleware/auth.js';
import { getClientIP } from '../utils/ip.js';
import { sendVoteConfirmationEmail } from '../utils/email.js';
import { createFraudLog, detectSuspiciousPatterns } from '../utils/fraudLogger.js';

const router = express.Router();

// Protected: cast a vote (requires faceVerified=true and OTP verification)
router.post('/:electionId', auth, async (req, res) => {
  try {
    const { electionId } = req.params;
    let { option, candidate, faceVerified, verificationToken } = req.body;

    // ✅ Accept either "option" or "candidate"
    option = option || candidate;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const now = new Date();
    if (now < election.startTime || now > election.endTime) {
      return res.status(400).json({ message: 'Election not active' });
    }

    // ✅ Expect candidates always as array
    const candidates = Array.isArray(election.candidates)
      ? election.candidates.map(c => c.trim())
      : [];

    // Normalize input option
    if (typeof option === 'string') {
      option = option.trim();
    }

    if (!candidates.includes(option)) {
      return res.status(400).json({
        message: `Invalid option. Valid options are: ${candidates.join(', ')}`
      });
    }

    if (!faceVerified) {
      await createFraudLog({
        userId: req.user._id,
        electionId,
        type: 'FaceMismatch',
        severity: 'high',
        details: 'Client reported faceVerified=false - Face recognition failed during voting',
        req,
        metadata: { faceVerified: false, votingAttempt: true }
      });
      return res.status(400).json({ message: 'Face verification failed' });
    }

    // Check OTP verification
    if (!verificationToken) {
      await createFraudLog({
        userId: req.user._id,
        electionId,
        type: 'OTPVerificationFailed',
        severity: 'medium',
        details: 'Voting attempt without OTP verification token',
        req,
        metadata: { hasVerificationToken: false }
      });
      return res.status(400).json({ message: 'OTP verification required. Please verify your OTP first.' });
    }

    // Verify that user has completed OTP verification for this election
    const otpRecord = await OTP.findOne({
      userId: req.user._id,
      electionId,
      isUsed: true
    });

    if (!otpRecord) {
      await createFraudLog({
        userId: req.user._id,
        electionId,
        type: 'OTPVerificationFailed',
        severity: 'medium',
        details: 'Voting attempt without valid OTP verification record',
        req,
        metadata: { hasOtpRecord: false, verificationToken: verificationToken ? 'present' : 'missing' }
      });
      return res.status(400).json({ message: 'OTP verification required. Please verify your OTP first.' });
    }

    // Check if user has dateOfBirth set (more reliable than age virtual)
    if (!req.user.dateOfBirth) {
      return res.status(400).json({ 
        message: 'User date of birth not set. Please update your profile first.' 
      });
    }

    // Calculate age manually to ensure it's available
    const today = new Date();
    const birthDate = new Date(req.user.dateOfBirth);
    let userAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      userAge--;
    }

    // Check age eligibility
    const eligible = election.eligibleAgeGroups && election.eligibleAgeGroups.length > 0
      ? election.eligibleAgeGroups.some(group => userAge >= group.min && userAge <= group.max)
      : true; // If no age groups specified, everyone is eligible

    if (!eligible) {
      await createFraudLog({
        userId: req.user._id,
        electionId,
        type: 'AgeEligibilityViolation',
        severity: 'medium',
        details: `User attempted to vote but age (${userAge}) does not meet eligibility requirements`,
        req,
        metadata: { userAge, eligibleAgeGroups: election.eligibleAgeGroups }
      });
      return res
        .status(403)
        .json({ 
          message: `You are not eligible to vote in this election. Your age (${userAge}) does not meet the requirements.` 
        });
    }

    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    // Detect suspicious patterns before allowing vote
    await detectSuspiciousPatterns(req.user._id, electionId, req);

    const vote = await Vote.create({
      electionId,
      userId: req.user._id,
      option,
      verifiedByFace: true,
      ip,
      userAgent
    });

    // Get updated vote count for real-time updates
    const voteCounts = await Vote.aggregate([
      { $match: { electionId: election._id, option: { $ne: "" } } },
      { $group: { _id: '$option', count: { $sum: 1 } } },
      { $project: { candidate: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);

    const results = voteCounts.map(item => ({
      candidate: election.candidates.find(c => c === item.candidate) || item.candidate,
      count: item.count
    }));

    // Emit real-time updates
    const io = req.app.get('io');
    if (io) {
      // Broadcast to election room
      io.to(`election-${electionId}`).emit('vote-cast', {
        electionId,
        results,
        totalVotes: results.reduce((sum, r) => sum + r.count, 0),
        timestamp: new Date()
      });

      // Broadcast to admin room
      io.to('admin-room').emit('election-updated', {
        electionId,
        action: 'vote-cast',
        results,
        timestamp: new Date()
      });

      // Broadcast to specific user room
      io.to(`user-${req.user._id}`).emit('vote-confirmed', {
        electionId,
        option,
        timestamp: new Date()
      });
    }

    // Send vote confirmation email
    try {
      const user = await User.findById(req.user._id);
      if (user && user.email) {
        await sendVoteConfirmationEmail(
          user.email,
          user.name || user.username,
          election.title,
          option
        );
      }
    } catch (emailError) {
      console.error('Failed to send vote confirmation email:', emailError);
      // Don't fail the vote if email fails
    }

    res.status(201).json({ message: 'Vote cast', voteId: vote._id });
  } catch (e) {
    console.error('Vote creation error:', e);
    if (e?.code === 11000) {
      await createFraudLog({
        userId: req.user._id,
        electionId: req.params.electionId,
        type: 'RepeatVoteAttempt',
        severity: 'high',
        details: 'User attempted to vote multiple times in the same election',
        req,
        metadata: { duplicateVoteAttempt: true, errorCode: e.code }
      });
      return res
        .status(409)
        .json({ message: 'You have already voted in this election' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected: my vote
router.get('/mine/:electionId', auth, async (req, res) => {
  const v = await Vote.findOne({
    electionId: req.params.electionId,
    userId: req.user._id
  });
  res.json(v || null);
});

// Protected: fetch votes cast by the logged-in user
router.get('/user/my-votes', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const votes = await Vote.find({ userId }).populate('electionId', 'title');

    const formattedVotes = votes.map(v => ({
      election: v.electionId?.title || 'Unknown Election',
      option: v.option,
      timestamp: v.createdAt,
    }));

    res.json(formattedVotes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
