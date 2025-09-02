import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import xssClean from 'xss-clean';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { config } from './config/env.js';
import { connectDB } from './db/mongoose.js';

import authRoutes from './routes/auth.js';
import electionRoutes from './routes/elections.js';
import voteRoutes from './routes/votes.js';
import adminRoutes from './routes/admin.js';
import announcementRoutes from './routes/announcements.js';
import otpRoutes from './routes/otp.js';

const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: config.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(xssClean());
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use(limiter);

app.get('/', (_req, res) => res.send('Smart E-Vote API'));

app.use('/api/auth', authRoutes);
app.use('/api/elections', electionRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/otp', otpRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join election room
  socket.on('join-election', (electionId) => {
    socket.join(`election-${electionId}`);
    console.log(`User ${socket.id} joined election ${electionId}`);
  });

  // Leave election room
  socket.on('leave-election', (electionId) => {
    socket.leave(`election-${electionId}`);
    console.log(`User ${socket.id} left election ${electionId}`);
  });

  // Join admin room
  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log(`Admin ${socket.id} joined admin room`);
  });

  // Join user room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined user room`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Export io for use in routes
app.set('io', io);

connectDB().then(() => {
  server.listen(config.PORT, () => console.log('API on :' + config.PORT));
}).catch(err => {
  console.error('DB connection failed', err);
});
