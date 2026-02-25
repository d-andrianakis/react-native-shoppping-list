import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as suggestionService from '../services/suggestionService';

/**
 * Get autocomplete suggestions
 * GET /api/suggestions?q=milk
 */
export const getSuggestions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { q } = req.query;
    const limit = parseInt(req.query.limit as string) || 5;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
      return;
    }

    const suggestions = await suggestionService.getSuggestions(
      req.user.userId,
      q,
      limit
    );

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get most commonly used items
 * GET /api/suggestions/common
 */
export const getCommonItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const items = await suggestionService.getCommonItems(req.user.userId, limit);

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get suggestions by category
 * GET /api/suggestions/category/:category
 */
export const getSuggestionsByCategory = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { category } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const suggestions = await suggestionService.getSuggestionsByCategory(
      req.user.userId,
      category,
      limit
    );

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
};
