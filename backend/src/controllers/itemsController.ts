import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as itemService from '../services/itemService';
import { emitToList } from '../socket/emitter';

/**
 * Get all items in a list
 * GET /api/lists/:listId/items
 */
export const getItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { listId } = req.params;
    const items = await itemService.getListItems(req.user.userId, listId);

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to list
 * POST /api/lists/:listId/items
 */
export const addItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { listId } = req.params;
    const { name, quantity, notes } = req.body;

    const item = await itemService.addItem(req.user.userId, listId, {
      name,
      quantity,
      notes,
    });

    res.status(201).json({
      success: true,
      data: item,
    });

    emitToList(listId, 'item:added', { listId, item, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an item
 * PUT /api/lists/:listId/items/:itemId
 */
export const updateItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { listId, itemId } = req.params;
    const { name, quantity, notes, position } = req.body;

    const item = await itemService.updateItem(req.user.userId, listId, itemId, {
      name,
      quantity,
      notes,
      position,
    });

    res.status(200).json({
      success: true,
      data: item,
    });

    emitToList(listId, 'item:updated', { listId, item, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an item
 * DELETE /api/lists/:listId/items/:itemId
 */
export const deleteItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { listId, itemId } = req.params;
    await itemService.deleteItem(req.user.userId, listId, itemId);

    res.status(200).json({
      success: true,
      message: 'Item deleted successfully',
    });

    emitToList(listId, 'item:deleted', { listId, itemId, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle item checked status
 * PATCH /api/lists/:listId/items/:itemId/check
 */
export const toggleCheck = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { listId, itemId } = req.params;
    const item = await itemService.toggleItemCheck(req.user.userId, listId, itemId);

    res.status(200).json({
      success: true,
      data: item,
    });

    emitToList(listId, 'item:checked', { listId, item, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear all checked items
 * POST /api/lists/:listId/items/clear-checked
 */
export const clearChecked = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { listId } = req.params;
    const result = await itemService.clearCheckedItems(req.user.userId, listId);

    res.status(200).json({
      success: true,
      data: result,
    });

    emitToList(listId, 'items:cleared', { listId, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder items
 * POST /api/lists/:listId/items/reorder
 */
export const reorderItems = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { listId } = req.params;
    const { itemOrders } = req.body;

    if (!Array.isArray(itemOrders)) {
      res.status(400).json({
        success: false,
        error: 'itemOrders must be an array',
      });
      return;
    }

    await itemService.reorderItems(req.user.userId, listId, itemOrders);

    // Fetch updated items to include in the event payload
    const updatedItems = await itemService.getListItems(req.user.userId, listId);

    res.status(200).json({
      success: true,
      message: 'Items reordered successfully',
    });

    emitToList(listId, 'items:reordered', { listId, items: updatedItems, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};
