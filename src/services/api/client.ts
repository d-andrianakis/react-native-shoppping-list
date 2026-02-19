import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../../config/env';
import { store } from '../../store';
import { updateTokens, logout } from '../../store/slices/authSlice';
import { socketService } from '../socket';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@shopping_list:accessToken',
  REFRESH_TOKEN: '@shopping_list:refreshToken',
};

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add access token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = store.getState().auth.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = store.getState().auth.refreshToken;

        if (!refreshToken) {
          // No refresh token, logout user
          store.dispatch(logout());
          await AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
          return Promise.reject(error);
        }

        // Attempt to refresh token
        const response = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Update tokens in store and storage
        store.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }));
        await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

        // Reconnect socket with new token
        socketService.reconnectWithToken(accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        store.dispatch(logout());
        await AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions for token management
export const saveTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
};

export const getStoredTokens = async () => {
  const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  return { accessToken, refreshToken };
};

export const clearStoredTokens = async () => {
  await AsyncStorage.multiRemove([STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN]);
};

export default apiClient;
