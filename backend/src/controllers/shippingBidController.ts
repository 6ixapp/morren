import { Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel, buildUpdateClause } from '../utils/dbHelpers';
import { parsePagination } from '../utils/dbHelpers';
import { ShippingBid, CreateShippingBidRequest } from '../types';

// Helper to parse shipping bid with order and provider
const parseShippingBidRow = (row: any, maskProviderInfo: boolean = false) => {
  const bid = keysToCamel({
    id: row.id,
    orderId: row.order_id,
    shippingProviderId: maskProviderInfo ? undefined : row.shipping_provider_id,
    bidAmount: row.bid_amount,
    estimatedDelivery: row.estimated_delivery,
    message: row.message,
    quantityKgs: row.quantity_kgs,
    portOfLoading: row.port_of_loading,
    destinationAddress: row.destination_address,
    incoterms: row.incoterms,
    mode: row.mode,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }) as ShippingBid;

  if (row.order_item_name) {
    bid.order = keysToCamel({
      id: row.order_id,
      itemId: row.order_item_id,
      buyerId: row.order_buyer_id,
      quantity: row.order_quantity,
      totalPrice: row.order_total_price,
      status: row.order_status,
    });
  }

  if (row.provider_name && !maskProviderInfo) {
    bid.shippingProvider = keysToCamel({
      id: row.shipping_provider_id,
      name: row.provider_name,
      email: row.provider_email,
    });
  }

  return bid;
};

// GET /api/shipping-bids
export const getShippingBids = asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const result = await query(`
    SELECT sb.*,
           o.item_id as order_item_id, o.buyer_id as order_buyer_id, o.quantity as order_quantity, 
           o.total_price as order_total_price, o.status as order_status,
           i.name as order_item_name,
           u.name as provider_name, u.email as provider_email
    FROM shipping_bids sb
    LEFT JOIN orders o ON sb.order_id = o.id
    LEFT JOIN items i ON o.item_id = i.id
    LEFT JOIN users u ON sb.shipping_provider_id = u.id
    ORDER BY sb.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  const bids = result.rows.map((row) => parseShippingBidRow(row, false));

  res.json(bids);
});

// GET /api/shipping-bids/:id
export const getShippingBidById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT sb.*,
            o.item_id as order_item_id, o.buyer_id as order_buyer_id, o.quantity as order_quantity, 
            o.total_price as order_total_price, o.status as order_status,
            i.name as order_item_name,
            u.name as provider_name, u.email as provider_email
     FROM shipping_bids sb
     LEFT JOIN orders o ON sb.order_id = o.id
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON sb.shipping_provider_id = u.id
     WHERE sb.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Shipping bid not found', 404);
  }

  const bid = parseShippingBidRow(result.rows[0], false);

  res.json(bid);
});

// GET /api/shipping-bids/order/:orderId
export const getShippingBidsByOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const maskProviderInfo = req.query.maskProviderInfo === 'true';

  const result = await query(
    `SELECT sb.*,
            o.item_id as order_item_id, o.buyer_id as order_buyer_id, o.quantity as order_quantity, 
            o.total_price as order_total_price, o.status as order_status,
            i.name as order_item_name,
            u.name as provider_name, u.email as provider_email
     FROM shipping_bids sb
     LEFT JOIN orders o ON sb.order_id = o.id
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON sb.shipping_provider_id = u.id
     WHERE sb.order_id = $1
     ORDER BY sb.bid_amount ASC`,
    [orderId]
  );

  const bids = result.rows.map((row) => parseShippingBidRow(row, maskProviderInfo));

  res.json(bids);
});

// GET /api/shipping-bids/orders?orderIds=id1,id2
// Batch equivalent of getShippingBidsByOrder for dashboard list views.
export const getShippingBidsByOrders = asyncHandler(async (req: Request, res: Response) => {
  const maskProviderInfo = req.query.maskProviderInfo === 'true';
  const rawOrderIds = typeof req.query.orderIds === 'string' ? req.query.orderIds.split(',') : [];
  const orderIds = rawOrderIds
    .map((id) => id.trim())
    .filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))
    .slice(0, 500);

  if (orderIds.length === 0) {
    res.json([]);
    return;
  }

  const { limit, offset } = parsePagination(req.query as Record<string, unknown>, 500, 1000);
  const result = await query(
    `SELECT sb.*,
            o.item_id as order_item_id, o.buyer_id as order_buyer_id, o.quantity as order_quantity,
            o.total_price as order_total_price, o.status as order_status,
            i.name as order_item_name,
            u.name as provider_name, u.email as provider_email
     FROM shipping_bids sb
     LEFT JOIN orders o ON sb.order_id = o.id
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON sb.shipping_provider_id = u.id
     WHERE sb.order_id = ANY($1::uuid[])
     ORDER BY sb.order_id, sb.bid_amount ASC, sb.created_at ASC
     LIMIT $2 OFFSET $3`,
    [orderIds, limit, offset]
  );

  res.json(result.rows.map((row) => parseShippingBidRow(row, maskProviderInfo)));
});

// GET /api/shipping-bids/provider/:providerId
export const getShippingBidsByProvider = asyncHandler(async (req: Request, res: Response) => {
  const { providerId } = req.params;
  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

  const result = await query(
    `SELECT sb.*,
            o.item_id as order_item_id, o.buyer_id as order_buyer_id, o.quantity as order_quantity, 
            o.total_price as order_total_price, o.status as order_status,
            i.name as order_item_name,
            u.name as provider_name, u.email as provider_email
     FROM shipping_bids sb
     LEFT JOIN orders o ON sb.order_id = o.id
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON sb.shipping_provider_id = u.id
     WHERE sb.shipping_provider_id = $1
     ORDER BY sb.created_at DESC
     LIMIT $2 OFFSET $3`,
    [providerId, limit, offset]
  );

  const bids = result.rows.map((row) => parseShippingBidRow(row, false));

  res.json(bids);
});

// POST /api/shipping-bids
export const createShippingBid = asyncHandler(async (req: Request, res: Response) => {
  const {
    orderId,
    shippingProviderId,
    bidAmount,
    estimatedDelivery,
    message,
    quantityKgs,
    portOfLoading,
    destinationAddress,
    incoterms,
    mode,
    status,
  } = req.body as CreateShippingBidRequest;

  const result = await query(
    `INSERT INTO shipping_bids (order_id, shipping_provider_id, bid_amount, estimated_delivery, message, quantity_kgs, port_of_loading, destination_address, incoterms, mode, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
     RETURNING *`,
    [
      orderId,
      shippingProviderId,
      bidAmount,
      estimatedDelivery || null,
      message || null,
      quantityKgs || null,
      portOfLoading || null,
      destinationAddress || null,
      incoterms || null,
      mode || null,
      status || 'pending',
    ]
  );

  const bid = keysToCamel(result.rows[0]) as ShippingBid;

  res.status(201).json(bid);
});

// PATCH /api/shipping-bids/:id
export const updateShippingBid = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    throw new AppError('No update fields provided', 400);
  }

  const { clause, values } = buildUpdateClause(updates);

  const result = await query(
    `UPDATE shipping_bids ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Shipping bid not found', 404);
  }

  const bid = keysToCamel(result.rows[0]) as ShippingBid;

  res.json(bid);
});

// DELETE /api/shipping-bids/:id
export const deleteShippingBid = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM shipping_bids WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Shipping bid not found', 404);
  }

  res.json({ message: 'Shipping bid deleted successfully' });
});
