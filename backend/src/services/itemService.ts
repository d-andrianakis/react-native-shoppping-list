import { db } from '../config/database';
import { ERROR_MESSAGES } from '../config/constants';
import { ListItem } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { checkListAccess } from './listService';

/**
 * Track item usage for autocomplete
 */
const trackItemUsage = async (userId: string, itemName: string): Promise<void> => {
  await db.none(
    `INSERT INTO common_items (user_id, name, usage_count, last_used_at)
     VALUES ($1, $2, 1, NOW())
     ON CONFLICT (user_id, name)
     DO UPDATE SET
       usage_count = common_items.usage_count + 1,
       last_used_at = NOW()`,
    [userId, itemName]
  );
};

/**
 * Get all items in a list
 */
export const getListItems = async (userId: string, listId: string) => {
  const access = await checkListAccess(userId, listId);
  if (!access) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }

  const items = await db.manyOrNone<ListItem>(
    `SELECT * FROM list_items
     WHERE list_id = $1
     ORDER BY is_checked ASC, position ASC, created_at ASC`,
    [listId]
  );

  return items;
};

/**
 * Add item to a list
 */
export const addItem = async (
  userId: string,
  listId: string,
  data: {
    name: string;
    quantity?: string;
    notes?: string;
  }
) => {
  const role = await checkListAccess(userId, listId);
  if (!role) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }
  if (role === 'viewer') {
    throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
  }

  // Get next position
  const result = await db.oneOrNone<{ max_position: number }>(
    'SELECT COALESCE(MAX(position), -1) as max_position FROM list_items WHERE list_id = $1',
    [listId]
  );
  const nextPosition = (result?.max_position ?? -1) + 1;

  const item = await db.one<ListItem>(
    `INSERT INTO list_items (list_id, name, quantity, notes, position)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [listId, data.name, data.quantity || null, data.notes || null, nextPosition]
  );

  // Track item usage for autocomplete
  await trackItemUsage(userId, data.name);

  return item;
};

/**
 * Update an item
 */
export const updateItem = async (
  userId: string,
  listId: string,
  itemId: string,
  updates: {
    name?: string;
    quantity?: string;
    notes?: string;
    position?: number;
  }
) => {
  const role = await checkListAccess(userId, listId);
  if (!role) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }
  if (role === 'viewer') {
    throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
  }

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.quantity !== undefined) {
    fields.push(`quantity = $${paramIndex++}`);
    values.push(updates.quantity);
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(updates.notes);
  }
  if (updates.position !== undefined) {
    fields.push(`position = $${paramIndex++}`);
    values.push(updates.position);
  }

  if (fields.length === 0) {
    const item = await db.oneOrNone<ListItem>(
      'SELECT * FROM list_items WHERE id = $1 AND list_id = $2',
      [itemId, listId]
    );
    if (!item) {
      throw new NotFoundError(ERROR_MESSAGES.ITEM_NOT_FOUND);
    }
    return item;
  }

  values.push(itemId, listId);

  const item = await db.oneOrNone<ListItem>(
    `UPDATE list_items SET ${fields.join(', ')}
     WHERE id = $${paramIndex} AND list_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );

  if (!item) {
    throw new NotFoundError(ERROR_MESSAGES.ITEM_NOT_FOUND);
  }

  return item;
};

/**
 * Delete an item
 */
export const deleteItem = async (userId: string, listId: string, itemId: string) => {
  const role = await checkListAccess(userId, listId);
  if (!role) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }
  if (role === 'viewer') {
    throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
  }

  const result = await db.result(
    'DELETE FROM list_items WHERE id = $1 AND list_id = $2',
    [itemId, listId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError(ERROR_MESSAGES.ITEM_NOT_FOUND);
  }

  return { success: true };
};

/**
 * Toggle item checked status
 */
export const toggleItemCheck = async (
  userId: string,
  listId: string,
  itemId: string
) => {
  const role = await checkListAccess(userId, listId);
  if (!role) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }
  if (role === 'viewer') {
    throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
  }

  const item = await db.oneOrNone<ListItem>(
    `UPDATE list_items
     SET
       is_checked = NOT is_checked,
       checked_at = CASE WHEN NOT is_checked THEN NOW() ELSE NULL END,
       checked_by = CASE WHEN NOT is_checked THEN $1 ELSE NULL END
     WHERE id = $2 AND list_id = $3
     RETURNING *`,
    [userId, itemId, listId]
  );

  if (!item) {
    throw new NotFoundError(ERROR_MESSAGES.ITEM_NOT_FOUND);
  }

  return item;
};

/**
 * Clear all checked items from a list
 */
export const clearCheckedItems = async (userId: string, listId: string) => {
  const role = await checkListAccess(userId, listId);
  if (!role) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }
  if (role === 'viewer') {
    throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
  }

  const result = await db.result(
    'DELETE FROM list_items WHERE list_id = $1 AND is_checked = true',
    [listId]
  );

  return {
    success: true,
    deletedCount: result.rowCount,
  };
};

/**
 * Reorder items in a list
 */
export const reorderItems = async (
  userId: string,
  listId: string,
  itemOrders: { itemId: string; position: number }[]
) => {
  const role = await checkListAccess(userId, listId);
  if (!role) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }
  if (role === 'viewer') {
    throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
  }

  // Update positions in a transaction
  await db.tx(async (t) => {
    for (const { itemId, position } of itemOrders) {
      await t.none(
        'UPDATE list_items SET position = $1 WHERE id = $2 AND list_id = $3',
        [position, itemId, listId]
      );
    }
  });

  return { success: true };
};
