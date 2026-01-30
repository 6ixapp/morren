import { Router } from 'express';
import {
  getBids,
  getBidById,
  getBidsByOrder,
  getBidsBySeller,
  createBid,
  updateBid,
  deleteBid,
} from '../controllers/bidController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), getBids);
router.get('/order/:orderId', authenticate, getBidsByOrder);
router.get('/seller/:sellerId', authenticate, getBidsBySeller);
router.get('/:id', authenticate, getBidById);
router.post('/', authenticate, authorize('seller', 'admin'), createBid);
router.patch('/:id', authenticate, updateBid);
router.delete('/:id', authenticate, authorize('seller', 'admin'), deleteBid);

export default router;
