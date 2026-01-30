import { Router } from 'express';
import { getBuyerProfile, updateBuyerProfile } from '../controllers/buyerProfileController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/:buyerId', authenticate, getBuyerProfile);
router.put('/:buyerId', authenticate, authorize('buyer', 'admin'), updateBuyerProfile);

export default router;
