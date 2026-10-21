import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,

  reducers: {
    setCart(state, action) {
      const cart = action.payload;

      state.items = cart?.items ?? [];
      state.itemCount = cart?.itemCount ?? 0;
      state.subtotal = cart?.subtotal ?? 0;
      state.error = null;
    },

    setCartLoading(state, action) {
      state.loading = action.payload;
    },

    setCartError(state, action) {
      state.error = action.payload;
    },

    clearCart(state) {
      state.items = [];
      state.itemCount = 0;
      state.subtotal = 0;
      state.error = null;
    },
  },
});

export const {
  setCart,
  setCartLoading,
  setCartError,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;