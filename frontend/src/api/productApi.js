
import api from "./axios";

// Fetch products, including optional search and pagination filters.
export const getProducts = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response.data;
};

// Create a product. The backend currently expects image URLs and public IDs.
export const createProduct = async (productData) => {
  const response = await api.post("/products", productData);
  return response.data;
};

// Update an existing product.
export const updateProduct = async (productId, productData) => {
  const response = await api.put(
    `/products/${productId}`,
    productData
  );
  return response.data;
};

// Soft-delete a product by deactivating it.
export const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};
