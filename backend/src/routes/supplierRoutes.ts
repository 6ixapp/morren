import { Router } from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplierController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getSuppliers);
router.get('/:id', authenticate, getSupplierById);
router.post('/', authenticate, authorize('admin', 'buyer'), createSupplier);
router.patch('/:id', authenticate, authorize('admin', 'buyer'), updateSupplier);
router.delete('/:id', authenticate, authorize('admin'), deleteSupplier);

export default router;
