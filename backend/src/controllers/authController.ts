import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { keysToCamel, keysToSnake } from '../utils/dbHelpers';
import { AuthResponse, RegisterRequest, LoginRequest, User, UserRole } from '../types';

const SALT_ROUNDS = 10;

// POST /auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body as RegisterRequest;

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, email, role, avatar, phone, address, created_at, updated_at`,
    [name, email, passwordHash, role]
  );

  const user = keysToCamel(result.rows[0]) as User;

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

  const response: AuthResponse = {
    user,
    accessToken,
    refreshToken,
  };

  res.status(201).json(response);
});

// POST /auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest;

  // Find user
  const result = await query(
    `SELECT id, name, email, password_hash, role, avatar, phone, address, created_at, updated_at 
     FROM users 
     WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const dbUser = result.rows[0];

  // Verify password
  const isValidPassword = await bcrypt.compare(password, dbUser.password_hash);

  if (!isValidPassword) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = keysToCamel({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    avatar: dbUser.avatar,
    phone: dbUser.phone,
    address: dbUser.address,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  }) as User;

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Store refresh token
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

  const response: AuthResponse = {
    user,
    accessToken,
    refreshToken,
  };

  res.json(response);
});

// POST /auth/refresh
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Check if refresh token matches stored token
  const result = await query(
    'SELECT id, name, email, role, avatar, phone, address, created_at, updated_at FROM users WHERE id = $1 AND refresh_token = $2',
    [decoded.userId, refreshToken]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = keysToCamel(result.rows[0]) as User;

  // Generate new tokens
  const newAccessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const newRefreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Update stored refresh token
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [newRefreshToken, user.id]);

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// GET /auth/me
export const me = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const result = await query(
    'SELECT id, name, email, role, avatar, phone, address, created_at, updated_at FROM users WHERE id = $1',
    [req.user.userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = keysToCamel(result.rows[0]) as User;

  res.json({ user });
});

// POST /auth/logout
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  // Clear refresh token
  await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [req.user.userId]);

  res.json({ message: 'Logged out successfully' });
});
