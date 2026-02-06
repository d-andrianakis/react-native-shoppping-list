import bcrypt from 'bcrypt';
import { db } from '../config/database';
import { BCRYPT_SALT_ROUNDS, ERROR_MESSAGES } from '../config/constants';
import { User, TokenPayload } from '../types';
import { generateTokenPair, verifyRefreshToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, NotFoundError } from '../utils/errors';

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Register a new user
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName?: string,
  preferredLanguage: 'en' | 'el' | 'de' = 'en'
) => {
  // Check if user already exists
  const existingUser = await db.oneOrNone(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser) {
    throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await db.one<User>(
    `INSERT INTO users (email, password_hash, display_name, preferred_language)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, display_name, preferred_language, created_at`,
    [email, passwordHash, displayName || null, preferredLanguage]
  );

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      preferredLanguage: user.preferred_language,
    },
    ...tokens,
  };
};

/**
 * Login user
 */
export const loginUser = async (email: string, password: string) => {
  // Find user
  const user = await db.oneOrNone<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (!user) {
    throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password_hash);

  if (!isValidPassword) {
    throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CREDENTIALS);
  }

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      preferredLanguage: user.preferred_language,
    },
    ...tokens,
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string) => {
  try {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await db.oneOrNone<User>(
      'SELECT id, email FROM users WHERE id = $1',
      [payload.userId]
    );

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
    });

    return tokens;
  } catch (error) {
    throw new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN);
  }
};

/**
 * Get user profile by ID
 */
export const getUserProfile = async (userId: string) => {
  const user = await db.oneOrNone<User>(
    `SELECT id, email, display_name, preferred_language, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (!user) {
    throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    preferredLanguage: user.preferred_language,
    createdAt: user.created_at,
  };
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: {
    displayName?: string;
    preferredLanguage?: 'en' | 'el' | 'de';
  }
) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.displayName !== undefined) {
    fields.push(`display_name = $${paramIndex++}`);
    values.push(updates.displayName);
  }

  if (updates.preferredLanguage !== undefined) {
    fields.push(`preferred_language = $${paramIndex++}`);
    values.push(updates.preferredLanguage);
  }

  if (fields.length === 0) {
    return getUserProfile(userId);
  }

  values.push(userId);

  const user = await db.one<User>(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, email, display_name, preferred_language`,
    values
  );

  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    preferredLanguage: user.preferred_language,
  };
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  // Get current password hash
  const user = await db.oneOrNone<User>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (!user) {
    throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // Verify current password
  const isValidPassword = await comparePassword(currentPassword, user.password_hash);

  if (!isValidPassword) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(newPassword);

  // Update password
  await db.none(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [newPasswordHash, userId]
  );

  return { success: true };
};
