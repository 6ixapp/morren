import axios from 'axios';
import { query } from '../db';
import { AppError } from '../utils/errorHandler';

const INTERAKT_BASE_URL = process.env.INTERAKT_BASE_URL || 'https://api.interakt.ai/v1/public';
const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY;
const INTERAKT_CHANNEL_NUMBER = process.env.INTERAKT_CHANNEL_NUMBER || '';
const WHATSAPP_AUTOMATION_ENABLED = process.env.WHATSAPP_AUTOMATION_ENABLED === 'true';
const DEFAULT_AUCTION_DURATION_DAYS = Number(process.env.DEFAULT_AUCTION_DURATION_DAYS || 1);

interface InteraktSendResult {
  success: boolean;
  messageId: string | null;
  error: string | null;
}

interface CommandResolution {
  orderId: string;
  command: 'BID' | 'STATUS' | 'RANK' | 'HELP';
  bidAmount?: number;
}

export interface AuctionBroadcastSummary {
  enabled: boolean;
  orderId: string;
  auctionId: string | null;
  sellersTargeted: number;
  sentCount: number;
  failedCount: number;
  skippedReason?: string;
}

const normalizePhoneForCompare = (phone: string): string => phone.replace(/\D/g, '');
const getPreferredPhone = (row: { whatsapp_number?: string | null; phone?: string | null }): string | null => {
  return row.whatsapp_number || row.phone || null;
};

const parseDurationDays = (raw: unknown): number => {
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.floor(parsed);
  }
  return DEFAULT_AUCTION_DURATION_DAYS;
};

const getInteraktHeaders = () => ({
  Authorization: `Basic ${INTERAKT_API_KEY}`,
  'Content-Type': 'application/json',
});

const buildOrderBroadcastMessage = (params: {
  orderId: string;
  itemName: string;
  quantity: number;
  shippingAddress: string;
  endsAt: string;
}) => {
  const lines = [
    `New Order Alert`,
    `Order: ${params.orderId}`,
    `Product: ${params.itemName}`,
    `Qty: ${params.quantity}`,
    `Delivery: ${params.shippingAddress}`,
    `Bid closes: ${new Date(params.endsAt).toLocaleString()}`,
    `Reply commands:`,
    `BID ${params.orderId} <amount>`,
    `STATUS ${params.orderId}`,
    `RANK ${params.orderId}`,
  ];
  return lines.join('\n');
};

const sendInteraktTextMessage = async (phoneNumber: string, messageText: string): Promise<InteraktSendResult> => {
  if (!INTERAKT_API_KEY) {
    return {
      success: false,
      messageId: null,
      error: 'INTERAKT_API_KEY is not configured',
    };
  }

  try {
    const response = await axios.post(
      `${INTERAKT_BASE_URL}/message/`,
      {
        countryCode: '+91',
        phoneNumber: normalizePhoneForCompare(phoneNumber),
        callbackData: 'morren-whatsapp-auction',
        type: 'Text',
        ...(INTERAKT_CHANNEL_NUMBER ? { channelNumber: INTERAKT_CHANNEL_NUMBER } : {}),
        data: {
          message: messageText,
        },
      },
      {
        headers: getInteraktHeaders(),
        timeout: 20000,
      }
    );

    const messageId = response.data?.id || response.data?.result?.id || null;
    return { success: true, messageId, error: null };
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Interakt send failed';
    return { success: false, messageId: null, error: String(errorMessage) };
  }
};

