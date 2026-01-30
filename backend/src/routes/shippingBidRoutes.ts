import { Router } from 'express';
import {
  getShippingBids,
  getShippingBidById,
  getShippingBidsByOrder,
  getShippingBidsByProvider,
  createShippingBid,
  updateShippingBid,
  deleteShippingBid,
} from '../controllers/shippingBidController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), getShippingBids);
router.get('/order/:orderId', authenticate, getShippingBidsByOrder);
router.get('/provider/:providerId', authenticate, getShippingBidsByProvider);
router.get('/:id', authenticate, getShippingBidById);
router.post('/', authenticate, authorize('shipping_provider', 'admin'), createShippingBid);
router.patch('/:id', authenticate, updateShippingBid);
router.delete('/:id', authenticate, authorize('shipping_provider', 'admin'), deleteShippingBid);

export default router;
