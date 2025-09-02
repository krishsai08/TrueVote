import express from 'express';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import { auth } from '../middleware/auth.js';
import { sendOTPEmail } from '../utils/email.js';

const router = express.Router();

// Generate and send OTP for voting
router.post('/generate', auth, async (req, res) => {
  try {
    const { electionId } = req.body;
    const userId = req.user._id;

    // Validate electionId
    if (!electionId) {
      return res.status(400).json({ message: 'Election ID is required' });
    }

    // Check if election exists and is within active time window
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const now = new Date();
    if (now < election.startTime || now > election.endTime) {
      return res.status(400).json({ message: 'Election not active' });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({ userId, electionId });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Get user details (from auth middleware)
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has a valid email
    if (!user.email) {
      return res.status(400).json({ message: 'Email address is required for OTP verification' });
    }

    // Debug: log which email we will use to send OTP (do not log OTP)
    console.log('Sending OTP to email:', user.email, 'for userId:', userId.toString());

    // Check if there's already a valid OTP for this user and election
    const existingOTP = await OTP.findOne({
      userId,
      electionId,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingOTP) {
      // If OTP exists and is still valid, resend it
      const emailResult = await sendOTPEmail(
        user.email,
        user.name || user.username,
        existingOTP.otp,
        election.title
      );

      if (emailResult.success) {
        return res.json({
          message: 'OTP resent successfully',
          expiresIn: '5 minutes',
          email: user.email
        });
      } else {
        return res.status(500).json({ 
          message: 'Failed to send OTP email',
          error: emailResult.error || undefined
        });
      }
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create OTP record
    const newOTP = new OTP({
      email: user.email,
      otp,
      electionId,
      userId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    });

    await newOTP.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(
      user.email,
      user.name || user.username,
      otp,
      election.title
    );

    if (emailResult.success) {
      res.json({
        message: 'OTP sent successfully',
        expiresIn: '5 minutes',
        email: user.email
      });
    } else {
      // If email fails, delete the OTP and return error
      await newOTP.deleteOne();
      res.status(500).json({ 
        message: 'Failed to send OTP email',
        error: emailResult.error || undefined
      });
    }

  } catch (error) {
    console.error('Error generating OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP for voting
router.post('/verify', auth, async (req, res) => {
  try {
    const { electionId, otp } = req.body;
    const userId = req.user._id;

    // Validate inputs
    if (!electionId || !otp) {
      return res.status(400).json({ message: 'Election ID and OTP are required' });
    }

    // Check if election exists and is within active time window
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const now = new Date();
    if (now < election.startTime || now > election.endTime) {
      return res.status(400).json({ message: 'Election not active' });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({ userId, electionId });
    if (existingVote) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Find and validate OTP
    const otpRecord = await OTP.findOne({
      userId,
      electionId,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Generate a verification token for voting
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Store verification token in session or temporary storage
    // For now, we'll return it in response (in production, use Redis or similar)
    res.json({
      message: 'OTP verified successfully',
      verificationToken,
      validFor: '10 minutes'
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend OTP (if user didn't receive it)
router.post('/resend', auth, async (req, res) => {
  try {
    const { electionId } = req.body;
    const userId = req.user._id;

    // Validate electionId
    if (!electionId) {
      return res.status(400).json({ message: 'Election ID is required' });
    }

    // Check if election exists and is within active time window
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const now = new Date();
    if (now < election.startTime || now > election.endTime) {
      return res.status(400).json({ message: 'Election not active' });
    }

    // Get user details (from auth middleware)
    const user = req.user;
    if (!user || !user.email) {
      return res.status(400).json({ message: 'User email not found' });
    }

    // Debug: log which email we will use to resend OTP
    console.log('Resending OTP to email:', user.email, 'for userId:', userId.toString());

    // Delete any existing OTPs for this user and election
    await OTP.deleteMany({ userId, electionId });

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create new OTP record
    const newOTP = new OTP({
      email: user.email,
      otp,
      electionId,
      userId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    });

    await newOTP.save();

    // Send new OTP email
    const emailResult = await sendOTPEmail(
      user.email,
      user.name || user.username,
      otp,
      election.title
    );

    if (emailResult.success) {
      res.json({
        message: 'New OTP sent successfully',
        expiresIn: '5 minutes',
        email: user.email
      });
    } else {
      // If email fails, delete the OTP and return error
      await newOTP.deleteOne();
      res.status(500).json({ 
        message: 'Failed to send OTP email',
        error: emailResult.error || undefined
      });
    }

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 