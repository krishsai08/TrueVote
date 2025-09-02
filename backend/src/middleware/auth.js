import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';

export async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    
    // Fetch full user data for operations that need age, etc.
    const user = await User.findById(payload.id).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'User not found' });
    
    // Use the method to ensure age is properly calculated
    const userObject = user.getUserWithAge();
    
    req.user = userObject; // Full user object with age, role, etc.
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
