import { Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel, buildUpdateClause } from '../utils/dbHelpers';
import { Order, CreateOrderRequest } from '../types';

// Helper to parse order with item and buyer
const parseOrderRow = (row: any) => {
  const order = keysToCamel({
    id: row.id,
    itemId: row.item_id,
    buyerId: row.buyer_id,
    quantity: row.quantity,
    totalPrice: row.total_price,
    status: row.status,
    shippingAddress: row.shipping_address,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }) as Order;

  if (row.item_name) {
    order.item = keysToCamel({
      id: row.item_id,
      name: row.item_name,
      description: row.item_description,
      image: row.item_image,
      price: row.item_price,
      category: row.item_category,
    });
  }

  if (row.buyer_name) {
    order.buyer = keysToCamel({
      id: row.buyer_id,
      name: row.buyer_name,
      email: row.buyer_email,
    });
  }

  return order;
};

// GET /api/orders
export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(`
    SELECT o.*,
           i.name as item_name, i.description as item_description, i.image as item_image, i.price as item_price, i.category as item_category,
           u.name as buyer_name, u.email as buyer_email
    FROM orders o
    LEFT JOIN items i ON o.item_id = i.id
    LEFT JOIN users u ON o.buyer_id = u.id
    ORDER BY o.created_at DESC
  `);

  const orders = result.rows.map(parseOrderRow);

  res.json(orders);
});

// GET /api/orders/:id
export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT o.*,
            i.name as item_name, i.description as item_description, i.image as item_image, i.price as item_price, i.category as item_category,
            u.name as buyer_name, u.email as buyer_email
     FROM orders o
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON o.buyer_id = u.id
     WHERE o.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = parseOrderRow(result.rows[0]);

  res.json(order);
});

// GET /api/orders/buyer/:buyerId
export const getOrdersByBuyer = asyncHandler(async (req: Request, res: Response) => {
  const { buyerId } = req.params;

  const result = await query(
    `SELECT o.*,
            i.name as item_name, i.description as item_description, i.image as item_image, i.price as item_price, i.category as item_category,
            u.name as buyer_name, u.email as buyer_email
     FROM orders o
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON o.buyer_id = u.id
     WHERE o.buyer_id = $1
     ORDER BY o.created_at DESC`,
    [buyerId]
  );

  const orders = result.rows.map(parseOrderRow);

  res.json(orders);
});

// GET /api/orders/seller/:sellerId
export const getOrdersBySeller = asyncHandler(async (req: Request, res: Response) => {
  const { sellerId } = req.params;

  // Orders for seller to bid on (status = pending)
  const result = await query(
    `SELECT o.*,
            i.name as item_name, i.description as item_description, i.image as item_image, i.price as item_price, i.category as item_category,
            u.name as buyer_name, u.email as buyer_email
     FROM orders o
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON o.buyer_id = u.id
     WHERE o.status = 'pending'
     ORDER BY o.created_at DESC`
  );

  const orders = result.rows.map(parseOrderRow);

  res.json(orders);
});

// GET /api/orders/seller/:sellerId/items
export const getSellerItemOrders = asyncHandler(async (req: Request, res: Response) => {
  const { sellerId } = req.params;

  const result = await query(
    `SELECT o.*,
            i.name as item_name, i.description as item_description, i.image as item_image, i.price as item_price, i.category as item_category,
            u.name as buyer_name, u.email as buyer_email
     FROM orders o
     JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON o.buyer_id = u.id
     WHERE i.seller_id = $1
     ORDER BY o.created_at DESC`,
    [sellerId]
  );

  const orders = result.rows.map(parseOrderRow);

  res.json(orders);
});

// GET /api/orders/shipping
export const getOrdersForShipping = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    `SELECT o.*,
            i.name as item_name, i.description as item_description, i.image as item_image, i.price as item_price, i.category as item_category,
            u.name as buyer_name, u.email as buyer_email
     FROM orders o
     LEFT JOIN items i ON o.item_id = i.id
     LEFT JOIN users u ON o.buyer_id = u.id
     WHERE o.status = 'accepted'
     ORDER BY o.created_at DESC`
  );

  const orders = result.rows.map(parseOrderRow);

  res.json(orders);
});

// POST /api/orders
export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const { itemId, buyerId, quantity, totalPrice, status, shippingAddress, notes } =
    req.body as CreateOrderRequest;

  const result = await query(
    `INSERT INTO orders (item_id, buyer_id, quantity, total_price, status, shipping_address, notes) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING *`,
    [itemId, buyerId, quantity, totalPrice, status || 'pending', shippingAddress || null, notes || null]
  );

  const order = keysToCamel(result.rows[0]) as Order;

  res.status(201).json(order);
});

// PATCH /api/orders/:id
export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    throw new AppError('No update fields provided', 400);
  }

  const { clause, values } = buildUpdateClause(updates);

  const result = await query(
    `UPDATE orders ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  const order = keysToCamel(result.rows[0]) as Order;

  res.json(order);
});

// DELETE /api/orders/:id
export const deleteOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Order not found', 404);
  }

  res.json({ message: 'Order deleted successfully' });
});
