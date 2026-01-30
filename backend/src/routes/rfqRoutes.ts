import { Router } from 'express';
import {
  getRFQs,
  getRFQById,
  getRFQByInviteToken,
  createRFQ,
  updateRFQ,
  addInviteToRFQ,
  markInviteViewed,
  submitQuote,
  awardRFQ,
} from '../controllers/rfqController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getRFQs);
router.get('/by-invite/:token', getRFQByInviteToken); // Public for suppliers
router.get('/:id', authenticate, getRFQById);
router.post('/', authenticate, authorize('buyer', 'admin'), createRFQ);
router.patch('/:id', authenticate, authorize('buyer', 'admin'), updateRFQ);
router.post('/:id/invites', authenticate, authorize('buyer', 'admin'), addInviteToRFQ);
router.patch('/invites/viewed', markInviteViewed); // Public for suppliers
router.post('/:id/quote', submitQuote); // Public for suppliers
router.post('/:id/award', authenticate, authorize('buyer', 'admin'), awardRFQ);

export default router;
