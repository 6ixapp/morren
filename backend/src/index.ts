import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { errorHandler } from './utils/errorHandler';
import { runMigrations } from './db/migrate';

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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server first so Railway healthcheck passes, then run migrations in background.
// If migrations fail, we exit(1) so deploy logs show the error and container restarts.
function startServer() {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);

    runMigrations()
      .then(() => console.log('✅ Database migrations complete'))
      .catch((error) => {
        console.error('❌ Database migrations failed:', error);
        process.exit(1);
      });
  });
}

startServer();

export default app;
