import { Request, Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { query } from '../db';
import { AppError } from '../utils/errorHandler';
import { createAuctionAndBroadcast, handleSellerWhatsAppMessage, isWhatsappAutomationEnabled } from '../services/whatsappAuctionService';

const INTERAKT_WEBHOOK_SECRET = process.env.INTERAKT_WEBHOOK_SECRET || '';

const parsePhoneFromPayload = (body: any): string => {
  return (
    body?.fromPhoneNumber ||
    body?.phoneNumber ||
    body?.mobile ||
    body?.whatsappNumber ||
    body?.data?.phoneNumber ||
    body?.data?.from ||
    body?.message?.from ||
    ''
  );
};

const parseMessageTextFromPayload = (body: any): string => {
  const textValue =
    body?.messageText ||
    body?.text ||
    body?.body ||
    body?.data?.message ||
    body?.message?.text ||
    body?.message?.body ||
    '';
  return String(textValue).trim();
};

// POST /api/whatsapp/order/:orderId/broadcast
export const rebroadcastOrderAuction = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { force } = req.body || {};

  if (req.user?.role === 'buyer') {
    const ownershipResult = await query('SELECT buyer_id FROM orders WHERE id = $1', [orderId]);
    if (ownershipResult.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }
    if (ownershipResult.rows[0].buyer_id !== req.user.userId) {
      throw new AppError('Not authorized to broadcast this order', 403);
    }
  }

  const summary = await createAuctionAndBroadcast(orderId, {
    forceRebroadcast: Boolean(force),
  });

  res.json({
    success: true,
    summary,
  });
});

// POST /api/whatsapp/interakt/webhook
export const handleInteraktWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!isWhatsappAutomationEnabled()) {
    res.json({ success: true, message: 'WhatsApp automation disabled' });
    return;
  }

  if (INTERAKT_WEBHOOK_SECRET) {
    const headerSecret = req.header('x-interakt-secret') || req.header('x-webhook-secret') || '';
    if (headerSecret !== INTERAKT_WEBHOOK_SECRET) {
      throw new AppError('Invalid webhook secret', 401);
    }
  }

  const fromPhoneNumber = parsePhoneFromPayload(req.body);
  const messageText = parseMessageTextFromPayload(req.body);
  const interaktMessageId = req.body?.id || req.body?.messageId || req.body?.message?.id || null;

  if (!fromPhoneNumber || !messageText) {
    res.status(400).json({
      success: false,
      error: 'Invalid webhook payload: phone and text are required',
    });
    return;
  }

  const result = await handleSellerWhatsAppMessage({
    fromPhoneNumber,
    messageText,
    interaktMessageId: interaktMessageId || undefined,
    payload: req.body,
  });

  res.json({
    success: true,
    result,
  });
});
