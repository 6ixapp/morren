/**
 * Cardamom Price Routes
 * API routes for cardamom market price data
 */

import { Router } from 'express';
import {
  getCardamomPrices,
  getCardamomStats,
  getCardamomVarieties,
  getCardamomMarkets,
  refreshCardamomPrices,
} from '../controllers/cardamomPriceController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes - Anyone can view cardamom prices
router.get('/', getCardamomPrices);
router.get('/stats', getCardamomStats);
router.get('/varieties', getCardamomVarieties);
router.get('/markets', getCardamomMarkets);

// Protected route - Only authenticated admin/buyer can manually refresh prices
router.post(
  '/refresh',
  authenticate,
  authorize('admin', 'buyer'),
  refreshCardamomPrices
);

export default router;
