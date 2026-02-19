import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as memberService from '../services/memberService';
import { emitToList, emitToUser } from '../socket/emitter';
import { getIO } from '../socket';

/**
 * Get all members of a list
 * GET /api/lists/:listId/members
 */
export const getMembers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { listId } = req.params;
    const members = await memberService.getListMembers(req.user.userId, listId);

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a member to a list
 * POST /api/lists/:listId/members
 */
export const addMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { listId } = req.params;
    const { email, role } = req.body;

    const member = await memberService.addMember(
      req.user.userId,
      listId,
      email,
      role
    );

    res.status(201).json({
      success: true,
      data: member,
    });

    emitToList(listId, 'member:added', { listId, member, userId: req.user.userId });
    emitToUser(member.userId, 'member:added', { listId, member, userId: req.user.userId });

    // Join the new member's socket(s) to the list room
    try {
      const sockets = await getIO().in(`user:${member.userId}`).fetchSockets();
      for (const s of sockets) {
        s.join(`list:${listId}`);
      }
    } catch (_) {}
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a member from a list
 * DELETE /api/lists/:listId/members/:userId
 */
export const removeMember = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { listId, userId: memberId } = req.params;
    await memberService.removeMember(req.user.userId, listId, memberId);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });

    emitToList(listId, 'member:removed', { listId, removedUserId: memberId, userId: req.user.userId });
    emitToUser(memberId, 'member:removed', { listId, removedUserId: memberId, userId: req.user.userId });

    // Remove the member's socket(s) from the list room
    try {
      const sockets = await getIO().in(`user:${memberId}`).fetchSockets();
      for (const s of sockets) {
        s.leave(`list:${listId}`);
      }
    } catch (_) {}
  } catch (error) {
    next(error);
  }
};

/**
 * Update a member's role
 * PUT /api/lists/:listId/members/:userId
 */
export const updateMemberRole = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { listId, userId: memberId } = req.params;
    const { role } = req.body;

    const member = await memberService.updateMemberRole(
      req.user.userId,
      listId,
      memberId,
      role
    );

    res.status(200).json({
      success: true,
      data: member,
    });

    emitToList(listId, 'member:updated', { listId, member, userId: req.user.userId });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave a shared list
 * POST /api/lists/:listId/leave
 */
export const leaveList = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { listId } = req.params;
    await memberService.leaveList(req.user.userId, listId);

    res.status(200).json({
      success: true,
      message: 'Left list successfully',
    });

    emitToList(listId, 'member:left', { listId, leftUserId: req.user.userId });

    // Remove the leaving user's socket(s) from the list room
    try {
      const sockets = await getIO().in(`user:${req.user.userId}`).fetchSockets();
      for (const s of sockets) {
        s.leave(`list:${listId}`);
      }
    } catch (_) {}
  } catch (error) {
    next(error);
  }
};
