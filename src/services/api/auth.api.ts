import apiClient, { saveTokens, clearStoredTokens } from './client';
import { ApiResponse, User, AuthTokens } from '../../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  preferredLanguage?: 'en' | 'el' | 'de';
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    const authData = response.data.data!;
    await saveTokens(authData.accessToken, authData.refreshToken);
    return authData;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const authData = response.data.data!;
    await saveTokens(authData.accessToken, authData.refreshToken);
    return authData;
  },

  // Logout user
  logout: async (): Promise<void> => {
    await clearStoredTokens();
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  // Update user profile
  updateProfile: async (data: { displayName?: string; preferredLanguage?: 'en' | 'el' | 'de' }): Promise<User> => {
    const response = await apiClient.put<ApiResponse<User>>('/auth/me', data);
    return response.data.data!;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiClient.put('/auth/me/password', { currentPassword, newPassword });
  },
};
