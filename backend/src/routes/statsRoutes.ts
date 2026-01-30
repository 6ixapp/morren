import { Router } from 'express';
import { getBuyerStats, getSellerStats, getAdminStats } from '../controllers/statsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/buyer/:buyerId', authenticate, getBuyerStats);
router.get('/seller/:sellerId', authenticate, getSellerStats);
router.get('/admin', authenticate, authorize('admin'), getAdminStats);

export default router;
