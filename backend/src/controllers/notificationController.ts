import { Request, Response } from 'express';
import axios from 'axios';
import { query } from '../db/index';

/**
 * OneSignal REST API Configuration
 * Set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in .env
 */
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

interface NotificationPayload {
  title: string;
  message: string;
  data?: Record<string, string>;
}

/**
 * Send push notification via OneSignal REST API
 */
async function sendOneSignalNotification(
  filters: any[],
  payload: NotificationPayload
): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('⚠️ OneSignal not configured. Set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in .env');
    return false;
  }

  try {
    const response = await axios.post(
      ONESIGNAL_API_URL,
      {
        app_id: ONESIGNAL_APP_ID,
        filters,
        headings: { en: payload.title },
        contents: { en: payload.message },
        data: payload.data || {},
      },
      {
        headers: {
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ OneSignal notification sent:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ OneSignal API error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Send notification to users with specific external_user_id
 */
async function sendToExternalUserId(
  externalUserId: string,
  payload: NotificationPayload
): Promise<boolean> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.warn('⚠️ OneSignal not configured.');
    return false;
  }

  try {
    const response = await axios.post(
      ONESIGNAL_API_URL,
      {
        app_id: ONESIGNAL_APP_ID,
        include_aliases: {
          external_id: [externalUserId],
        },
        target_channel: 'push',
        headings: { en: payload.title },
        contents: { en: payload.message },
        data: payload.data || {},
      },
      {
        headers: {
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ OneSignal notification sent to user:', externalUserId);
    return true;
  } catch (error: any) {
    console.error('❌ OneSignal API error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * POST /api/notifications/send
 * Send notification to users by role (uses OneSignal tags)
 */
export async function sendNotificationToRole(req: Request, res: Response) {
  const { targetRole, title, message, data } = req.body;

  if (!targetRole || !title || !message) {
    return res.status(400).json({ error: 'targetRole, title, and message are required' });
  }

  // Use OneSignal filter to target users with specific role tag
  const filters = [
    { field: 'tag', key: 'user_role', relation: '=', value: targetRole },
  ];

  const success = await sendOneSignalNotification(filters, { title, message, data });

  if (success) {
    res.json({ success: true, message: `Notification sent to all ${targetRole}s` });
  } else {
    res.status(500).json({ error: 'Failed to send notification' });
  }
}

/**
 * POST /api/notifications/send-to-user
 * Send notification to a specific user by their external user ID
 */
export async function sendNotificationToUser(req: Request, res: Response) {
  const { externalUserId, title, message, data } = req.body;

  if (!externalUserId || !title || !message) {
    return res.status(400).json({ error: 'externalUserId, title, and message are required' });
  }

  const success = await sendToExternalUserId(externalUserId, { title, message, data });

  if (success) {
    res.json({ success: true, message: `Notification sent to user ${externalUserId}` });
  } else {
    res.status(500).json({ error: 'Failed to send notification' });
  }
}

/**
 * POST /api/notifications/send-to-sellers
 * Convenience endpoint to notify all sellers about a new bid request
 */
export async function notifyAllSellers(req: Request, res: Response) {
  const { productName, quantity, buyerName } = req.body;

  if (!productName) {
    return res.status(400).json({ error: 'productName is required' });
  }

  const filters = [
    { field: 'tag', key: 'user_role', relation: '=', value: 'seller' },
  ];

  const success = await sendOneSignalNotification(filters, {
    title: '🔔 New Bid Request!',
    message: `${productName} - ${quantity || 'N/A'} units available for bidding`,
    data: {
      type: 'new_bid_request',
      product: productName,
      quantity: String(quantity || 0),
    },
  });

  if (success) {
    res.json({ success: true, message: 'Sellers notified' });
  } else {
    res.status(500).json({ error: 'Failed to notify sellers' });
  }
}

/**
 * POST /api/notifications/send-to-shipping-providers
 * Convenience endpoint to notify all shipping providers about a new order
 */
export async function notifyAllShippingProviders(req: Request, res: Response) {
  const { productName, destination } = req.body;

  if (!productName) {
    return res.status(400).json({ error: 'productName is required' });
  }

  const filters = [
    { field: 'tag', key: 'user_role', relation: '=', value: 'shipping_provider' },
  ];

  const success = await sendOneSignalNotification(filters, {
    title: '📦 New Shipping Request!',
    message: `Shipping needed for ${productName} to ${destination || 'specified location'}`,
    data: {
      type: 'new_shipping_request',
      product: productName,
      destination: destination || '',
    },
  });

  if (success) {
    res.json({ success: true, message: 'Shipping providers notified' });
  } else {
    res.status(500).json({ error: 'Failed to notify shipping providers' });
  }
}
