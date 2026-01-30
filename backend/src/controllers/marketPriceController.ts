import { Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel } from '../utils/dbHelpers';
import { MarketPrice } from '../types';

// GET /api/market-prices
export const getMarketPrices = asyncHandler(async (req: Request, res: Response) => {
  const { productName } = req.query;

  let sqlQuery = 'SELECT * FROM market_prices';
  const params: any[] = [];

  if (productName) {
    sqlQuery += ' WHERE product_name ILIKE $1';
    params.push(`%${productName}%`);
  }

  sqlQuery += ' ORDER BY date DESC, created_at DESC';

  const result = await query(sqlQuery, params);

  const prices = result.rows.map((row) => keysToCamel(row)) as MarketPrice[];

  res.json(prices);
});

// POST /api/market-prices
export const addMarketPrice = asyncHandler(async (req: Request, res: Response) => {
  const { productName, price } = req.body;

  if (!productName || price === undefined) {
    throw new AppError('Product name and price are required', 400);
  }

  const result = await query(
    `INSERT INTO market_prices (product_name, price) 
     VALUES ($1, $2) 
     RETURNING *`,
    [productName, price]
  );

  const marketPrice = keysToCamel(result.rows[0]) as MarketPrice;

  res.status(201).json(marketPrice);
});

// DELETE /api/market-prices/:id
export const deleteMarketPrice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM market_prices WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Market price not found', 404);
  }

  res.json({ message: 'Market price deleted successfully' });
});
