import { Request, Response } from 'express';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel, buildUpdateClause, parsePagination } from '../utils/dbHelpers';
import { Item, CreateItemRequest } from '../types';

// GET /api/items
export const getItems = asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const result = await query(`
    SELECT i.*, 
           u.id as seller_id, u.name as seller_name, u.email as seller_email, u.role as seller_role
    FROM items i
    LEFT JOIN users u ON i.seller_id = u.id
    ORDER BY i.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  const items = result.rows.map((row) => {
    const item = keysToCamel({
      id: row.id,
      name: row.name,
      description: row.description,
      image: row.image,
      price: row.price,
      size: row.size,
      category: row.category,
      condition: row.condition,
      quantity: row.quantity,
      specifications: row.specifications,
      sellerId: row.seller_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });

    if (row.seller_id) {
      item.seller = keysToCamel({
        id: row.seller_id,
        name: row.seller_name,
        email: row.seller_email,
        role: row.seller_role,
      });
    }

    return item;
  }) as Item[];

  res.json(items);
});

// GET /api/items/active
export const getActiveItems = asyncHandler(async (req: Request, res: Response) => {
  const { limit, offset } = parsePagination(req.query as Record<string, unknown>);
  const result = await query(`
    SELECT i.*, 
           u.id as seller_id, u.name as seller_name, u.email as seller_email, u.role as seller_role
    FROM items i
    LEFT JOIN users u ON i.seller_id = u.id
    WHERE i.status = 'active'
    ORDER BY i.created_at DESC
    LIMIT $1 OFFSET $2
  `, [limit, offset]);

  const items = result.rows.map((row) => {
    const item = keysToCamel({
      id: row.id,
      name: row.name,
      description: row.description,
      image: row.image,
      price: row.price,
      size: row.size,
      category: row.category,
      condition: row.condition,
      quantity: row.quantity,
      specifications: row.specifications,
      sellerId: row.seller_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });

    if (row.seller_id) {
      item.seller = keysToCamel({
        id: row.seller_id,
        name: row.seller_name,
        email: row.seller_email,
        role: row.seller_role,
      });
    }

    return item;
  }) as Item[];

  res.json(items);
});

// GET /api/items/:id
export const getItemById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT i.*, 
            u.id as seller_id, u.name as seller_name, u.email as seller_email, u.role as seller_role
     FROM items i
     LEFT JOIN users u ON i.seller_id = u.id
     WHERE i.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Item not found', 404);
  }

  const row = result.rows[0];
  const item = keysToCamel({
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    price: row.price,
    size: row.size,
    category: row.category,
    condition: row.condition,
    quantity: row.quantity,
    specifications: row.specifications,
    sellerId: row.seller_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }) as Item;

  if (row.seller_id) {
    item.seller = keysToCamel({
      id: row.seller_id,
      name: row.seller_name,
      email: row.seller_email,
      role: row.seller_role,
    });
  }

  res.json(item);
});

// POST /api/items
export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    description,
    image,
    price,
    size,
    category,
    condition,
    quantity,
    specifications,
    sellerId,
    status,
  } = req.body as CreateItemRequest;

  // Validate required fields
  if (!name) {
    throw new AppError('Item name is required', 400);
  }
  
  if (price === null || price === undefined || isNaN(Number(price)) || Number(price) < 0) {
    throw new AppError('Valid price is required (must be 0 or greater)', 400);
  }

  if (!category) {
    throw new AppError('Category is required', 400);
  }

  const result = await query(
    `INSERT INTO items (name, description, image, price, size, category, condition, quantity, specifications, seller_id, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
     RETURNING *`,
    [
      name,
      description || null,
      image || null,
      Number(price), // Ensure price is a number, not null
      size || null,
      category,
      condition || 'new',
      quantity || 1,
      specifications ? JSON.stringify(specifications) : null,
      sellerId || null,
      status || 'active',
    ]
  );

  const item = keysToCamel(result.rows[0]) as Item;

  res.status(201).json(item);
});

// PATCH /api/items/:id
export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (Object.keys(updates).length === 0) {
    throw new AppError('No update fields provided', 400);
  }

  // Validate price if it's being updated
  if ('price' in updates) {
    if (updates.price === null || updates.price === undefined || isNaN(Number(updates.price)) || Number(updates.price) < 0) {
      throw new AppError('Valid price is required (must be 0 or greater)', 400);
    }
    updates.price = Number(updates.price);
  }

  // Handle specifications JSON
  if (updates.specifications) {
    updates.specifications = JSON.stringify(updates.specifications);
  }

  const { clause, values } = buildUpdateClause(updates);

  const result = await query(
    `UPDATE items ${clause} WHERE id = $${values.length + 1} RETURNING *`,
    [...values, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Item not found', 404);
  }

  const item = keysToCamel(result.rows[0]) as Item;

  res.json(item);
});

// DELETE /api/items/:id
export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM items WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('Item not found', 404);
  }

  res.json({ message: 'Item deleted successfully' });
});
