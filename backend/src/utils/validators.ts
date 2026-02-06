import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { VALIDATION } from '../config/constants';
import { ValidationError } from './errors';

/**
 * Middleware to check validation results
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    throw new ValidationError(errorMessages);
  }
  next();
};

// Auth validation rules
export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .isLength({ max: VALIDATION.EMAIL_MAX_LENGTH })
    .withMessage(`Email must be less than ${VALIDATION.EMAIL_MAX_LENGTH} characters`),
  body('password')
    .isLength({ min: VALIDATION.PASSWORD_MIN_LENGTH, max: VALIDATION.PASSWORD_MAX_LENGTH })
    .withMessage(`Password must be between ${VALIDATION.PASSWORD_MIN_LENGTH} and ${VALIDATION.PASSWORD_MAX_LENGTH} characters`),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.DISPLAY_NAME_MAX_LENGTH })
    .withMessage(`Display name must be less than ${VALIDATION.DISPLAY_NAME_MAX_LENGTH} characters`),
  body('preferredLanguage')
    .optional()
    .isIn(['en', 'el', 'de'])
    .withMessage('Language must be en, el, or de'),
  validate,
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate,
];

// List validation rules
export const createListValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('List name is required')
    .isLength({ max: VALIDATION.LIST_NAME_MAX_LENGTH })
    .withMessage(`List name must be less than ${VALIDATION.LIST_NAME_MAX_LENGTH} characters`),
  validate,
];

export const updateListValidation = [
  param('id')
    .isUUID()
    .withMessage('Invalid list ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('List name cannot be empty')
    .isLength({ max: VALIDATION.LIST_NAME_MAX_LENGTH })
    .withMessage(`List name must be less than ${VALIDATION.LIST_NAME_MAX_LENGTH} characters`),
  validate,
];

// Item validation rules
export const createItemValidation = [
  param('listId')
    .isUUID()
    .withMessage('Invalid list ID'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required')
    .isLength({ max: VALIDATION.ITEM_NAME_MAX_LENGTH })
    .withMessage(`Item name must be less than ${VALIDATION.ITEM_NAME_MAX_LENGTH} characters`),
  body('quantity')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.QUANTITY_MAX_LENGTH })
    .withMessage(`Quantity must be less than ${VALIDATION.QUANTITY_MAX_LENGTH} characters`),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.NOTES_MAX_LENGTH })
    .withMessage(`Notes must be less than ${VALIDATION.NOTES_MAX_LENGTH} characters`),
  validate,
];

export const updateItemValidation = [
  param('listId')
    .isUUID()
    .withMessage('Invalid list ID'),
  param('itemId')
    .isUUID()
    .withMessage('Invalid item ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Item name cannot be empty')
    .isLength({ max: VALIDATION.ITEM_NAME_MAX_LENGTH })
    .withMessage(`Item name must be less than ${VALIDATION.ITEM_NAME_MAX_LENGTH} characters`),
  body('quantity')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.QUANTITY_MAX_LENGTH })
    .withMessage(`Quantity must be less than ${VALIDATION.QUANTITY_MAX_LENGTH} characters`),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: VALIDATION.NOTES_MAX_LENGTH })
    .withMessage(`Notes must be less than ${VALIDATION.NOTES_MAX_LENGTH} characters`),
  validate,
];

// Member validation rules
export const addMemberValidation = [
  param('listId')
    .isUUID()
    .withMessage('Invalid list ID'),
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['editor', 'viewer'])
    .withMessage('Role must be either editor or viewer'),
  validate,
];

// Suggestion validation rules
export const suggestionQueryValidation = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Query parameter is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Query must be between 1 and 100 characters'),
  validate,
];
