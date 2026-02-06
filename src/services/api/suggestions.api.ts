import apiClient from './client';
import { ApiResponse } from '../../types';

export const suggestionsApi = {
  // Get autocomplete suggestions
  getSuggestions: async (query: string, limit: number = 5): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/suggestions', {
      params: { q: query, limit },
    });
    return response.data.data!;
  },

  // Get most commonly used items
  getCommonItems: async (limit: number = 20): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>('/suggestions/common', {
      params: { limit },
    });
    return response.data.data!;
  },

  // Get suggestions by category
  getSuggestionsByCategory: async (category: string, limit: number = 10): Promise<string[]> => {
    const response = await apiClient.get<ApiResponse<string[]>>(`/suggestions/category/${category}`, {
      params: { limit },
    });
    return response.data.data!;
  },
};
