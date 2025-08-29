import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import { hashPassword, comparePassword } from '../utils/password.js';
import { config } from '../config/env.js';
import { auth } from '../middleware/auth.js';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';

const router = express.Router();

// USER REGISTER
// USER REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, faceEmbedding, faceImageBase64, age, occupation } = req.body;
    if (!name || !email || !password || !age) 
      return res.status(400).json({ message: 'Missing required fields' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      age,
      occupation,
      faceEmbedding: faceEmbedding || [],
      faceImageBase64: faceImageBase64 || ''
    });

    return res.status(201).json({ id: user._id, email: user.email });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});


// USER LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    res.json({ token, role: user.role, name: user.name });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET PROFILE
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.status(404).json({ message: 'Not found' });

  res.json({
  id: user._id,
  name: user.name,
  role: user.role,
  age: user.age,
  occupation: user.occupation,
  faceEmbedding: user.faceEmbedding,
  faceImageBase64: user.faceImageBase64
});
});

// USER VOTES: see which votes user has polled
router.get('/my-votes', auth, async (req, res) => {
  try {
    const votes = await Vote.find({ userId: req.user.id }).populate('electionId', 'title');
    const result = votes.map(v => ({
      election: v.electionId?.title || 'Unknown',
      option: v.candidate,        // candidate voted
      timestamp: v.timestamp
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN REGISTER
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Admin already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = new User({ name, email, passwordHash, role: 'admin' });
    await admin.save();

    const token = jwt.sign({ id: admin._id, role: admin.role }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    res.status(201).json({ message: 'Admin registered', token, user: { name, email, role: 'admin' } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN RESULTS
router.get('/results/:electionId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { electionId } = req.params;
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const votes = await Vote.find({ electionId });

    const totalVotes = votes.length;
    const votesByOption = votes.reduce((acc, vote) => {
      acc[vote.candidate] = (acc[vote.candidate] || 0) + 1;
      return acc;
    }, {});

    // sort by count ascending
    const sortedVotes = Object.entries(votesByOption)
      .sort((a, b) => a[1] - b[1])
      .map(([candidate, count]) => ({ candidate, count }));

    res.json({
      election: election.title,
      totalVotes,
      votesByOption: sortedVotes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
