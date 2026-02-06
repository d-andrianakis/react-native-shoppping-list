import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ShoppingList } from '../../types';

interface ListsState {
  lists: ShoppingList[];
  selectedListId: string | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}

const initialState: ListsState = {
  lists: [],
  selectedListId: null,
  loading: false,
  error: null,
  refreshing: false,
};

const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: {
    fetchListsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchListsSuccess: (state, action: PayloadAction<ShoppingList[]>) => {
      state.lists = action.payload;
      state.loading = false;
      state.refreshing = false;
      state.error = null;
    },
    fetchListsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.refreshing = false;
      state.error = action.payload;
    },
    refreshListsStart: (state) => {
      state.refreshing = true;
    },
    createListSuccess: (state, action: PayloadAction<ShoppingList>) => {
      state.lists.unshift(action.payload);
    },
    updateListSuccess: (state, action: PayloadAction<ShoppingList>) => {
      const index = state.lists.findIndex(list => list.id === action.payload.id);
      if (index !== -1) {
        state.lists[index] = action.payload;
      }
    },
    deleteListSuccess: (state, action: PayloadAction<string>) => {
      state.lists = state.lists.filter(list => list.id !== action.payload);
      if (state.selectedListId === action.payload) {
        state.selectedListId = null;
      }
    },
    selectList: (state, action: PayloadAction<string>) => {
      state.selectedListId = action.payload;
    },
    clearListsError: (state) => {
      state.error = null;
    },
    clearLists: (state) => {
      state.lists = [];
      state.selectedListId = null;
    },
  },
});

export const {
  fetchListsStart,
  fetchListsSuccess,
  fetchListsFailure,
  refreshListsStart,
  createListSuccess,
  updateListSuccess,
  deleteListSuccess,
  selectList,
  clearListsError,
  clearLists,
} = listsSlice.actions;

export default listsSlice.reducer;
