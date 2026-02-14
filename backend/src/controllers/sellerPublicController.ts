/**
 * Seller Public Profile Controller
 *
 * Provides public-facing seller information for buyers to view seller reputation
 * without revealing sensitive personal information.
 */

import { Request, Response } from 'express';
import { query } from '../db';
import { AppError } from '../utils/errorHandler';

/**
 * Get public profile for a seller
 * Accessible by any authenticated user
 * Shows anonymized seller info and track record
 */
export const getSellerPublicProfile = async (req: Request, res: Response) => {
  try {
    const { sellerId } = req.params;

    // Verify seller exists
    const sellerResult = await query(
      'SELECT id, role, created_at FROM users WHERE id = $1',
      [sellerId]
    );

    if (sellerResult.rows.length === 0) {
      throw new AppError('Seller not found', 404);
    }

    const seller = sellerResult.rows[0];

    if (seller.role !== 'seller') {
      throw new AppError('User is not a seller', 400);
    }

    // Generate anonymized ID (SLR- + first 4 chars of seller ID)
    const anonymizedId = `SLR-${sellerId.substring(0, 4)}`;

    // Get seller statistics
    const statsResult = await query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_bids,
        COUNT(*) as total_bids,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_bids
      FROM bids
      WHERE seller_id = $1`,
      [sellerId]
    );

    const stats = statsResult.rows[0];
    const totalBids = parseInt(stats.total_bids) || 0;
    const acceptedBids = parseInt(stats.accepted_bids) || 0;
    const successRate = totalBids > 0 ? (acceptedBids / totalBids) * 100 : 0;

    // Get recent accepted orders (last 3)
    // Note: We need to add rating and delivery_status fields to bids table
    // For now, we'll return basic info and can enhance later
    const recentOrdersResult = await query(
      `SELECT
        b.id as bid_id,
        b.order_id,
        b.bid_amount,
        b.estimated_delivery,
        b.created_at as bid_created_at,
        b.status as bid_status,
        o.id as order_id,
        o.quantity,
        o.status as order_status,
        o.created_at as order_created_at,
        o.updated_at as order_updated_at,
        i.name as product_name,
        i.size as unit
      FROM bids b
      JOIN orders o ON b.order_id = o.id
      LEFT JOIN items i ON o.item_id = i.id
      WHERE b.seller_id = $1
        AND b.status = 'accepted'
      ORDER BY b.updated_at DESC
      LIMIT 3`,
      [sellerId]
    );

    // Transform recent orders to public format
    const recentAcceptedOrders = recentOrdersResult.rows.map((row) => {
      // Determine delivery status based on order status
      let deliveryStatus = 'in_progress';
      if (row.order_status === 'completed') {
        deliveryStatus = 'delivered_on_time'; // Default to on time
      } else if (row.order_status === 'cancelled') {
        deliveryStatus = 'cancelled';
      }

      return {
        orderId: row.order_id,
        productName: row.product_name || 'Unknown Product',
        quantity: row.quantity,
        unit: row.unit || 'kg',
        bidAmount: parseFloat(row.bid_amount),
        acceptedAt: row.order_updated_at || row.bid_created_at,
        deliveryStatus,
        rating: null, // TODO: Add rating system
        daysDelayed: null, // TODO: Calculate from delivery dates
      };
    });

    // Build public profile response
    const publicProfile = {
      sellerId,
      anonymizedId,
      publicInfo: {
        memberSince: seller.created_at,
        totalCompletedOrders: acceptedBids,
        successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
        averageRating: null, // TODO: Calculate from ratings once rating system is in place
        totalBidsPlaced: totalBids,
        totalBidsAccepted: acceptedBids,
      },
      recentAcceptedOrders,
    };

    res.json(publicProfile);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error getting seller public profile:', error);
    throw new AppError('Failed to get seller public profile', 500);
  }
};

/**
 * Get list of bidders for an order
 * Only accessible by the buyer who owns the order
 */
export const getOrderBidders = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.userId;

    // Verify order exists and belongs to the requesting user
    const orderResult = await query(
      'SELECT id, buyer_id FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError('Order not found', 404);
    }

    const order = orderResult.rows[0];

    if (order.buyer_id !== userId) {
      throw new AppError('Not authorized to view bidders for this order', 403);
    }

    // Get all bids for this order with seller info
    const biddersResult = await query(
      `SELECT
        b.id as bid_id,
        b.seller_id,
        b.bid_amount,
        b.status as bid_status,
        b.created_at as bid_created_at,
        COUNT(*) OVER (PARTITION BY b.seller_id) as bid_count
      FROM bids b
      WHERE b.order_id = $1
      ORDER BY b.created_at DESC`,
      [orderId]
    );

    // Transform to public format with anonymized IDs
    const bidders = biddersResult.rows.map((row) => ({
      sellerId: row.seller_id,
      anonymizedId: `SLR-${row.seller_id.substring(0, 4)}`,
      bidCount: parseInt(row.bid_count),
      bidAmount: parseFloat(row.bid_amount),
      bidStatus: row.bid_status,
      bidCreatedAt: row.bid_created_at,
    }));

    // Remove duplicates (same seller might have multiple bids)
    const uniqueBidders = bidders.reduce((acc, current) => {
      const existing = acc.find((b) => b.sellerId === current.sellerId);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof bidders);

    res.json({
      orderId,
      bidders: uniqueBidders,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Error getting order bidders:', error);
    throw new AppError('Failed to get order bidders', 500);
  }
};
