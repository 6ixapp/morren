import { Router } from 'express';
import {
  getItems,
  getActiveItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/itemController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', getItems);
router.get('/active', getActiveItems);
router.get('/:id', getItemById);
router.post('/', authenticate, authorize('admin', 'seller', 'buyer'), createItem);
router.patch('/:id', authenticate, authorize('admin', 'seller'), updateItem);
router.delete('/:id', authenticate, authorize('admin', 'seller'), deleteItem);

export default router;
