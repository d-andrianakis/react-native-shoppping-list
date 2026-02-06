import { db } from '../config/database';
import { CommonItem } from '../types';

/**
 * Get autocomplete suggestions based on user's query
 */
export const getSuggestions = async (userId: string, query: string, limit: number = 5) => {
  const suggestions = await db.manyOrNone<CommonItem>(
    `SELECT name, usage_count, last_used_at
     FROM common_items
     WHERE user_id = $1 AND name ILIKE $2
     ORDER BY usage_count DESC, last_used_at DESC
     LIMIT $3`,
    [userId, `${query}%`, limit]
  );

  return suggestions.map(s => s.name);
};

/**
 * Get most commonly used items for a user
 */
export const getCommonItems = async (userId: string, limit: number = 20) => {
  const items = await db.manyOrNone<CommonItem>(
    `SELECT name, usage_count, last_used_at, category
     FROM common_items
     WHERE user_id = $1
     ORDER BY usage_count DESC, last_used_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return items;
};

/**
 * Get suggestions by category (if categories are being used)
 */
export const getSuggestionsByCategory = async (
  userId: string,
  category: string,
  limit: number = 10
) => {
  const suggestions = await db.manyOrNone<CommonItem>(
    `SELECT name, usage_count, last_used_at
     FROM common_items
     WHERE user_id = $1 AND category = $2
     ORDER BY usage_count DESC, last_used_at DESC
     LIMIT $3`,
    [userId, category, limit]
  );

  return suggestions.map(s => s.name);
};
