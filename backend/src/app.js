import cors from 'cors';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import claimRoutes from './routes/claimRoutes.js';
import { getEnv } from './config/env.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const env = getEnv();
const app = express();

const allowedOrigins = env.clientUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    const error = new Error('Origin is not allowed by CORS');
    error.statusCode = 403;
    callback(error);
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    success: true,
    data: { status: 'ok', service: 'claims-api' },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/claims', claimRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
