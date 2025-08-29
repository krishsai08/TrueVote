import express from 'express';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import FraudLog from '../models/FraudLog.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// --- Admin: create election with age groups ---
router.post('/elections', auth, requireRole('admin'), async (req, res) => {
  try {
    const { title, candidates, startTime, endTime, eligibleAgeGroups } = req.body;

    if (!title || !candidates) {
      return res.status(400).json({ message: 'Title and candidates are required' });
    }

    // ✅ Normalize candidates into array of trimmed strings
    let normalizedCandidates = [];
    if (Array.isArray(candidates)) {
      normalizedCandidates = candidates.map(c => c.trim()).filter(Boolean);
    } else if (typeof candidates === 'string') {
      normalizedCandidates = candidates.split(',').map(c => c.trim()).filter(Boolean);
    }

    if (normalizedCandidates.length < 2) {
      return res.status(400).json({ message: 'At least 2 candidates required' });
    }

    // Validate age groups
    if (eligibleAgeGroups) {
      for (const group of eligibleAgeGroups) {
        if (group.min == null || group.max == null || group.min > group.max) {
          return res.status(400).json({ message: 'Invalid age group' });
        }
      }
    }

    const election = await Election.create({
      title,
      candidates: normalizedCandidates,
      startTime,
      endTime,
      status: 'scheduled',
      eligibleAgeGroups: eligibleAgeGroups || []
    });

    res.status(201).json(election);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Admin: update election (general) ---
router.put('/elections/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // ✅ Normalize candidates if updating them
    if (updateData.candidates) {
      if (Array.isArray(updateData.candidates)) {
        updateData.candidates = updateData.candidates.map(c => c.trim()).filter(Boolean);
      } else if (typeof updateData.candidates === 'string') {
        updateData.candidates = updateData.candidates.split(',').map(c => c.trim()).filter(Boolean);
      }
    }

    // Validate age groups
    if (updateData.eligibleAgeGroups) {
      for (const group of updateData.eligibleAgeGroups) {
        if (group.min == null || group.max == null || group.min > group.max) {
          return res.status(400).json({ message: 'Invalid age group' });
        }
      }
    }

    const election = await Election.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!election) return res.status(404).json({ message: 'Election not found' });
    res.json(election);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Admin: extend voting time ---
router.patch('/elections/:id/extend', auth, requireRole('admin'), async (req, res) => {
  try {
    const { extraMinutes } = req.body;
    if (!extraMinutes || extraMinutes <= 0) {
      return res.status(400).json({ message: 'extraMinutes must be positive' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    election.endTime = new Date(election.endTime.getTime() + extraMinutes * 60000);
    await election.save();

    res.json({ message: `Voting extended by ${extraMinutes} minutes`, endTime: election.endTime });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Admin: delete election ---
router.delete('/elections/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const election = await Election.findByIdAndDelete(req.params.id);
    if (!election) return res.status(404).json({ message: 'Not found' });
    await Vote.deleteMany({ electionId: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Admin: get election results ---
router.get('/results/:electionId', auth, requireRole('admin'), async (req, res) => {
  try {
    const { electionId } = req.params;
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const byCandidate = await Vote.aggregate([
      { $match: { electionId: election._id,option: { $ne: "" }  } },
      { $group: { _id: '$option', count: { $sum: 1 } } },
      { $project: { option: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } } // sort by most votes
    ]);

    const results = byCandidate.map((item) => {
      // If candidates are just IDs like "1", "2", map back to election.candidates
      const candidate =
        election.candidates.find((c) => c === item.option) || item.option;
      return { candidate, count: item.count };
    });

    res.json({
      election: {
        id: election._id,
        title: election.title,
        candidates: election.candidates,
      },
      results,
    });
  } catch (err) {
    console.error("Error fetching results:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Admin: fraud logs ---
router.get('/fraud', auth, requireRole('admin'), async (_req, res) => {
  const logs = await FraudLog.find({}).sort({ createdAt: -1 }).limit(200);
  res.json(logs);
});

// --- Admin: get all elections ---
router.get('/elections', auth, requireRole('admin'), async (_req, res) => {
  try {
    const elections = await Election.find({}).sort({ startTime: -1 });
    res.json(elections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
