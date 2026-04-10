import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { handleInteraktWebhook, rebroadcastOrderAuction } from '../controllers/whatsappController';

const router = Router();

// Public webhook endpoint for Interakt callbacks
router.post('/interakt/webhook', handleInteraktWebhook);

// Manual order auction rebroadcast
router.post('/order/:orderId/broadcast', authenticate, authorize('admin', 'buyer'), rebroadcastOrderAuction);

export default router;
