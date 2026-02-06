import apiClient from './client';
import { ApiResponse, ListItem } from '../../types';

export interface CreateItemData {
  name: string;
  quantity?: string;
  notes?: string;
}

export interface UpdateItemData {
  name?: string;
  quantity?: string;
  notes?: string;
}

export const itemsApi = {
  // Get all items in a list
  getItems: async (listId: string): Promise<ListItem[]> => {
    const response = await apiClient.get<ApiResponse<ListItem[]>>(`/lists/${listId}/items`);
    return response.data.data!;
  },

  // Add item to list
  addItem: async (listId: string, data: CreateItemData): Promise<ListItem> => {
    const response = await apiClient.post<ApiResponse<ListItem>>(`/lists/${listId}/items`, data);
    return response.data.data!;
  },

  // Update item
  updateItem: async (listId: string, itemId: string, data: UpdateItemData): Promise<ListItem> => {
    const response = await apiClient.put<ApiResponse<ListItem>>(`/lists/${listId}/items/${itemId}`, data);
    return response.data.data!;
  },

  // Delete item
  deleteItem: async (listId: string, itemId: string): Promise<void> => {
    await apiClient.delete(`/lists/${listId}/items/${itemId}`);
  },

  // Toggle item checked status
  toggleItemCheck: async (listId: string, itemId: string): Promise<ListItem> => {
    const response = await apiClient.patch<ApiResponse<ListItem>>(`/lists/${listId}/items/${itemId}/check`);
    return response.data.data!;
  },

  // Clear all checked items
  clearCheckedItems: async (listId: string): Promise<void> => {
    await apiClient.post(`/lists/${listId}/items/clear-checked`);
  },

  // Reorder items
  reorderItems: async (listId: string, itemOrders: { itemId: string; position: number }[]): Promise<void> => {
    await apiClient.post(`/lists/${listId}/items/reorder`, { itemOrders });
  },
};
