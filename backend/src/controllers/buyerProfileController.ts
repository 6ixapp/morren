import { Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel } from '../utils/dbHelpers';
import { BuyerProfile } from '../types';

// GET /api/buyer-profiles/:buyerId
export const getBuyerProfile = asyncHandler(async (req: Request, res: Response) => {
  const { buyerId } = req.params;

  const result = await query('SELECT * FROM buyer_profiles WHERE buyer_id = $1', [buyerId]);

  if (result.rows.length === 0) {
    throw new AppError('Buyer profile not found', 404);
  }

  const profile = keysToCamel(result.rows[0]) as BuyerProfile;

  res.json(profile);
});

// PUT /api/buyer-profiles/:buyerId
export const updateBuyerProfile = asyncHandler(async (req: Request, res: Response) => {
  const { buyerId } = req.params;
  const { companyName, buyerName, email } = req.body;

  // Check if profile exists
  const existing = await query('SELECT buyer_id FROM buyer_profiles WHERE buyer_id = $1', [buyerId]);

  let result;

  if (existing.rows.length > 0) {
    // Update
    result = await query(
      `UPDATE buyer_profiles 
       SET company_name = $1, buyer_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
       WHERE buyer_id = $4
       RETURNING *`,
      [companyName || null, buyerName || null, email || null, buyerId]
    );
  } else {
    // Insert
    result = await query(
      `INSERT INTO buyer_profiles (buyer_id, company_name, buyer_name, email) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [buyerId, companyName || null, buyerName || null, email || null]
    );
  }

  const profile = keysToCamel(result.rows[0]) as BuyerProfile;

  res.json(profile);
});
