import express from 'express';
import Election from '../models/Election.js';

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

export default router;
