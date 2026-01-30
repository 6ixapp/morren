import { Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel } from '../utils/dbHelpers';
import { Supplier, CreateSupplierRequest } from '../types';

// GET /api/suppliers
export const getSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const result = await query('SELECT * FROM suppliers ORDER BY name ASC');

  const suppliers = result.rows.map((row) => keysToCamel(row)) as Supplier[];

  res.json(suppliers);
});

// GET /api/suppliers/:id
export const getSupplierById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query('SELECT * FROM suppliers WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Supplier not found', 404);
  }

  const supplier = keysToCamel(result.rows[0]) as Supplier;

  res.json(supplier);
});

// POST /api/suppliers
export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, contactPerson } = req.body as CreateSupplierRequest;

  const result = await query(
    `INSERT INTO suppliers (name, email, phone, contact_person) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [name, email, phone || null, contactPerson || null]
  );

  const supplier = keysToCamel(result.rows[0]) as Supplier;

  res.status(201).json(supplier);
});

// PATCH /api/suppliers/:id
export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, contactPerson } = req.body;

  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (email !== undefined) {
    updates.push(`email = $${paramIndex++}`);
    values.push(email);
  }
  if (phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`);
    values.push(phone);
  }
  if (contactPerson !== undefined) {
    updates.push(`contact_person = $${paramIndex++}`);
    values.push(contactPerson);
  }

  if (updates.length === 0) {
    throw new AppError('No update fields provided', 400);
  }

  values.push(id);

  const result = await query(
    `UPDATE suppliers SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError('Supplier not found', 404);
  }

  const supplier = keysToCamel(result.rows[0]) as Supplier;

  res.json(supplier);
});

// DELETE /api/suppliers/:id
export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Supplier not found', 404);
  }

  res.json({ message: 'Supplier deleted successfully' });
});
