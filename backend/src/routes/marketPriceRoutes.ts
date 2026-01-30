import { Router } from 'express';
import {
  getMarketPrices,
  addMarketPrice,
  deleteMarketPrice,
} from '../controllers/marketPriceController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getMarketPrices); // Public
router.post('/', authenticate, authorize('admin', 'buyer'), addMarketPrice);
router.delete('/:id', authenticate, authorize('admin'), deleteMarketPrice);

export default router;
