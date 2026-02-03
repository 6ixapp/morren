import { Router } from 'express';
import {
  sendNotificationToRole,
  sendNotificationToUser,
  notifyAllSellers,
  notifyAllShippingProviders,
} from '../controllers/notificationController';

const router = Router();

/**
 * Notification Routes
 * All routes require authentication (handled by middleware in parent)
 */

// POST /api/notifications/send - Send notification by role
router.post('/send', sendNotificationToRole);

// POST /api/notifications/send-to-user - Send notification to specific user
router.post('/send-to-user', sendNotificationToUser);

// POST /api/notifications/send-to-sellers - Notify all sellers (convenience)
router.post('/send-to-sellers', notifyAllSellers);

// POST /api/notifications/send-to-shipping-providers - Notify all shipping providers (convenience)
router.post('/send-to-shipping-providers', notifyAllShippingProviders);

export default router;
