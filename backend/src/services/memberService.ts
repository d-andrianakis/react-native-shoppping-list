import { db } from '../config/database';
import { ERROR_MESSAGES } from '../config/constants';
import { ListMember } from '../types';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { checkListAccess } from './listService';

/**
 * Get all members of a list
 */
export const getListMembers = async (userId: string, listId: string) => {
  const access = await checkListAccess(userId, listId);
  if (!access) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }

  const members = await db.manyOrNone(
    `SELECT
       u.id as user_id,
       u.email,
       u.display_name,
       CASE
         WHEN sl.owner_id = u.id THEN 'owner'
         ELSE lm.role
       END as role,
       COALESCE(lm.joined_at, sl.created_at) as joined_at
     FROM shopping_lists sl
     LEFT JOIN list_members lm ON lm.list_id = sl.id
     LEFT JOIN users u ON u.id = COALESCE(lm.user_id, sl.owner_id)
     WHERE sl.id = $1 AND (lm.user_id IS NOT NULL OR sl.owner_id = u.id)
     ORDER BY
       CASE WHEN sl.owner_id = u.id THEN 0 ELSE 1 END,
       lm.joined_at ASC`,
    [listId]
  );

  return members;
};

/**
 * Add a member to a list by email
 */
export const addMember = async (
  userId: string,
  listId: string,
  memberEmail: string,
  role: 'editor' | 'viewer' = 'editor'
) => {
  // Only owner can add members
  const userRole = await checkListAccess(userId, listId);
  if (!userRole) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }
  if (userRole !== 'owner') {
    throw new ForbiddenError('Only the list owner can add members');
  }

  // Find user by email
  const targetUser = await db.oneOrNone(
    'SELECT id, email, display_name FROM users WHERE email = $1',
    [memberEmail]
  );

  if (!targetUser) {
    throw new NotFoundError(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  // Check if user is already the owner
  const list = await db.oneOrNone(
    'SELECT owner_id FROM shopping_lists WHERE id = $1',
    [listId]
  );

  if (list && list.owner_id === targetUser.id) {
    throw new ConflictError('User is already the owner of this list');
  }

  // Check if user is already a member
  const existingMember = await db.oneOrNone(
    'SELECT id FROM list_members WHERE list_id = $1 AND user_id = $2',
    [listId, targetUser.id]
  );

  if (existingMember) {
    throw new ConflictError(ERROR_MESSAGES.ALREADY_MEMBER);
  }

  // Add member
  const member = await db.one<ListMember>(
    `INSERT INTO list_members (list_id, user_id, role)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [listId, targetUser.id, role]
  );

  return {
    id: member.id,
    userId: targetUser.id,
    email: targetUser.email,
    displayName: targetUser.display_name,
    role: member.role,
    joinedAt: member.joined_at,
  };
};

/**
 * Remove a member from a list
 */
export const removeMember = async (
  userId: string,
  listId: string,
  memberId: string
) => {
  // Only owner can remove members
  const userRole = await checkListAccess(userId, listId);
  if (!userRole) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }
  if (userRole !== 'owner') {
    throw new ForbiddenError('Only the list owner can remove members');
  }

  // Check if trying to remove the owner
  const list = await db.oneOrNone(
    'SELECT owner_id FROM shopping_lists WHERE id = $1',
    [listId]
  );

  if (list && list.owner_id === memberId) {
    throw new ForbiddenError('Cannot remove the list owner');
  }

  const result = await db.result(
    'DELETE FROM list_members WHERE list_id = $1 AND user_id = $2',
    [listId, memberId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Member not found');
  }

  return { success: true };
};

/**
 * Update a member's role
 */
export const updateMemberRole = async (
  userId: string,
  listId: string,
  memberId: string,
  newRole: 'editor' | 'viewer'
) => {
  // Only owner can update roles
  const userRole = await checkListAccess(userId, listId);
  if (!userRole) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }
  if (userRole !== 'owner') {
    throw new ForbiddenError('Only the list owner can update member roles');
  }

  // Cannot change owner's role
  const list = await db.oneOrNone(
    'SELECT owner_id FROM shopping_lists WHERE id = $1',
    [listId]
  );

  if (list && list.owner_id === memberId) {
    throw new ForbiddenError("Cannot change the owner's role");
  }

  const member = await db.oneOrNone(
    `UPDATE list_members
     SET role = $1
     WHERE list_id = $2 AND user_id = $3
     RETURNING *`,
    [newRole, listId, memberId]
  );

  if (!member) {
    throw new NotFoundError('Member not found');
  }

  return member;
};

/**
 * Leave a shared list
 */
export const leaveList = async (userId: string, listId: string) => {
  const userRole = await checkListAccess(userId, listId);
  if (!userRole) {
    throw new NotFoundError(ERROR_MESSAGES.LIST_NOT_FOUND);
  }

  // Owner cannot leave their own list
  if (userRole === 'owner') {
    throw new ForbiddenError('List owner cannot leave. Delete the list instead.');
  }

  const result = await db.result(
    'DELETE FROM list_members WHERE list_id = $1 AND user_id = $2',
    [listId, userId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('You are not a member of this list');
  }

  return { success: true };
};
