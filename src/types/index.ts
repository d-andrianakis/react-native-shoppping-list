// Type definitions for the mobile app

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  preferredLanguage: 'en' | 'el' | 'de';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  user_role: 'owner' | 'editor' | 'viewer';
  active_items_count: number;
  total_items_count: number;
  member_count?: number;
}

export interface ListItem {
  id: string;
  list_id: string;
  name: string;
  quantity: string | null;
  notes: string | null;
  is_checked: boolean;
  checked_at: string | null;
  checked_by: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ListMember {
  user_id: string;
  email: string;
  display_name: string | null;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainStackParamList = {
  Lists: undefined;
  ListDetail: { listId: string; listName: string };
  Settings: undefined;
  ShareList: { listId: string };
};
