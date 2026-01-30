import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  getOrdersByBuyer,
  getOrdersBySeller,
  getSellerItemOrders,
  getOrdersForShipping,
  createOrder,
  updateOrder,
  deleteOrder,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), getOrders);
router.get('/shipping', authenticate, authorize('shipping_provider', 'admin'), getOrdersForShipping);
router.get('/buyer/:buyerId', authenticate, getOrdersByBuyer);
router.get('/seller/:sellerId', authenticate, getOrdersBySeller);
router.get('/seller/:sellerId/items', authenticate, getSellerItemOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/', authenticate, authorize('buyer', 'admin'), createOrder);
router.patch('/:id', authenticate, updateOrder);
router.delete('/:id', authenticate, authorize('admin', 'buyer'), deleteOrder);

export default router;
