import { io, Socket } from 'socket.io-client';
import ENV from '../../config/env';
import { store } from '../../store';
import {
  createListSuccess,
  updateListSuccess,
  deleteListSuccess,
  fetchListsStart,
  fetchListsSuccess,
} from '../../store/slices/listsSlice';
import {
  addItemSuccess,
  updateItemSuccess,
  deleteItemSuccess,
  toggleItemCheckSuccess,
  clearCheckedItemsSuccess,
  fetchItemsSuccess,
} from '../../store/slices/itemsSlice';
import { listsApi } from '../api/lists.api';

// Derive the socket URL (strip /api from the API base URL)
const SOCKET_URL = ENV.API_BASE_URL.replace('/api', '');

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;

  connect(token: string, userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.currentUserId = userId;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.registerEventListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
    }
  }

  reconnectWithToken(token: string) {
    if (this.socket) {
      this.socket.auth = { token };
      this.socket.disconnect().connect();
    }
  }

  joinList(listId: string) {
    this.socket?.emit('join:list', listId);
  }

  leaveList(listId: string) {
    this.socket?.emit('leave:list', listId);
  }

  private isSelfEvent(userId: string): boolean {
    return userId === this.currentUserId;
  }

  private registerEventListeners() {
    if (!this.socket) return;

    // ---- List events ----
    this.socket.on('list:created', ({ list, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(createListSuccess(list));
    });

    this.socket.on('list:updated', ({ list, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(updateListSuccess(list));
    });

    this.socket.on('list:deleted', ({ listId, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(deleteListSuccess(listId));
    });

    this.socket.on('list:archived', ({ list, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(updateListSuccess(list));
    });

    // ---- Item events ----
    this.socket.on('item:added', ({ listId, item, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(addItemSuccess({ listId, item }));
    });

    this.socket.on('item:updated', ({ listId, item, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(updateItemSuccess({ listId, item }));
    });

    this.socket.on('item:deleted', ({ listId, itemId, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(deleteItemSuccess({ listId, itemId }));
    });

    this.socket.on('item:checked', ({ listId, item, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(toggleItemCheckSuccess({ listId, item }));
    });

    this.socket.on('items:cleared', ({ listId, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(clearCheckedItemsSuccess(listId));
    });

    this.socket.on('items:reordered', ({ listId, items, userId }) => {
      if (this.isSelfEvent(userId)) return;
      store.dispatch(fetchItemsSuccess({ listId, items }));
    });

    // ---- Member events ----
    this.socket.on('member:added', async ({ listId, member, userId }) => {
      // If the current user was added to a new list, join the room and refresh lists
      if (member.userId === this.currentUserId) {
        this.joinList(listId);
        try {
          store.dispatch(fetchListsStart());
          const lists = await listsApi.getLists();
          store.dispatch(fetchListsSuccess(lists));
        } catch (_) {}
      }
    });

    this.socket.on('member:removed', ({ listId, removedUserId, userId }) => {
      // If the current user was removed, clean up
      if (removedUserId === this.currentUserId) {
        this.leaveList(listId);
        store.dispatch(deleteListSuccess(listId));
      }
    });

    this.socket.on('member:left', ({ listId, leftUserId }) => {
      // Another member left; no UI action needed unless viewing members
    });

    this.socket.on('member:updated', ({ listId, member, userId }) => {
      // Role update; no specific Redux action needed unless viewing members
    });
  }
}

export const socketService = new SocketService();
