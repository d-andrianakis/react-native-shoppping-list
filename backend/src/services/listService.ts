import { db } from '../config/database';
import { ERROR_MESSAGES } from '../config/constants';
import { ShoppingList } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';

/**
 * Check if user has access to a list and what role they have
 */
export const checkListAccess = async (
  userId: string,
  listId: string
): Promise<'owner' | 'editor' | 'viewer' | null> => {
  const result = await db.oneOrNone(
    `SELECT
      CASE
        WHEN sl.owner_id = $1 THEN 'owner'
        ELSE lm.role
      END as role
     FROM shopping_lists sl
     LEFT JOIN list_members lm ON lm.list_id = sl.id AND lm.user_id = $1
     WHERE sl.id = $2 AND (sl.owner_id = $1 OR lm.user_id = $1)`,
    [userId, listId]
  );

  return result ? result.role : null;
};

/**
 * Ensure user has required access level to a list
 */
const ensureAccess = async (
  userId: string,
  listId: string,
  requiredRole: 'owner' | 'editor' | 'viewer' = 'viewer'
): Promise<void> => {
  const role = await checkListAccess(userId, listId);

  if (!role) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }

  const roleHierarchy = { viewer: 1, editor: 2, owner: 3 };
  if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
    throw new ForbiddenError(ERROR_MESSAGES.INSUFFICIENT_PERMISSIONS);
  }
};

/**
 * Get all lists for a user (owned + shared)
 */
export const getUserLists = async (userId: string) => {
  const lists = await db.manyOrNone(
    `SELECT DISTINCT ON (sl.id)
       sl.id,
       sl.name,
       sl.owner_id,
       sl.created_at,
       sl.updated_at,
       sl.is_archived,
       CASE WHEN sl.owner_id = $1 THEN 'owner' ELSE lm.role END as user_role,
       (SELECT COUNT(*) FROM list_items WHERE list_id = sl.id AND is_checked = false) as active_items_count,
       (SELECT COUNT(*) FROM list_items WHERE list_id = sl.id) as total_items_count,
       (SELECT COUNT(*) FROM list_members WHERE list_id = sl.id) + 1 as member_count
     FROM shopping_lists sl
     LEFT JOIN list_members lm ON lm.list_id = sl.id
     WHERE sl.owner_id = $1 OR lm.user_id = $1
     ORDER BY sl.id, sl.updated_at DESC`,
    [userId]
  );

  return lists;
};

/**
 * Get a specific list with details
 */
export const getListById = async (userId: string, listId: string) => {
  await ensureAccess(userId, listId, 'viewer');

  const list = await db.oneOrNone(
    `SELECT
       sl.id,
       sl.name,
       sl.owner_id,
       sl.created_at,
       sl.updated_at,
       sl.is_archived,
       CASE WHEN sl.owner_id = $1 THEN 'owner' ELSE lm.role END as user_role,
       (SELECT COUNT(*) FROM list_items WHERE list_id = sl.id AND is_checked = false) as active_items_count,
       (SELECT COUNT(*) FROM list_items WHERE list_id = sl.id) as total_items_count
     FROM shopping_lists sl
     LEFT JOIN list_members lm ON lm.list_id = sl.id AND lm.user_id = $1
     WHERE sl.id = $2 AND (sl.owner_id = $1 OR lm.user_id = $1)`,
    [userId, listId]
  );

  if (!list) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }

  return list;
};

/**
 * Create a new shopping list
 */
export const createList = async (userId: string, name: string) => {
  const list = await db.one<ShoppingList>(
    `INSERT INTO shopping_lists (name, owner_id)
     VALUES ($1, $2)
     RETURNING id, name, owner_id, created_at, updated_at, is_archived`,
    [name, userId]
  );

  return {
    ...list,
    user_role: 'owner',
    active_items_count: 0,
    total_items_count: 0,
    member_count: 1,
  };
};

/**
 * Update a shopping list
 */
export const updateList = async (
  userId: string,
  listId: string,
  updates: { name?: string; isArchived?: boolean }
) => {
  await ensureAccess(userId, listId, 'editor');

  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }

  if (updates.isArchived !== undefined) {
    fields.push(`is_archived = $${paramIndex++}`);
    values.push(updates.isArchived);
  }

  if (fields.length === 0) {
    return getListById(userId, listId);
  }

  values.push(listId);

  const list = await db.one(
    `UPDATE shopping_lists
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, owner_id, created_at, updated_at, is_archived`,
    values
  );

  return list;
};

/**
 * Delete a shopping list (owner only)
 */
export const deleteList = async (userId: string, listId: string) => {
  await ensureAccess(userId, listId, 'owner');

  await db.none('DELETE FROM shopping_lists WHERE id = $1', [listId]);

  return { success: true };
};

/**
 * Archive/unarchive a list
 */
export const archiveList = async (userId: string, listId: string, archive: boolean) => {
  return updateList(userId, listId, { isArchived: archive });
};
