import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { TokenPayload } from '../types';
import { db } from '../config/database';
import { env } from '../config/env';

let io: Server;

export interface AuthenticatedSocket extends Socket {
  user: TokenPayload;
}

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.ALLOWED_ORIGINS,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware - verify JWT before allowing connection
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      (socket as AuthenticatedSocket).user = payload;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.user.userId;

    console.log(`Socket connected: user=${userId}, socketId=${socket.id}`);

    // Join personal room
    socket.join(`user:${userId}`);

    // Join all list rooms the user belongs to
    try {
      const lists = await db.manyOrNone(
        `SELECT sl.id FROM shopping_lists sl
         LEFT JOIN list_members lm ON lm.list_id = sl.id
         WHERE sl.owner_id = $1 OR lm.user_id = $1`,
        [userId]
      );
      for (const list of lists) {
        socket.join(`list:${list.id}`);
      }
      console.log(`User ${userId} joined ${lists.length} list rooms`);
    } catch (err) {
      console.error('Error joining list rooms:', err);
    }

    // Client can request to join a specific list room
    socket.on('join:list', (listId: string) => {
      socket.join(`list:${listId}`);
    });

    // Client can leave a room
    socket.on('leave:list', (listId: string) => {
      socket.leave(`list:${listId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: user=${userId}, reason=${reason}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized');
  }
  return io;
};
