// Application constants

export const BCRYPT_SALT_ROUNDS = 12;

export const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export const LANGUAGES = {
  ENGLISH: 'en',
  GREEK: 'el',
  GERMAN: 'de',
} as const;

export const RATE_LIMITS = {
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
  },
  API: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
};

export const VALIDATION = {
  EMAIL_MAX_LENGTH: 255,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  DISPLAY_NAME_MAX_LENGTH: 100,
  LIST_NAME_MAX_LENGTH: 200,
  ITEM_NAME_MAX_LENGTH: 200,
  QUANTITY_MAX_LENGTH: 50,
  NOTES_MAX_LENGTH: 1000,
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_EXISTS: 'Email already registered',
  INVALID_TOKEN: 'Invalid or expired token',
  LIST_NOT_FOUND: 'Shopping list not found',
  ITEM_NOT_FOUND: 'Item not found',
  NO_ACCESS: 'You do not have access to this resource',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this action',
  USER_NOT_FOUND: 'User not found',
  ALREADY_MEMBER: 'User is already a member of this list',
};
