// Type definitions for the backend

export interface User {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
  preferred_language: 'en' | 'el' | 'de';
  created_at: Date;
  updated_at: Date;
}

export interface ShoppingList {
  id: string;
  name: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
}

export interface ListMember {
  id: string;
  list_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  joined_at: Date;
}

export interface ListItem {
  id: string;
  list_id: string;
  name: string;
  quantity: string | null;
  notes: string | null;
  is_checked: boolean;
  checked_at: Date | null;
  checked_by: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface CommonItem {
  id: string;
  user_id: string;
  name: string;
  usage_count: number;
  last_used_at: Date;
  category: string | null;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Express.Request {
  user?: TokenPayload;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  page: number;
  pageSize: number;
  total: number;
}
