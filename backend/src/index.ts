import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { errorHandler } from './utils/errorHandler';
import { runMigrations } from './db/migrate';
import { initScheduledJobs } from './services/schedulerService';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import itemRoutes from './routes/itemRoutes';
import orderRoutes from './routes/orderRoutes';
import bidRoutes from './routes/bidRoutes';
import shippingBidRoutes from './routes/shippingBidRoutes';
import statsRoutes from './routes/statsRoutes';
import supplierRoutes from './routes/supplierRoutes';
import rfqRoutes from './routes/rfqRoutes';
import marketPriceRoutes from './routes/marketPriceRoutes';
import buyerProfileRoutes from './routes/buyerProfileRoutes';
import notificationRoutes from './routes/notificationRoutes';
import sellerPublicRoutes from './routes/sellerPublicRoutes';
import cardamomPriceRoutes from './routes/cardamomPriceRoutes';
import whatsappRoutes from './routes/whatsappRoutes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production'
      ? [
          'https://zentrip.social',
          'https://www.zentrip.social',
          'https://app.zentrip.social',
          /^https:\/\/.*\.vercel\.app$/,  // Allow all Vercel deployments
          'http://localhost:3000',  // For local testing
        ]
      : [
          'http://localhost:3000',
          'http://10.34.242.101:3000',
          /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/, // Allow any device on local/hotspot network
          /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Home network devices
        ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging: avoid synchronous log I/O for every request in production.
app.use((req, res, next) => {
  if (req.path === '/health' && process.env.NODE_ENV === 'production') {
    next();
    return;
  }

  const startedAt = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    if (process.env.NODE_ENV !== 'production' || duration >= 500) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/shipping-bids', shippingBidRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/market-prices', marketPriceRoutes);
app.use('/api/buyer-profiles', buyerProfileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sellers', sellerPublicRoutes);
app.use('/api/cardamom-prices', cardamomPriceRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server first so Railway healthcheck passes, then run migrations in background.
function startServer() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL is not set. Set it in backend/.env (e.g. postgresql://user:password@127.0.0.1:5432/morren_db) and ensure PostgreSQL is running.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);

    runMigrations()
      .then(() => {
        console.log('✅ Database migrations complete');
        // Initialize scheduled jobs after migrations complete
        initScheduledJobs();
      })
      .catch((error) => {
        console.error('❌ Database migrations failed:', error);
        if (process.env.NODE_ENV === 'production') {
          process.exit(1);
        }
        console.warn('⚠️  Server kept running (development). Fix DATABASE_URL and restart to run migrations.');
      });
  });
}

startServer();

export default app;
