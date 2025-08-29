import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import xssClean from 'xss-clean';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import { connectDB } from './db/mongoose.js';

import authRoutes from './routes/auth.js';
import electionRoutes from './routes/elections.js';
import voteRoutes from './routes/votes.js';
import adminRoutes from './routes/admin.js';


const app = express();

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
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

connectDB().then(() => {
  app.listen(config.PORT, () => console.log('API on :' + config.PORT));
}).catch(err => {
  console.error('DB connection failed', err);
});
