import apiClient from './client';
import { ApiResponse, ShoppingList } from '../../types';

export const listsApi = {
  // Get all lists for user
  getLists: async (): Promise<ShoppingList[]> => {
    const response = await apiClient.get<ApiResponse<ShoppingList[]>>('/lists');
    return response.data.data!;
  },

  // Get specific list by ID
  getListById: async (listId: string): Promise<ShoppingList> => {
    const response = await apiClient.get<ApiResponse<ShoppingList>>(`/lists/${listId}`);
    return response.data.data!;
  },

  // Create new list
  createList: async (name: string): Promise<ShoppingList> => {
    const response = await apiClient.post<ApiResponse<ShoppingList>>('/lists', { name });
    return response.data.data!;
  },

  // Update list
  updateList: async (listId: string, updates: { name?: string; isArchived?: boolean }): Promise<ShoppingList> => {
    const response = await apiClient.put<ApiResponse<ShoppingList>>(`/lists/${listId}`, updates);
    return response.data.data!;
  },

  // Delete list
  deleteList: async (listId: string): Promise<void> => {
    await apiClient.delete(`/lists/${listId}`);
  },

  // Archive/unarchive list
  archiveList: async (listId: string, archive: boolean): Promise<ShoppingList> => {
    const response = await apiClient.patch<ApiResponse<ShoppingList>>(`/lists/${listId}/archive`, { archive });
    return response.data.data!;
  },
};
