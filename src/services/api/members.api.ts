import apiClient from './client';
import { ApiResponse, ListMember } from '../../types';

export const membersApi = {
  // Get all members of a list
  getMembers: async (listId: string): Promise<ListMember[]> => {
    const response = await apiClient.get<ApiResponse<ListMember[]>>(`/lists/${listId}/members`);
    return response.data.data!;
  },

  // Add member to list
  addMember: async (listId: string, email: string, role: 'editor' | 'viewer' = 'editor'): Promise<ListMember> => {
    const response = await apiClient.post<ApiResponse<ListMember>>(`/lists/${listId}/members`, { email, role });
    return response.data.data!;
  },

  // Remove member from list
  removeMember: async (listId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/lists/${listId}/members/${userId}`);
  },

  // Update member role
  updateMemberRole: async (listId: string, userId: string, role: 'editor' | 'viewer'): Promise<ListMember> => {
    const response = await apiClient.put<ApiResponse<ListMember>>(`/lists/${listId}/members/${userId}`, { role });
    return response.data.data!;
  },

  // Leave shared list
  leaveList: async (listId: string): Promise<void> => {
    await apiClient.post(`/lists/${listId}/leave`);
  },
};
