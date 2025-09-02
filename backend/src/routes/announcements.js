import express from 'express';
import Announcement from '../models/Announcement.js';
import { auth } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

// Get all active announcements (for users)
router.get('/public', async (req, res) => {
  try {
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    })
    .populate('author', 'name')
    .sort({ priority: -1, createdAt: -1 })
    .limit(10);

    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all announcements (admin only)
router.get('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 });

    res.json({ announcements });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new announcement (admin only)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { title, content, priority, expiresAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const announcement = new Announcement({
      title,
      content,
      author: req.user.id,
      priority: priority || 'medium',
      expiresAt: expiresAt || null
    });

    await announcement.save();
    
    const populatedAnnouncement = await announcement.populate('author', 'name');
    res.status(201).json({ announcement: populatedAnnouncement });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update announcement (admin only)
router.put('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { title, content, priority, isActive, expiresAt } = req.body;

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;
    announcement.priority = priority || announcement.priority;
    announcement.isActive = isActive !== undefined ? isActive : announcement.isActive;
    announcement.expiresAt = expiresAt !== undefined ? expiresAt : announcement.expiresAt;

    await announcement.save();
    
    const updatedAnnouncement = await announcement.populate('author', 'name');
    res.json({ announcement: updatedAnnouncement });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete announcement (admin only)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await announcement.deleteOne();
    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle announcement status (admin only)
router.patch('/:id/toggle', auth, requireRole('admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();
    
    const updatedAnnouncement = await announcement.populate('author', 'name');
    res.json({ announcement: updatedAnnouncement });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 