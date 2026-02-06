-- Shopping List Database Schema
-- Run this file to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shopping lists table
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_archived BOOLEAN DEFAULT FALSE
);

-- List members (for sharing/collaboration)
CREATE TABLE list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(list_id, user_id)
);

-- Shopping list items
CREATE TABLE list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  quantity VARCHAR(50),
  notes TEXT,
  is_checked BOOLEAN DEFAULT FALSE,
  checked_at TIMESTAMP,
  checked_by UUID REFERENCES users(id),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Common items (for autocomplete/suggestions)
CREATE TABLE common_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  category VARCHAR(100),
  UNIQUE(user_id, name)
);

-- Create indexes for performance
CREATE INDEX idx_list_members_user ON list_members(user_id);
CREATE INDEX idx_list_members_list ON list_members(list_id);
CREATE INDEX idx_list_items_list ON list_items(list_id);
CREATE INDEX idx_list_items_checked ON list_items(is_checked);
CREATE INDEX idx_common_items_user ON common_items(user_id);
CREATE INDEX idx_common_items_usage ON common_items(user_id, usage_count DESC);
CREATE INDEX idx_shopping_lists_owner ON shopping_lists(owner_id);
CREATE INDEX idx_users_email ON users(email);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON shopping_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_list_items_updated_at BEFORE UPDATE ON list_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with authentication credentials';
COMMENT ON TABLE shopping_lists IS 'Shopping lists owned by users';
COMMENT ON TABLE list_members IS 'Shared access to shopping lists';
COMMENT ON TABLE list_items IS 'Items within shopping lists';
COMMENT ON TABLE common_items IS 'Frequently used items for autocomplete suggestions';

COMMENT ON COLUMN list_members.role IS 'Access role: owner, editor, or viewer';
COMMENT ON COLUMN list_items.is_checked IS 'Whether item has been checked off';
COMMENT ON COLUMN list_items.position IS 'Sort order within the list';
COMMENT ON COLUMN common_items.usage_count IS 'Number of times user has added this item';
