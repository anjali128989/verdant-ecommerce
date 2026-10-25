import api from "./axios";

// Create the store order using the customer's cart and address.
export async function createOrder(orderData) {
  const response = await api.post("/orders", orderData);
  return response.data;
}

// Create or retrieve the Razorpay gateway order.
export async function createRazorpayOrder(orderId) {
  const response = await api.post(`/orders/${orderId}/payment`);
  return response.data;
}

// Verify the payment using the response from Razorpay Checkout.
export async function verifyRazorpayPayment(orderId, paymentDetails) {
  const response = await api.post(
    `/orders/${orderId}/verify-payment`,
    paymentDetails
  );

  return response.data;
}

// Retrieve the logged-in customer's orders.
export async function getMyOrders() {
  const response = await api.get("/orders/my-orders");
  return response.data;
}