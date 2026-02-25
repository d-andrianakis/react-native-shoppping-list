import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as listService from '../services/listService';
import { emitToList, emitToUser } from '../socket/emitter';

/**
 * Get all lists for authenticated user
 * GET /api/lists
 */
export const getLists = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const lists = await listService.getUserLists(req.user.userId);

    res.status(200).json({
      success: true,
      data: lists,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific list by ID
 * GET /api/lists/:id
 */
export const getListById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const list = await listService.getListById(req.user.userId, id);

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new shopping list
 * POST /api/lists
 */
export const createList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { name } = req.body;
    const list = await listService.createList(req.user.userId, name);

    res.status(201).json({
      success: true,
      data: list,
    });

    emitToUser(req.user.userId, 'list:created', { list, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a shopping list
 * PUT /api/lists/:id
 */
export const updateList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { name, isArchived } = req.body;

    const list = await listService.updateList(req.user.userId, id, {
      name,
      isArchived,
    });

    res.status(200).json({
      success: true,
      data: list,
    });

    emitToList(id, 'list:updated', { list, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a shopping list
 * DELETE /api/lists/:id
 */
export const deleteList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Emit before delete so the room still exists
    emitToList(id, 'list:deleted', { listId: id, userId: req.user.userId });

    await listService.deleteList(req.user.userId, id);

    res.status(200).json({
      success: true,
      message: 'List deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Archive or unarchive a list
 * PATCH /api/lists/:id/archive
 */
export const archiveList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { archive } = req.body;

    const list = await listService.archiveList(req.user.userId, id, archive);

    res.status(200).json({
      success: true,
      data: list,
    });

    emitToList(id, 'list:archived', { list, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};
