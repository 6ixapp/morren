import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { keysToCamel, buildUpdateClause } from '../utils/dbHelpers';
import { User, CreateUserRequest, UpdateUserRequest } from '../types';

const SALT_ROUNDS = 10;

// GET /api/users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const result = await query(
    'SELECT id, name, email, role, avatar, phone, address, created_at, updated_at FROM users ORDER BY created_at DESC'
  );

  const users = result.rows.map((row) => keysToCamel(row)) as User[];

  res.json(users);
});

// GET /api/users/:id
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    'SELECT id, name, email, role, avatar, phone, address, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = keysToCamel(result.rows[0]) as User;

  res.json(user);
});

// POST /api/users
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role, avatar, phone, address } = req.body as CreateUserRequest;

  let passwordHash: string | null = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role, avatar, phone, address) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING id, name, email, role, avatar, phone, address, created_at, updated_at`,
    [name, email, passwordHash, role, avatar || null, phone || null, address || null]
  );

  const user = keysToCamel(result.rows[0]) as User;

  res.status(201).json(user);
});

// PATCH /api/users/:id
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as UpdateUserRequest;

  if (Object.keys(updates).length === 0) {
    throw new AppError('No update fields provided', 400);
  }

  const { clause, values } = buildUpdateClause(updates);

  const result = await query(
    `UPDATE users ${clause} WHERE id = $${values.length + 1} 
     RETURNING id, name, email, role, avatar, phone, address, created_at, updated_at`,
    [...values, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = keysToCamel(result.rows[0]) as User;

  res.json(user);
});

// POST /api/users/seller
export const createSellerAccount = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    throw new AppError('Email, password, and name are required', 400);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, role) 
     VALUES ($1, $2, $3, 'seller') 
     RETURNING id, name, email, role, avatar, phone, address, created_at, updated_at`,
    [name, email, passwordHash]
  );

  const user = keysToCamel(result.rows[0]) as User;

  res.status(201).json(user);
});

// DELETE /api/users/:id (optional, for admin)
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  res.json({ message: 'User deleted successfully' });
});
