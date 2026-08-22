/**
 * Cardamom Price Controller
 * Handles API endpoints for cardamom market price data from indianspices.com
 */

import { Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel } from '../utils/dbHelpers';
import { CardamomPrice } from '../types';
import { fetchCardamomPricesWithRetry } from '../services/dataGovInService';
import { deleteExpiredCardamomRecords, persistCardamomRecords } from '../services/cardamomPersistence';
import { parsePagination } from '../utils/dbHelpers';

/**
 * GET /api/cardamom-prices
 * Get cardamom prices with optional filters
 */
export const getCardamomPrices = asyncHandler(
  async (req: Request, res: Response) => {
    const { variety, market, startDate, endDate } = req.query;
    const { limit, offset } = parsePagination(req.query as Record<string, unknown>);

    let sqlQuery = 'SELECT * FROM cardamom_prices WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (variety) {
      sqlQuery += ` AND variety ILIKE $${paramIndex}`;
      params.push(`%${variety}%`);
      paramIndex++;
    }

    if (market) {
      sqlQuery += ` AND market ILIKE $${paramIndex}`;
      params.push(`%${market}%`);
      paramIndex++;
    }

    if (startDate) {
      sqlQuery += ` AND arrival_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sqlQuery += ` AND arrival_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    sqlQuery += ' ORDER BY arrival_date DESC, market ASC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await query(sqlQuery, params);
    const prices = result.rows.map((row) => keysToCamel(row)) as CardamomPrice[];

    res.json(prices);
  }
);

/**
 * GET /api/cardamom-prices/stats
 * Get aggregated statistics for cardamom prices
 */
export const getCardamomStats = asyncHandler(
  async (req: Request, res: Response) => {
    const statsQuery = `
      SELECT
        COUNT(DISTINCT market) as total_markets,
        COUNT(DISTINCT variety) as total_varieties,
        AVG(modal_price) as avg_price,
        MIN(modal_price) as min_price,
        MAX(modal_price) as max_price,
        MAX(fetched_at) as last_updated
      FROM cardamom_prices
    `;

    const result = await query(statsQuery);
    const rawStats = keysToCamel(result.rows[0]);

    // Convert string numbers to actual numbers (PostgreSQL returns aggregates as strings)
    const stats = {
      totalMarkets: parseInt(rawStats.totalMarkets) || 0,
      totalVarieties: parseInt(rawStats.totalVarieties) || 0,
      avgPrice: parseFloat(rawStats.avgPrice) || 0,
      minPrice: parseFloat(rawStats.minPrice) || 0,
      maxPrice: parseFloat(rawStats.maxPrice) || 0,
      lastUpdated: rawStats.lastUpdated,
    };

    res.json(stats);
  }
);

/**
 * GET /api/cardamom-prices/varieties
 * Get list of unique cardamom varieties
 */
export const getCardamomVarieties = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await query(
      'SELECT DISTINCT variety FROM cardamom_prices ORDER BY variety'
    );
    const varieties = result.rows.map((row) => row.variety);
    res.json(varieties);
  }
);

/**
 * GET /api/cardamom-prices/markets
 * Get list of unique markets with location info
 */
export const getCardamomMarkets = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await query(
      `SELECT DISTINCT market, state, district
       FROM cardamom_prices
       ORDER BY market`
    );
    const markets = result.rows.map((row) => keysToCamel(row));
    res.json(markets);
  }
);

/**
 * POST /api/cardamom-prices/refresh
 * Manually trigger cardamom price refresh from indianspices.com
 * Requires authentication (admin/buyer only)
 */
export const refreshCardamomPrices = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      console.log('🔄 Manual refresh triggered for cardamom prices');

      // Fetch from indianspices.com with retry logic
      const records = await fetchCardamomPricesWithRetry(3);

      if (records.length === 0) {
        return res.json({
          message: 'No new cardamom records found from indianspices.com',
          inserted: 0,
          deleted: 0,
          totalRecords: 0,
        });
      }

      const summary = await persistCardamomRecords(records);
      const deletedCount = await deleteExpiredCardamomRecords();

      console.log(
        `✅ Refresh complete: ${summary.inserted} inserted, ${deletedCount} deleted`
      );

      if (summary.invalid > 0) {
        console.warn(`⚠️ ${summary.invalid} invalid records skipped during insert`);
      }

      res.json({
        message: 'Cardamom prices refreshed successfully',
        inserted: summary.inserted,
        deleted: deletedCount,
        totalRecords: records.length,
        skipped: summary.skipped,
        invalid: summary.invalid,
      });
    } catch (error) {
      console.error('❌ Failed to refresh cardamom prices:', error);
      throw new AppError(
        `Failed to refresh cardamom prices: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        500
      );
    }
  }
);
