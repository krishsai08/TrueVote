import express from 'express';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import FraudLog from '../models/FraudLog.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { getClientIP } from '../utils/ip.js';

const router = express.Router();

// Protected: cast a vote (requires faceVerified=true)
router.post('/:electionId', auth, async (req, res) => {
  try {
    const { electionId } = req.params;
    let { option, candidate, faceVerified } = req.body;

    // ✅ Accept either "option" or "candidate"
    option = option || candidate;

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

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

    console.log("req.body:", req.body);
    console.log("option:", option, "faceVerified:", faceVerified);
    console.log("candidates:", candidates);

    if (!candidates.includes(option)) {
      return res.status(400).json({
        message: `Invalid option. Valid options are: ${candidates.join(', ')}`
      });
    }

    if (!faceVerified) {
      await FraudLog.create({
        userId: req.user.id,
        electionId,
        type: 'FaceMismatch',
        details: 'Client reported faceVerified=false'
      });
      return res.status(400).json({ message: 'Face verification failed' });
    }

    const user = await User.findById(req.user.id);
    if (!user.age) return res.status(400).json({ message: 'User age not set' });

    const eligible = election.eligibleAgeGroups.some(
      group => user.age >= group.min && user.age <= group.max
    );
    if (!eligible) {
      return res
        .status(403)
        .json({ message: 'You are not eligible to vote in this election' });
    }

    const ip = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    const vote = await Vote.create({
      electionId,
      userId: req.user.id,
      option,
      verifiedByFace: true,
      ip,
      userAgent
    });

    res.status(201).json({ message: 'Vote cast', voteId: vote._id });
  } catch (e) {
    if (e?.code === 11000) {
      await FraudLog.create({
        userId: req.user.id,
        electionId: req.params.electionId,
        type: 'RepeatVoteAttempt',
        details: 'User attempted to vote again'
      });
      return res
        .status(409)
        .json({ message: 'You have already voted in this election' });
    }
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected: my vote
router.get('/mine/:electionId', auth, async (req, res) => {
  const v = await Vote.findOne({
    electionId: req.params.electionId,
    userId: req.user.id
  });
  res.json(v || null);
});

export default router;
