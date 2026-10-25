
import api from "./axios";

// Fetch products, including optional search and pagination filters.
export const getProducts = async (params = {}) => {
  const response = await api.get("/products", { params });
  return response.data;
};

// Upload one image to Cloudinary through the protected backend endpoint.
export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post(
    "/uploads/product-image",
    formData
  );

  return response.data;
};

// Create a product using uploaded Cloudinary image details.
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
