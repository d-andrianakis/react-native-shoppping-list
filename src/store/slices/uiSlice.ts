import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  language: 'en' | 'el' | 'de';
  showCheckedItems: boolean;
  theme: 'light' | 'dark';
}

const initialState: UiState = {
  language: 'en',
  showCheckedItems: false,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<'en' | 'el' | 'de'>) => {
      state.language = action.payload;
    },
    toggleShowCheckedItems: (state) => {
      state.showCheckedItems = !state.showCheckedItems;
    },
    setShowCheckedItems: (state, action: PayloadAction<boolean>) => {
      state.showCheckedItems = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
  },
});

export const {
  setLanguage,
  toggleShowCheckedItems,
  setShowCheckedItems,
  setTheme,
} = uiSlice.actions;

export default uiSlice.reducer;
