/**
 * Seller Public Profile Routes
 *
 * Public-facing seller information endpoints
 */

import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSellerPublicProfile,
  getOrderBidders,
} from '../controllers/sellerPublicController';
import { asyncHandler } from '../utils/errorHandler';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/sellers/:sellerId/public-profile
 * Get public profile for a seller
 * Accessible by any authenticated user
 */
router.get('/:sellerId/public-profile', asyncHandler(getSellerPublicProfile));

/**
 * GET /api/orders/:orderId/bidders
 * Get list of bidders (sellers) for an order
 * Only accessible by the buyer who owns the order
 */
router.get('/orders/:orderId/bidders', asyncHandler(getOrderBidders));

export default router;
