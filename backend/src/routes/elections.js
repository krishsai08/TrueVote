import express from 'express';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public: list elections with derived status
router.get('/', async (_req, res) => {
  const now = new Date();
  const elections = await Election.find({}).sort({ startTime: -1 }).lean();
  const withStatus = elections.map(e => {
    let status = e.status;
    if (now < e.startTime) status = 'scheduled';
    else if (now >= e.startTime && now <= e.endTime) status = 'ongoing';
    else status = 'closed';
    return { ...e, status };
  });
  res.json(withStatus);
});

// Public: election by id
router.get('/:id', async (req, res) => {
  const e = await Election.findById(req.params.id);
  if (!e) return res.status(404).json({ message: 'Not found' });
  res.json(e);
});

// Protected: list elections with user eligibility (for authenticated users)
router.get('/user/list', auth, async (req, res) => {
  try {
    const elections = await Election.find({}).sort({ startTime: -1 });

    // Mark eligibility for each election for this user
    const user = req.user;
    const age = user.age;
    const now = new Date();

    const electionsWithEligibility = elections.map(election => {
      // Calculate current status based on time
      let status = election.status;
      if (now < election.startTime) status = 'scheduled';
      else if (now >= election.startTime && now <= election.endTime) status = 'ongoing';
      else status = 'closed';

      const eligible = election.eligibleAgeGroups && election.eligibleAgeGroups.length > 0
        ? election.eligibleAgeGroups.some(group => age >= group.min && age <= group.max)
        : true;
      
      return { 
        ...election.toObject(), 
        status, // Use calculated status
        userEligibility: eligible ? 'Eligible' : 'Not Eligible' 
      };
    });

    res.json(electionsWithEligibility);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected: single election info with user eligibility
router.get('/user/:id', auth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });

    const user = req.user;
    const age = user.age;
    const now = new Date();

    // Calculate current status based on time
    let status = election.status;
    if (now < election.startTime) status = 'scheduled';
    else if (now >= election.startTime && now <= election.endTime) status = 'ongoing';
    else status = 'closed';

    const eligible = election.eligibleAgeGroups && election.eligibleAgeGroups.length > 0
      ? election.eligibleAgeGroups.some(group => age >= group.min && age <= group.max)
      : true;

    // Gate: if user already voted and results are not released yet, block access
    const existingVote = await Vote.findOne({ userId: user._id, electionId: election._id });
    if (existingVote && !election.resultsReleased) {
      return res.status(403).json({ 
        message: 'You have already cast your vote. Access will reopen when results are released.',
        code: 'ALREADY_VOTED_WAIT_FOR_RESULTS'
      });
    }

    res.json({ 
      election: { ...election.toObject(), status }, // Include calculated status
      userEligibility: eligible ? 'Eligible' : 'Not Eligible', 
      userAge: age 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if results are released (without fetching actual results)
router.get('/:id/results/status', auth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    
    res.json({ 
      electionId: election._id,
      resultsReleased: election.resultsReleased,
      message: election.resultsReleased ? 'Results are available' : 'Results not yet released'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public results (for released elections)
router.get('/:id/results/public', auth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    if (!election.resultsReleased) {
      return res.status(403).json({ 
        message: 'Results not yet released by administrator',
        code: 'RESULTS_NOT_RELEASED'
      });
    }

    const byCandidate = await Vote.aggregate([
      { $match: { electionId: election._id, option: { $ne: "" } } },
      { $group: { _id: "$option", count: { $sum: 1 } } },
      { $project: { candidate: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    const results = byCandidate.map(item => ({
      candidate: election.candidates.find(c => c === item.candidate) || item.candidate,
      count: item.count,
    }));

    res.json({ election, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
