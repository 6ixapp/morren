import { Request, Response } from 'express';
import crypto from 'crypto';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel, buildUpdateClause } from '../utils/dbHelpers';
import { RFQ, CreateRFQRequest, CreateQuoteRequest } from '../types';

// GET /api/rfqs
export const getRFQs = asyncHandler(async (req: Request, res: Response) => {
  const { buyerId } = req.query;

  let sqlQuery = `
    SELECT r.*,
           json_agg(DISTINCT jsonb_build_object(
             'id', si.id,
             'rfqId', si.rfq_id,
             'supplierId', si.supplier_id,
             'status', si.status,
             'inviteToken', si.invite_token,
             'sentAt', si.sent_at,
             'viewedAt', si.viewed_at,
             'quotedAt', si.quoted_at
           )) FILTER (WHERE si.id IS NOT NULL) as invites,
           json_agg(DISTINCT jsonb_build_object(
             'id', q.id,
             'rfqId', q.rfq_id,
             'supplierId', q.supplier_id,
             'supplierName', q.supplier_name,
             'pricePerUnit', q.price_per_unit,
             'totalPrice', q.total_price,
             'deliveryDays', q.delivery_days,
             'validityDays', q.validity_days,
             'notes', q.notes,
             'submittedAt', q.submitted_at
           )) FILTER (WHERE q.id IS NOT NULL) as quotes
    FROM rfqs r
    LEFT JOIN supplier_invites si ON r.id = si.rfq_id
    LEFT JOIN quotes q ON r.id = q.rfq_id
  `;

  const params: any[] = [];
  if (buyerId) {
    sqlQuery += ' WHERE r.buyer_id = $1';
    params.push(buyerId);
  }

  sqlQuery += ' GROUP BY r.id ORDER BY r.created_at DESC';

  const result = await query(sqlQuery, params);

  const rfqs = result.rows.map((row) => ({
    ...keysToCamel(row),
    invites: row.invites ? row.invites.map((inv: any) => keysToCamel(inv)) : [],
    quotes: row.quotes ? row.quotes.map((q: any) => keysToCamel(q)) : [],
  })) as RFQ[];

  res.json(rfqs);
});

// GET /api/rfqs/:id
export const getRFQById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT r.*,
            json_agg(DISTINCT jsonb_build_object(
              'id', si.id,
              'rfqId', si.rfq_id,
              'supplierId', si.supplier_id,
              'status', si.status,
              'inviteToken', si.invite_token,
              'sentAt', si.sent_at,
              'viewedAt', si.viewed_at,
              'quotedAt', si.quoted_at
            )) FILTER (WHERE si.id IS NOT NULL) as invites,
            json_agg(DISTINCT jsonb_build_object(
              'id', q.id,
              'rfqId', q.rfq_id,
              'supplierId', q.supplier_id,
              'supplierName', q.supplier_name,
              'pricePerUnit', q.price_per_unit,
              'totalPrice', q.total_price,
              'deliveryDays', q.delivery_days,
              'validityDays', q.validity_days,
              'notes', q.notes,
              'submittedAt', q.submitted_at
            )) FILTER (WHERE q.id IS NOT NULL) as quotes
     FROM rfqs r
     LEFT JOIN supplier_invites si ON r.id = si.rfq_id
     LEFT JOIN quotes q ON r.id = q.rfq_id
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('RFQ not found', 404);
  }

  const row = result.rows[0];
  const rfq = {
    ...keysToCamel(row),
    invites: row.invites ? row.invites.map((inv: any) => keysToCamel(inv)) : [],
    quotes: row.quotes ? row.quotes.map((q: any) => keysToCamel(q)) : [],
  } as RFQ;

  res.json(rfq);
});