const logWhatsappMessage = async (params: {
  auctionId?: string | null;
  orderId?: string | null;
  sellerId?: string | null;
  direction: 'inbound' | 'outbound';
  messageText: string;
  messageType?: string;
  interaktMessageId?: string | null;
  deliveryStatus?: string;
  payload?: unknown;
}) => {
  await query(
    `INSERT INTO whatsapp_message_logs (
       auction_id, order_id, seller_id, direction, message_type, message_text, interakt_message_id, delivery_status, payload
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
    [
      params.auctionId || null,
      params.orderId || null,
      params.sellerId || null,
      params.direction,
      params.messageType || 'text',
      params.messageText,
      params.interaktMessageId || null,
      params.deliveryStatus || 'pending',
      JSON.stringify(params.payload || {}),
    ]
  );
};

export const closeExpiredOrderAuctions = async (): Promise<{ closedAuctionCount: number; notifiedCount: number }> => {
  const closedResult = await query(
    `UPDATE order_auctions
     SET auction_status = 'closed'
     WHERE auction_status = 'open' AND ends_at <= CURRENT_TIMESTAMP
     RETURNING id, order_id`
  );

  let notifiedCount = 0;

  for (const row of closedResult.rows) {
    const bestBidResult = await query(
      `SELECT id, seller_id, bid_amount, status
       FROM bids
       WHERE order_id = $1
       ORDER BY CASE WHEN status = 'accepted' THEN 0 ELSE 1 END, bid_amount ASC, created_at ASC
       LIMIT 1`,
      [row.order_id]
    );

    const winningBid = bestBidResult.rows[0] || null;
    const winningBidId = winningBid?.id || null;

    if (winningBidId) {
      await query(
        `UPDATE bids
         SET status = CASE
           WHEN id = $1 THEN 'accepted'
           WHEN status = 'pending' THEN 'rejected'
           ELSE status
         END
         WHERE order_id = $2`,
        [winningBidId, row.order_id]
      );

      await query(
        `UPDATE orders
         SET status = 'accepted', total_price = $1
         WHERE id = $2`,
        [winningBid.bid_amount, row.order_id]
      );
    }

    await query(
      `UPDATE order_auctions
       SET winning_bid_id = $1
       WHERE id = $2`,
      [winningBidId, row.id]
    );

    const invitedSellersResult = await query(
      `SELECT u.id, u.whatsapp_number, u.phone
       FROM seller_auction_invites sai
       JOIN users u ON u.id = sai.seller_id
       WHERE sai.auction_id = $1`,
      [row.id]
    );

    for (const seller of invitedSellersResult.rows) {
      const sellerPhone = getPreferredPhone(seller);
      if (!sellerPhone) {
        continue;
      }

      const sellerMessage = winningBidId
        ? seller.id === winningBid.seller_id
          ? `Auction closed for order ${row.order_id}. Congrats, your bid ${winningBid.bid_amount} is the winning bid.`
          : `Auction closed for order ${row.order_id}. Winning bid is ${winningBid.bid_amount}.`
        : `Auction closed for order ${row.order_id}. No valid bids were submitted.`;

      const sendResult = await sendInteraktTextMessage(sellerPhone, sellerMessage);
      if (sendResult.success) {
        notifiedCount++;
      }

      await logWhatsappMessage({
        auctionId: row.id,
        orderId: row.order_id,
        sellerId: seller.id,
        direction: 'outbound',
        messageText: sellerMessage,
        interaktMessageId: sendResult.messageId,
        deliveryStatus: sendResult.success ? 'sent' : 'failed',
        payload: { error: sendResult.error, event: 'auction_closed' },
      });
    }

    const buyerResult = await query(
      `SELECT u.id, u.whatsapp_number, u.phone
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
       WHERE o.id = $1`,
      [row.order_id]
    );

    if (buyerResult.rows.length > 0) {
      const buyer = buyerResult.rows[0];
      const buyerPhone = getPreferredPhone(buyer);
      if (buyerPhone) {
        const buyerMessage = winningBidId
          ? `Auction closed for order ${row.order_id}. Best bid selected: ${winningBid.bid_amount}.`
          : `Auction closed for order ${row.order_id}. No valid bids were submitted.`;

        const sendResult = await sendInteraktTextMessage(buyerPhone, buyerMessage);
        if (sendResult.success) {
          notifiedCount++;
        }

        await logWhatsappMessage({
          auctionId: row.id,
          orderId: row.order_id,
          sellerId: null,
          direction: 'outbound',
          messageText: buyerMessage,
          interaktMessageId: sendResult.messageId,
          deliveryStatus: sendResult.success ? 'sent' : 'failed',
          payload: { error: sendResult.error, event: 'auction_closed_buyer' },
        });
      }
    }
  }

  return {
    closedAuctionCount: closedResult.rows.length,
    notifiedCount,
  };
};

const getBidSnapshot = async (orderId: string, sellerId: string) => {
  const rankingResult = await query(
    `WITH seller_best AS (
       SELECT seller_id, MIN(bid_amount) as best_bid
       FROM bids
       WHERE order_id = $1
       GROUP BY seller_id
     ),
     ranked AS (
       SELECT seller_id, best_bid, DENSE_RANK() OVER (ORDER BY best_bid ASC) as rank
       FROM seller_best
     )
     SELECT
       r.seller_id,
       r.best_bid,
       r.rank,
       (SELECT COUNT(*) FROM seller_best) as total_sellers,
       (SELECT MIN(best_bid) FROM seller_best) as market_best_bid
     FROM ranked r
     WHERE r.seller_id = $2`,
    [orderId, sellerId]
  );

  const auctionResult = await query(
    `SELECT id, auction_status, ends_at, winning_bid_id
     FROM order_auctions
     WHERE order_id = $1`,
    [orderId]
  );

  return {
    ranking: rankingResult.rows[0] || null,
    auction: auctionResult.rows[0] || null,
  };
};

const resolveOrderIdFromOpenInvite = async (sellerId: string): Promise<string | null> => {
  const result = await query(
    `SELECT oa.order_id
     FROM seller_auction_invites sai
     JOIN order_auctions oa ON oa.id = sai.auction_id
     WHERE sai.seller_id = $1
       AND oa.auction_status = 'open'
     ORDER BY sai.updated_at DESC
     LIMIT 1`,
    [sellerId]
  );

  return result.rows[0]?.order_id || null;
};

const parseSellerCommand = async (sellerId: string, rawMessageText: string): Promise<CommandResolution> => {
  const cleaned = rawMessageText.trim();
  const parts = cleaned.split(/\s+/);
  const command = (parts[0] || '').toUpperCase();

  if (command === 'HELP' || !command) {
    return { command: 'HELP', orderId: '' };
  }

  if (!['BID', 'STATUS', 'RANK'].includes(command)) {
    return { command: 'HELP', orderId: '' };
  }

  if (command === 'BID') {
    if (parts.length >= 3) {
      const amount = Number(parts[2]);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError('Invalid bid amount. Use: BID <orderId> <amount>', 400);
      }
      return { command: 'BID', orderId: parts[1], bidAmount: amount };
    }

    if (parts.length === 2) {
      const maybeAmount = Number(parts[1]);
      if (Number.isFinite(maybeAmount) && maybeAmount > 0) {
        const activeOrderId = await resolveOrderIdFromOpenInvite(sellerId);
        if (!activeOrderId) {
          throw new AppError('Could not find an active auction. Use: BID <orderId> <amount>', 400);
        }
        return { command: 'BID', orderId: activeOrderId, bidAmount: maybeAmount };
      }
      throw new AppError('Invalid bid format. Use: BID <orderId> <amount>', 400);
    }

    throw new AppError('Invalid bid format. Use: BID <orderId> <amount>', 400);
  }

  if (parts.length < 2) {
    throw new AppError(`${command} requires orderId. Use: ${command} <orderId>`, 400);
  }

  return { command: command as 'STATUS' | 'RANK', orderId: parts[1] };
};

const ensureSellerIsInvitedToAuction = async (orderId: string, sellerId: string): Promise<{ auctionId: string }> => {
  const result = await query(
    `SELECT oa.id as auction_id, oa.auction_status
     FROM order_auctions oa
     JOIN seller_auction_invites sai ON sai.auction_id = oa.id
     WHERE oa.order_id = $1 AND sai.seller_id = $2`,
    [orderId, sellerId]
  );

  if (result.rows.length === 0) {
    throw new AppError('You are not invited for this order auction', 403);
  }

  const auction = result.rows[0];
  if (auction.auction_status !== 'open') {
    throw new AppError('Auction is closed for this order', 400);
  }

  return { auctionId: auction.auction_id };
};

export const isWhatsappAutomationEnabled = () => WHATSAPP_AUTOMATION_ENABLED;

export const createAuctionAndBroadcast = async (
  orderId: string,
  options?: { forceRebroadcast?: boolean }
): Promise<AuctionBroadcastSummary> => {
  if (!WHATSAPP_AUTOMATION_ENABLED) {
    return {
      enabled: false,
      orderId,
      auctionId: null,
      sellersTargeted: 0,
      sentCount: 0,
      failedCount: 0,
      skippedReason: 'WHATSAPP_AUTOMATION_ENABLED is false',
    };
  }

  await closeExpiredOrderAuctions();

  const orderResult = await query(
    `SELECT
       o.id as order_id,
       o.quantity,
       o.shipping_address,
       o.notes,
       i.name as item_name,
       i.specifications as item_specifications
     FROM orders o
     JOIN items i ON i.id = o.item_id
     WHERE o.id = $1`,
    [orderId]
  );

  if (orderResult.rows.length === 0) {
    throw new AppError('Order not found for auction broadcast', 404);
  }

  const order = orderResult.rows[0];
  const existingAuctionResult = await query(
    `SELECT id, auction_status
     FROM order_auctions
     WHERE order_id = $1`,
    [orderId]
  );

  let auctionId: string;
  let endsAt: Date;
  const orderSpecs = order.item_specifications || {};
  const sellerBidDays = parseDurationDays(orderSpecs['Seller Bid Running Time (days)']);
  endsAt = new Date(Date.now() + sellerBidDays * 24 * 60 * 60 * 1000);

  if (existingAuctionResult.rows.length > 0) {
    const existing = existingAuctionResult.rows[0];
    auctionId = existing.id;

    if (existing.auction_status === 'closed' && !options?.forceRebroadcast) {
      return {
        enabled: true,
        orderId,
        auctionId,
        sellersTargeted: 0,
        sentCount: 0,
        failedCount: 0,
        skippedReason: 'Auction already closed',
      };
    }

    await query(
      `UPDATE order_auctions
       SET auction_status = 'open', ends_at = $1, metadata = metadata || $2::jsonb
       WHERE id = $3`,
      [endsAt.toISOString(), JSON.stringify({ rebroadcastedAt: new Date().toISOString() }), auctionId]
    );
  } else {
    const auctionInsertResult = await query(
      `INSERT INTO order_auctions (order_id, auction_status, ends_at, metadata)
       VALUES ($1, 'open', $2, $3::jsonb)
       RETURNING id`,
      [
        orderId,
        endsAt.toISOString(),
        JSON.stringify({
          origin: 'order_created',
        }),
      ]
    );
    auctionId = auctionInsertResult.rows[0].id;
  }

  const sellersResult = await query(
    `SELECT id, whatsapp_number
     FROM users
     WHERE role = 'seller'
       AND whatsapp_opt_in = true
       AND whatsapp_number IS NOT NULL`
  );

  const sellers = sellersResult.rows;
  if (sellers.length === 0) {
    return {
      enabled: true,
      orderId,
      auctionId,
      sellersTargeted: 0,
      sentCount: 0,
      failedCount: 0,
      skippedReason: 'No opted-in sellers with WhatsApp numbers',
    };
  }

  const messageText = buildOrderBroadcastMessage({
    orderId,
    itemName: order.item_name,
    quantity: order.quantity,
    shippingAddress: order.shipping_address,
    endsAt: endsAt.toISOString(),
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const seller of sellers) {
    await query(
      `INSERT INTO seller_auction_invites (auction_id, seller_id, invite_status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (auction_id, seller_id)
       DO UPDATE SET invite_status = 'pending', error = NULL, updated_at = CURRENT_TIMESTAMP`,
      [auctionId, seller.id]
    );

    const sendResult = await sendInteraktTextMessage(seller.whatsapp_number, messageText);
    if (sendResult.success) {
      sentCount++;
      await query(
        `UPDATE seller_auction_invites
         SET invite_status = 'sent', interakt_message_id = $1, error = NULL
         WHERE auction_id = $2 AND seller_id = $3`,
        [sendResult.messageId, auctionId, seller.id]
      );
    } else {
      failedCount++;
      await query(
        `UPDATE seller_auction_invites
         SET invite_status = 'failed', error = $1
         WHERE auction_id = $2 AND seller_id = $3`,
        [sendResult.error, auctionId, seller.id]
      );
    }

    await logWhatsappMessage({
      auctionId,
      orderId,
      sellerId: seller.id,
      direction: 'outbound',
      messageText,
      interaktMessageId: sendResult.messageId,
      deliveryStatus: sendResult.success ? 'sent' : 'failed',
      payload: {
        error: sendResult.error,
      },
    });
  }

  return {
    enabled: true,
    orderId,
    auctionId,
    sellersTargeted: sellers.length,
    sentCount,
    failedCount,
  };
};

export const handleSellerWhatsAppMessage = async (params: {
  fromPhoneNumber: string;
  messageText: string;
  interaktMessageId?: string;
  payload?: unknown;
}): Promise<{ action: string; reply: string; orderId?: string }> => {
  await closeExpiredOrderAuctions();

  const normalized = normalizePhoneForCompare(params.fromPhoneNumber);
  if (!normalized) {
    throw new AppError('Could not parse sender phone number', 400);
  }

  const sellerResult = await query(
    `SELECT id, whatsapp_number
     FROM users
     WHERE role = 'seller'
       AND (
         regexp_replace(COALESCE(whatsapp_number, ''), '[^0-9]', '', 'g') = $1
         OR regexp_replace(COALESCE(phone, ''), '[^0-9]', '', 'g') = $1
       )
     LIMIT 1`,
    [normalized]
  );

  if (sellerResult.rows.length === 0) {
    await logWhatsappMessage({
      direction: 'inbound',
      messageText: params.messageText,
      interaktMessageId: params.interaktMessageId || null,
      payload: params.payload,
      deliveryStatus: 'received',
    });
    throw new AppError('Seller not found for this WhatsApp number', 404);
  }

  const sellerId = sellerResult.rows[0].id;
  const parsed = await parseSellerCommand(sellerId, params.messageText);

  await query(
    `UPDATE users
     SET whatsapp_last_active_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [sellerId]
  );

  let auctionId: string | null = null;
  let reply = '';

  if (parsed.command === 'HELP') {
    reply = [
      'Available commands:',
      'BID <orderId> <amount>',
      'STATUS <orderId>',
      'RANK <orderId>',
      'Example: BID 123e4567-e89b-12d3-a456-426614174000 5400',
    ].join('\n');
  } else {
    const inviteInfo = await ensureSellerIsInvitedToAuction(parsed.orderId, sellerId);
    auctionId = inviteInfo.auctionId;
  }

  if (parsed.command === 'BID') {
    const amount = parsed.bidAmount!;
    const existingResult = await query(
      `SELECT id
       FROM bids
       WHERE order_id = $1 AND seller_id = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [parsed.orderId, sellerId]
    );

    if (existingResult.rows.length > 0) {
      await query(
        `UPDATE bids
         SET bid_amount = $1, message = $2, pickup_address = COALESCE(pickup_address, $3), estimated_delivery = COALESCE(estimated_delivery, CURRENT_DATE + INTERVAL '7 days')
         WHERE id = $4`,
        [amount, 'Updated via WhatsApp', 'Warehouse Location, India', existingResult.rows[0].id]
      );
    } else {
      await query(
        `INSERT INTO bids (order_id, seller_id, bid_amount, estimated_delivery, message, pickup_address, status)
         VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '7 days', $4, $5, 'pending')`,
        [parsed.orderId, sellerId, amount, 'Submitted via WhatsApp', 'Warehouse Location, India']
      );
    }

    await query(
      `UPDATE seller_auction_invites
       SET invite_status = 'replied'
       WHERE auction_id = $1 AND seller_id = $2`,
      [auctionId, sellerId]
    );

    const snapshot = await getBidSnapshot(parsed.orderId, sellerId);
    const rank = snapshot.ranking?.rank ?? '-';
    const totalSellers = snapshot.ranking?.total_sellers ?? 0;
    const marketBestBid = snapshot.ranking?.market_best_bid ?? amount;

    reply = `Bid saved for order ${parsed.orderId}. Your rank: #${rank}/${totalSellers}. Best bid: ${marketBestBid}.`;
  }

  if (parsed.command === 'STATUS' || parsed.command === 'RANK') {
    const snapshot = await getBidSnapshot(parsed.orderId, sellerId);

    if (!snapshot.ranking) {
      reply = `No bid found for order ${parsed.orderId}. Send: BID ${parsed.orderId} <amount>`;
    } else {
      const auctionStatus = snapshot.auction?.auction_status || 'unknown';
      const rank = snapshot.ranking.rank;
      const totalSellers = snapshot.ranking.total_sellers;
      const yourBest = snapshot.ranking.best_bid;
      const marketBest = snapshot.ranking.market_best_bid;

      if (parsed.command === 'STATUS') {
        reply = `Order ${parsed.orderId} is ${auctionStatus}. Your best: ${yourBest}. Market best: ${marketBest}. Rank: #${rank}/${totalSellers}.`;
      } else {
        reply = `Rank update for order ${parsed.orderId}: #${rank}/${totalSellers}. Your best: ${yourBest}.`;
      }
    }
  }

  await logWhatsappMessage({
    auctionId,
    orderId: parsed.orderId || null,
    sellerId,
    direction: 'inbound',
    messageText: params.messageText,
    interaktMessageId: params.interaktMessageId || null,
    deliveryStatus: 'received',
    payload: params.payload,
  });

  const sellerPhone = sellerResult.rows[0].whatsapp_number || params.fromPhoneNumber;
  const sendReplyResult = await sendInteraktTextMessage(sellerPhone, reply);

  await logWhatsappMessage({
    auctionId,
    orderId: parsed.orderId || null,
    sellerId,
    direction: 'outbound',
    messageText: reply,
    interaktMessageId: sendReplyResult.messageId,
    deliveryStatus: sendReplyResult.success ? 'sent' : 'failed',
    payload: { error: sendReplyResult.error },
  });

  return {
    action: parsed.command.toLowerCase(),
    reply,
    orderId: parsed.orderId || undefined,
  };
};
