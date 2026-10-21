
import api from "./axios";

export async function createOrder(orderData) {
  const response = await api.post("/orders", orderData);
  return response.data;
}

export async function getMyOrders() {
  const response = await api.get("/orders/my-orders");
  return response.data;
}