// GET /api/rfqs/by-invite/:token
export const getRFQByInviteToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  const result = await query(
    `SELECT r.*,
            si.id as invite_id, si.status as invite_status, si.viewed_at, si.quoted_at,
            s.id as supplier_id, s.name as supplier_name, s.email as supplier_email
     FROM supplier_invites si
     JOIN rfqs r ON si.rfq_id = r.id
     JOIN suppliers s ON si.supplier_id = s.id
     WHERE si.invite_token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid invite token', 404);
  }

  const row = result.rows[0];

  res.json({
    rfq: keysToCamel({
      id: row.id,
      buyerId: row.buyer_id,
      productName: row.product_name,
      specs: row.specs,
      quantity: row.quantity,
      unit: row.unit,
      requiredByDate: row.required_by_date,
      status: row.status,
      createdAt: row.created_at,
    }),
    invite: keysToCamel({
      id: row.invite_id,
      status: row.invite_status,
      viewedAt: row.viewed_at,
      quotedAt: row.quoted_at,
    }),
    supplier: keysToCamel({
      id: row.supplier_id,
      name: row.supplier_name,
      email: row.supplier_email,
    }),
  });
});

// POST /api/rfqs
export const createRFQ = asyncHandler(async (req: Request, res: Response) => {
  const { buyerId, productName, specs, quantity, unit, requiredByDate } = req.body as CreateRFQRequest;

  const result = await query(
    `INSERT INTO rfqs (buyer_id, product_name, specs, quantity, unit, required_by_date) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING *`,
    [buyerId, productName, specs || null, quantity, unit || null, requiredByDate || null]
  );

  const rfq = keysToCamel(result.rows[0]) as RFQ;

  res.status(201).json(rfq);
});

// PATCH /api/rfqs/:id
export const updateRFQ = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    throw new AppError('No update fields provided', 400);
  }

  // Handle awardedTo JSON
  if (updates.awardedTo) {
    updates.awardedTo = JSON.stringify(updates.awardedTo);
  }

  const { clause, values } = buildUpdateClause(updates);

  const result = await query(
    `UPDATE rfqs ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('RFQ not found', 404);
  }

  const rfq = keysToCamel(result.rows[0]) as RFQ;

  res.json(rfq);
});

// POST /api/rfqs/:id/invites
export const addInviteToRFQ = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { supplierId } = req.body;

  if (!supplierId) {
    throw new AppError('Supplier ID is required', 400);
  }

  // Generate unique token
  const inviteToken = crypto.randomBytes(32).toString('hex');

  const result = await query(
    `INSERT INTO supplier_invites (rfq_id, supplier_id, invite_token) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [id, supplierId, inviteToken]
  );

  const invite = keysToCamel(result.rows[0]);

  res.status(201).json(invite);
});

// PATCH /api/supplier-invites/viewed
export const markInviteViewed = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError('Token is required', 400);
  }

  const result = await query(
    `UPDATE supplier_invites SET viewed_at = CURRENT_TIMESTAMP WHERE invite_token = $1 AND viewed_at IS NULL RETURNING *`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invite not found or already viewed', 404);
  }

  const invite = keysToCamel(result.rows[0]);

  res.json(invite);
});

// POST /api/rfqs/:id/quote
export const submitQuote = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { supplierId, supplierName, pricePerUnit, totalPrice, deliveryDays, validityDays, notes } =
    req.body as CreateQuoteRequest;

  // Check if quote already exists
  const existingQuote = await query(
    'SELECT id FROM quotes WHERE rfq_id = $1 AND supplier_id = $2',
    [id, supplierId]
  );

  let result;

  if (existingQuote.rows.length > 0) {
    // Update existing quote
    result = await query(
      `UPDATE quotes 
       SET supplier_name = $1, price_per_unit = $2, total_price = $3, delivery_days = $4, validity_days = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
       WHERE rfq_id = $7 AND supplier_id = $8
       RETURNING *`,
      [supplierName, pricePerUnit, totalPrice, deliveryDays || null, validityDays || null, notes || null, id, supplierId]
    );
  } else {
    // Create new quote
    result = await query(
      `INSERT INTO quotes (rfq_id, supplier_id, supplier_name, price_per_unit, total_price, delivery_days, validity_days, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [id, supplierId, supplierName, pricePerUnit, totalPrice, deliveryDays || null, validityDays || null, notes || null]
    );
  }

  // Mark invite as quoted
  await query(
    'UPDATE supplier_invites SET quoted_at = CURRENT_TIMESTAMP, status = $1 WHERE rfq_id = $2 AND supplier_id = $3',
    ['quoted', id, supplierId]
  );

  const quote = keysToCamel(result.rows[0]);

  res.json(quote);
});

// POST /api/rfqs/:id/award
export const awardRFQ = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { supplierId, supplierName, price } = req.body;

  if (!supplierId || !supplierName || !price) {
    throw new AppError('Supplier ID, supplier name, and price are required', 400);
  }

  const awardedTo = {
    supplierId,
    supplierName,
    price,
  };

  const result = await query(
    `UPDATE rfqs SET status = 'awarded', awarded_to = $1 WHERE id = $2 RETURNING *`,
    [JSON.stringify(awardedTo), id]
  );

  if (result.rows.length === 0) {
    throw new AppError('RFQ not found', 404);
  }

  const rfq = keysToCamel(result.rows[0]) as RFQ;

  res.json(rfq);
});
