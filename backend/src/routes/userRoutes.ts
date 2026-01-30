import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  createSellerAccount,
  deleteUser,
} from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin'), getUsers);
router.get('/:id', authenticate, getUserById);
router.post('/', authenticate, authorize('admin'), createUser);
router.patch('/:id', authenticate, updateUser);
router.post('/seller', authenticate, authorize('admin'), createSellerAccount);
router.delete('/:id', authenticate, authorize('admin'), deleteUser);

export default router;
