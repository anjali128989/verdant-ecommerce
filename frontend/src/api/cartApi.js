import api from "./axios";

export async function getCart() {
  const response = await api.get("/cart");
  return response.data.cart;
}

export async function addToCart(productId, quantity = 1) {
  const response = await api.post("/cart", {
    productId,
    quantity,
  });

  return response.data.cart;
}

export async function updateCartItem(itemId, quantity) {
  const response = await api.put(`/cart/${itemId}`, {
    quantity,
  });

  return response.data.cart;
}

export async function removeCartItem(itemId) {
  const response = await api.delete(`/cart/${itemId}`);
  return response.data.cart;
}