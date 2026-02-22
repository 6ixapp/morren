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

/**
 * GET /api/cardamom-prices
 * Get cardamom prices with optional filters
 */
export const getCardamomPrices = asyncHandler(
  async (req: Request, res: Response) => {
    const { variety, market, startDate, endDate } = req.query;

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

    sqlQuery += ' ORDER BY arrival_date DESC, market ASC';

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

      // Transform and insert into database
      let insertedCount = 0;
      const errors: string[] = [];

      for (const record of records) {
        try {
          // Parse prices, handling potential null/undefined values
          const minPrice = record.min_price
            ? parseFloat(record.min_price)
            : null;
          const maxPrice = record.max_price
            ? parseFloat(record.max_price)
            : null;
          const modalPrice = parseFloat(record.modal_price);

          // Skip if modal price is invalid
          if (isNaN(modalPrice)) {
            errors.push(
              `Invalid modal_price for ${record.market} ${record.variety}`
            );
            continue;
          }

          await query(
            `INSERT INTO cardamom_prices
             (state, district, market, variety, min_price, max_price, modal_price, arrival_date, source)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (market, variety, arrival_date) DO NOTHING`,
            [
              record.state || null,
              record.district || null,
              record.market,
              record.variety || 'Unknown',
              minPrice,
              maxPrice,
              modalPrice,
              record.arrival_date,
              'indianspices.com',
            ]
          );
          insertedCount++;
        } catch (err) {
          console.error('Error inserting cardamom price record:', err);
          errors.push(
            `Failed to insert ${record.market} ${record.variety}: ${err}`
          );
          // Continue with other records
        }
      }

      // Cleanup old records (7-day retention)
      const deleteResult = await query(
        `DELETE FROM cardamom_prices
         WHERE arrival_date < CURRENT_DATE - INTERVAL '7 days'
         RETURNING id`
      );

      const deletedCount = deleteResult.rowCount || 0;

      console.log(
        `✅ Refresh complete: ${insertedCount} inserted, ${deletedCount} deleted`
      );

      if (errors.length > 0) {
        console.warn(`⚠️ ${errors.length} errors occurred during insert`);
      }

      res.json({
        message: 'Cardamom prices refreshed successfully',
        inserted: insertedCount,
        deleted: deletedCount,
        totalRecords: records.length,
        errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Return first 5 errors
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
