import express from 'express';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import FraudLog from '../models/FraudLog.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

/**
 * --- Admin Routes ---
 */

// Create election
router.post('/elections', auth, requireRole('admin'), async (req, res) => {
  try {
    const { title, candidates, startTime, endTime, eligibleAgeGroups } = req.body;
    if (!title || !candidates) return res.status(400).json({ message: 'Title and candidates required' });

    const normalizedCandidates = Array.isArray(candidates)
      ? candidates.map(c => c.trim()).filter(Boolean)
      : candidates.split(',').map(c => c.trim()).filter(Boolean);

    if (normalizedCandidates.length < 2) return res.status(400).json({ message: 'At least 2 candidates required' });

    const election = await Election.create({
      title,
      candidates: normalizedCandidates,
      startTime,
      endTime,
      status: 'scheduled',
      eligibleAgeGroups: eligibleAgeGroups || [],
    });

    res.status(201).json(election);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update election
router.put('/elections/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.candidates) {
      updateData.candidates = Array.isArray(updateData.candidates)
        ? updateData.candidates.map(c => c.trim()).filter(Boolean)
        : updateData.candidates.split(',').map(c => c.trim()).filter(Boolean);
    }

    const election = await Election.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!election) return res.status(404).json({ message: 'Election not found' });

    res.json(election);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete election
router.delete('/elections/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const election = await Election.findByIdAndDelete(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    await Vote.deleteMany({ electionId: req.params.id });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch all elections (admin only)
router.get('/elections', auth, requireRole('admin'), async (_req, res) => {
  try {
    const elections = await Election.find({}).sort({ startTime: -1 });
    res.json(elections);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch single election (admin only)
router.get('/elections/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    res.json({ election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Suspend election
router.patch('/elections/:id/suspend', auth, requireRole('admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    if (election.status === 'suspended') return res.status(400).json({ message: 'Election already suspended' });

    election.status = 'suspended';
    await election.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`election-${election._id}`).emit('election-suspended', {
        electionId: election._id,
        timestamp: new Date()
      });

      io.to('admin-room').emit('election-updated', {
        electionId: election._id,
        action: 'suspended',
        timestamp: new Date()
      });
    }

    res.json({ message: 'Election suspended successfully', election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resume election
router.patch('/elections/:id/resume', auth, requireRole('admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    if (election.status === 'active') return res.status(400).json({ message: 'Election already active' });

    const { newEndDate } = req.body;
    if (newEndDate) {
      const parsedDate = new Date(newEndDate);
      if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: 'Invalid newEndDate format' });
      election.endTime = parsedDate;
    }

    election.status = 'active';
    await election.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`election-${election._id}`).emit('election-resumed', {
        electionId: election._id,
        newEndDate: election.endTime,
        timestamp: new Date()
      });

      io.to('admin-room').emit('election-updated', {
        electionId: election._id,
        action: 'resumed',
        timestamp: new Date()
      });
    }

    res.json({ message: 'Election resumed successfully', election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Release results
router.patch('/elections/:id/release-results', auth, requireRole('admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    if (election.resultsReleased) return res.status(400).json({ message: 'Results already released' });

    election.resultsReleased = true;
    await election.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`election-${election._id}`).emit('results-released', {
        electionId: election._id,
        timestamp: new Date()
      });

      io.to('admin-room').emit('election-updated', {
        electionId: election._id,
        action: 'results-released',
        timestamp: new Date()
      });
    }

    res.json({ message: 'Results released successfully', election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch admin results
router.get('/results/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    // First, let's see what votes exist for this election
    const allVotes = await Vote.find({ electionId: election._id });

    // Simple approach: count votes for each candidate
    const voteCounts = {};
    allVotes.forEach(vote => {
      if (vote.option && vote.option.trim() !== '') {
        voteCounts[vote.option] = (voteCounts[vote.option] || 0) + 1;
      }
    });

    // Convert to array format
    const results = Object.entries(voteCounts)
      .map(([candidate, count]) => ({ candidate, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ election, results });
  } catch (err) {
    console.error('Admin results error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Extend election (Admin)
router.patch('/elections/:id/extend', auth, requireRole('admin'), async (req, res) => {
  try {
    const { newEndDate } = req.body;
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    if (!newEndDate) return res.status(400).json({ message: 'newEndDate is required' });
    const parsedDate = new Date(newEndDate);
    if (isNaN(parsedDate.getTime())) return res.status(400).json({ message: 'Invalid date format' });

    election.endTime = parsedDate;
    election.status = 'active'; // ensure election is active after extension
    await election.save();

    res.json({ message: 'Election extended successfully', election });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fraud logs - Get all fraud logs with filtering and pagination
router.get('/fraud', auth, requireRole('admin'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      severity,
      resolved,
      electionId,
      userId,
      startDate,
      endDate
    } = req.query;

    const filter = {};
    
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (resolved !== undefined) filter.resolved = resolved === 'true';
    if (electionId) filter.electionId = electionId;
    if (userId) filter.userId = userId;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await FraudLog.find(filter)
      .populate('userId', 'name username email')
      .populate('electionId', 'title')
      .populate('resolvedBy', 'name username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FraudLog.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching fraud logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Fraud statistics
router.get('/fraud/statistics', auth, requireRole('admin'), async (req, res) => {
  try {
    const { getFraudStatistics } = await import('../utils/fraudLogger.js');
    const stats = await getFraudStatistics();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching fraud statistics:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single fraud log
router.get('/fraud/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const log = await FraudLog.findById(req.params.id)
      .populate('userId', 'name username email dateOfBirth')
      .populate('electionId', 'title startTime endTime')
      .populate('resolvedBy', 'name username');
    
    if (!log) {
      return res.status(404).json({ message: 'Fraud log not found' });
    }
    
    res.json(log);
  } catch (err) {
    console.error('Error fetching fraud log:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resolve fraud log
router.patch('/fraud/:id/resolve', auth, requireRole('admin'), async (req, res) => {
  try {
    const { resolutionNotes } = req.body;
    
    const log = await FraudLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Fraud log not found' });
    }
    
    if (log.resolved) {
      return res.status(400).json({ message: 'Fraud log already resolved' });
    }
    
    log.resolved = true;
    log.resolvedBy = req.user._id;
    log.resolvedAt = new Date();
    log.resolutionNotes = resolutionNotes || '';
    
    await log.save();
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('fraud-resolved', {
        fraudLogId: log._id,
        resolvedBy: req.user._id,
        timestamp: new Date()
      });
    }
    
    res.json({ message: 'Fraud log resolved successfully', log });
  } catch (err) {
    console.error('Error resolving fraud log:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unresolve fraud log
router.patch('/fraud/:id/unresolve', auth, requireRole('admin'), async (req, res) => {
  try {
    const log = await FraudLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Fraud log not found' });
    }
    
    if (!log.resolved) {
      return res.status(400).json({ message: 'Fraud log is not resolved' });
    }
    
    log.resolved = false;
    log.resolvedBy = undefined;
    log.resolvedAt = undefined;
    log.resolutionNotes = '';
    
    await log.save();
    
    res.json({ message: 'Fraud log unresolved successfully', log });
  } catch (err) {
    console.error('Error unresolving fraud log:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete fraud log
router.delete('/fraud/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const log = await FraudLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ message: 'Fraud log not found' });
    }
    
    res.json({ message: 'Fraud log deleted successfully' });
  } catch (err) {
    console.error('Error deleting fraud log:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk resolve fraud logs
router.patch('/fraud/bulk/resolve', auth, requireRole('admin'), async (req, res) => {
  try {
    const { logIds, resolutionNotes } = req.body;
    
    if (!Array.isArray(logIds) || logIds.length === 0) {
      return res.status(400).json({ message: 'Log IDs array is required' });
    }
    
    const result = await FraudLog.updateMany(
      { _id: { $in: logIds }, resolved: false },
      {
        resolved: true,
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        resolutionNotes: resolutionNotes || 'Bulk resolved'
      }
    );
    
    res.json({ 
      message: `${result.modifiedCount} fraud logs resolved successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Error bulk resolving fraud logs:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check votes
router.get('/debug/votes/:electionId', auth, requireRole('admin'), async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const votes = await Vote.find({ electionId });
    
    const voteDetails = votes.map(v => ({
      id: v._id,
      userId: v.userId,
      option: v.option,
      createdAt: v.createdAt
    }));
    
    res.json({ 
      electionId, 
      totalVotes: votes.length, 
      votes: voteDetails 
    });
  } catch (err) {
    console.error('Debug votes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
