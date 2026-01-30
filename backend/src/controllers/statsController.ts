import { Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../utils/errorHandler';
import { DashboardStats } from '../types';

// GET /api/stats/buyer/:buyerId
export const getBuyerStats = asyncHandler(async (req: Request, res: Response) => {
  const { buyerId } = req.params;

  const ordersResult = await query(
    `SELECT 
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
      COALESCE(SUM(total_price), 0) as total_revenue
     FROM orders WHERE buyer_id = $1`,
    [buyerId]
  );

  const bidsResult = await query(
    `SELECT COUNT(DISTINCT b.order_id) as active_bids
     FROM bids b
     JOIN orders o ON b.order_id = o.id
     WHERE o.buyer_id = $1 AND b.status = 'pending'`,
    [buyerId]
  );

  const stats: DashboardStats = {
    totalOrders: parseInt(ordersResult.rows[0].total_orders),
    pendingOrders: parseInt(ordersResult.rows[0].pending_orders),
    totalRevenue: parseFloat(ordersResult.rows[0].total_revenue),
    activeBids: parseInt(bidsResult.rows[0].active_bids),
  };

  res.json(stats);
});

// GET /api/stats/seller/:sellerId
export const getSellerStats = asyncHandler(async (req: Request, res: Response) => {
  const { sellerId } = req.params;

  const bidsResult = await query(
    `SELECT 
      COUNT(*) as total_bids,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_bids,
      COUNT(DISTINCT order_id) as total_orders
     FROM bids WHERE seller_id = $1`,
    [sellerId]
  );

  const revenueResult = await query(
    `SELECT COALESCE(SUM(b.bid_amount), 0) as total_revenue
     FROM bids b
     WHERE b.seller_id = $1 AND b.status = 'accepted'`,
    [sellerId]
  );

  const stats: DashboardStats = {
    totalBids: parseInt(bidsResult.rows[0].total_bids),
    pendingOrders: parseInt(bidsResult.rows[0].pending_bids),
    totalOrders: parseInt(bidsResult.rows[0].total_orders),
    totalRevenue: parseFloat(revenueResult.rows[0].total_revenue),
  };

  res.json(stats);
});

// GET /api/stats/admin
export const getAdminStats = asyncHandler(async (req: Request, res: Response) => {
  const itemsResult = await query(
    `SELECT 
      COUNT(*) as total_items,
      COUNT(*) FILTER (WHERE status = 'active') as active_items
     FROM items`
  );

  const ordersResult = await query(
    `SELECT 
      COUNT(*) as total_orders,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
      COALESCE(SUM(total_price), 0) as total_revenue
     FROM orders`
  );

  const usersResult = await query('SELECT COUNT(*) as total_users FROM users');

  const bidsResult = await query('SELECT COUNT(*) as total_bids FROM bids');

  const stats: DashboardStats = {
    totalItems: parseInt(itemsResult.rows[0].total_items),
    activeItems: parseInt(itemsResult.rows[0].active_items),
    totalOrders: parseInt(ordersResult.rows[0].total_orders),
    pendingOrders: parseInt(ordersResult.rows[0].pending_orders),
    totalRevenue: parseFloat(ordersResult.rows[0].total_revenue),
    totalUsers: parseInt(usersResult.rows[0].total_users),
    totalBids: parseInt(bidsResult.rows[0].total_bids),
  };

  res.json(stats);
});
