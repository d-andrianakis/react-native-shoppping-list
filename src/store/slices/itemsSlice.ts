import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ListItem } from '../../types';

interface ItemsState {
  itemsByListId: { [listId: string]: ListItem[] };
  loading: boolean;
  error: string | null;
  suggestions: string[];
  loadingSuggestions: boolean;
}

const initialState: ItemsState = {
  itemsByListId: {},
  loading: false,
  error: null,
  suggestions: [],
  loadingSuggestions: false,
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    fetchItemsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchItemsSuccess: (state, action: PayloadAction<{ listId: string; items: ListItem[] }>) => {
      state.itemsByListId[action.payload.listId] = action.payload.items;
      state.loading = false;
      state.error = null;
    },
    fetchItemsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addItemSuccess: (state, action: PayloadAction<{ listId: string; item: ListItem }>) => {
      const { listId, item } = action.payload;
      if (!state.itemsByListId[listId]) {
        state.itemsByListId[listId] = [];
      }
      state.itemsByListId[listId].push(item);
    },
    updateItemSuccess: (state, action: PayloadAction<{ listId: string; item: ListItem }>) => {
      const { listId, item } = action.payload;
      if (state.itemsByListId[listId]) {
        const index = state.itemsByListId[listId].findIndex(i => i.id === item.id);
        if (index !== -1) {
          state.itemsByListId[listId][index] = item;
        }
      }
    },
    deleteItemSuccess: (state, action: PayloadAction<{ listId: string; itemId: string }>) => {
      const { listId, itemId } = action.payload;
      if (state.itemsByListId[listId]) {
        state.itemsByListId[listId] = state.itemsByListId[listId].filter(
          item => item.id !== itemId
        );
      }
    },
    toggleItemCheckSuccess: (state, action: PayloadAction<{ listId: string; item: ListItem }>) => {
      const { listId, item } = action.payload;
      if (state.itemsByListId[listId]) {
        const index = state.itemsByListId[listId].findIndex(i => i.id === item.id);
        if (index !== -1) {
          state.itemsByListId[listId][index] = item;
        }
      }
    },
    clearCheckedItemsSuccess: (state, action: PayloadAction<string>) => {
      const listId = action.payload;
      if (state.itemsByListId[listId]) {
        state.itemsByListId[listId] = state.itemsByListId[listId].filter(
          item => !item.is_checked
        );
      }
    },
    fetchSuggestionsStart: (state) => {
      state.loadingSuggestions = true;
    },
    fetchSuggestionsSuccess: (state, action: PayloadAction<string[]>) => {
      state.suggestions = action.payload;
      state.loadingSuggestions = false;
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
    },
    clearItemsError: (state) => {
      state.error = null;
    },
    clearItems: (state) => {
      state.itemsByListId = {};
    },
  },
});

export const {
  fetchItemsStart,
  fetchItemsSuccess,
  fetchItemsFailure,
  addItemSuccess,
  updateItemSuccess,
  deleteItemSuccess,
  toggleItemCheckSuccess,
  clearCheckedItemsSuccess,
  fetchSuggestionsStart,
  fetchSuggestionsSuccess,
  clearSuggestions,
  clearItemsError,
  clearItems,
} = itemsSlice.actions;

export default itemsSlice.reducer;
