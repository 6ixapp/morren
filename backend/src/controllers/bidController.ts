import { Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel, buildUpdateClause } from '../utils/dbHelpers';
import { Bid, CreateBidRequest } from '../types';

// Helper to parse bid with order and seller
const parseBidRow = (row: any, maskSellerInfo: boolean = false) => {
  const bid = keysToCamel({
    id: row.id,
    orderId: row.order_id,
    sellerId: maskSellerInfo ? undefined : row.seller_id,
    bidAmount: row.bid_amount,
    estimatedDelivery: row.estimated_delivery,
    message: row.message,
    pickupAddress: row.pickup_address,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }) as Bid;

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

  if (row.seller_name && !maskSellerInfo) {
    bid.seller = keysToCamel({
      id: row.seller_id,
      name: row.seller_name,
      email: row.seller_email,
    });
  }

  return bid;
};

// GET /api/bids
export const getBids = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(`
    SELECT b.*,
           o.item_id as order_item_id, o.buyer_id as order_buyer_id, o.quantity as order_quantity, 
           o.total_price as order_total_price, o.status as order_status,
           i.name as order_item_name,
           u.name as seller_name, u.email as seller_email
    FROM bids b
    LEFT JOIN orders o ON b.order_id = o.id
    LEFT JOIN items i ON o.item_id = i.id
    LEFT JOIN users u ON b.seller_id = u.id
    ORDER BY b.created_at DESC
  `);

  const bids = result.rows.map((row) => parseBidRow(row, false));

  res.json(bids);
});

// GET /api/bids/:id
export const getBidById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT b.*,
            o.item_id as order_item_id, o.buyer_id as order_buyer_id, o.quantity as order_quantity, 
            o.total_price as order_total_price, o.status as order_status,
            i.name as order_item_name,
            u.name as seller_name, u.email as seller_email
     FROM bids b
     LEFT JOIN orders o ON b.order_id = o.id
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON b.seller_id = u.id
     WHERE b.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Bid not found', 404);
  }

  const bid = parseBidRow(result.rows[0], false);

  res.json(bid);
});

// GET /api/bids/order/:orderId
export const getBidsByOrder = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const maskSellerInfo = req.query.maskSellerInfo === 'true';

  const result = await query(
    `SELECT b.*,
            o.item_id as order_item_id, o.buyer_id as order_buyer_id, o.quantity as order_quantity, 
            o.total_price as order_total_price, o.status as order_status,
            i.name as order_item_name,
            u.name as seller_name, u.email as seller_email
     FROM bids b
     LEFT JOIN orders o ON b.order_id = o.id
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON b.seller_id = u.id
     WHERE b.order_id = $1
     ORDER BY b.bid_amount ASC`,
    [orderId]
  );

  const bids = result.rows.map((row) => parseBidRow(row, maskSellerInfo));

  res.json(bids);
});

// GET /api/bids/seller/:sellerId
export const getBidsBySeller = asyncHandler(async (req: Request, res: Response) => {
  const { sellerId } = req.params;

  const result = await query(
    `SELECT b.*,
            o.item_id as order_item_id, o.buyer_id as order_buyer_id, o.quantity as order_quantity, 
            o.total_price as order_total_price, o.status as order_status,
            i.name as order_item_name,
            u.name as seller_name, u.email as seller_email
     FROM bids b
     LEFT JOIN orders o ON b.order_id = o.id
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON b.seller_id = u.id
     WHERE b.seller_id = $1
     ORDER BY b.created_at DESC`,
    [sellerId]
  );

  const bids = result.rows.map((row) => parseBidRow(row, false));

  res.json(bids);
});

// POST /api/bids
export const createBid = asyncHandler(async (req: Request, res: Response) => {
  const {
    orderId,
    sellerId,
    bidAmount,
    estimatedDelivery,
    message,
    pickupAddress,
    status,
  } = req.body as CreateBidRequest;

  const result = await query(
    `INSERT INTO bids (order_id, seller_id, bid_amount, estimated_delivery, message, pickup_address, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`,
    [
      orderId,
      sellerId,
      bidAmount,
      estimatedDelivery || null,
      message || null,
      pickupAddress || null,
      status || 'pending',
    ]
  );

  const bid = keysToCamel(result.rows[0]) as Bid;

  res.status(201).json(bid);
});

// PATCH /api/bids/:id
export const updateBid = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    throw new AppError('No update fields provided', 400);
  }

  const { clause, values } = buildUpdateClause(updates);

  const result = await query(
    `UPDATE bids ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Bid not found', 404);
  }

  const bid = keysToCamel(result.rows[0]) as Bid;

  res.json(bid);
});

// DELETE /api/bids/:id
export const deleteBid = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM bids WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Bid not found', 404);
  }

  res.json({ message: 'Bid deleted successfully' });
});
