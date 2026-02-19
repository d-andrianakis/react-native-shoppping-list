import { getIO } from './index';

/** Emit to all sockets in a list room */
export const emitToList = (listId: string, event: string, payload: any) => {
  getIO().to(`list:${listId}`).emit(event, payload);
};

/** Emit to a specific user's personal room */
export const emitToUser = (userId: string, event: string, payload: any) => {
  getIO().to(`user:${userId}`).emit(event, payload);
};
