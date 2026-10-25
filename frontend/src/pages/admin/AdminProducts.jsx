
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
   uploadProductImage,
} from "../../api/productApi";
import "./AdminProducts.css";

const categories = [
  "Vases & Planters",
  "Cushions & Throws",
  "Lighting",
  "Wall Decor",
  "Table Decor",
];

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  discountPrice: "",
  category: categories[0],
  brand: "Botanical Home",
  stock: "0",
  featured: false,
  images: [{ url: "", public_id: "" }],
};

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    "Something went wrong."
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadProducts = useCallback(async (page = 1, term = search) => {
    setLoading(true);

    try {
      const data = await getProducts({
        page,
        limit: 12,
        search: term.trim() || undefined,
        sort: "newest",
      });

      setProducts(data.products || []);
      setPagination(
        data.pagination || {
          currentPage: page,
          totalPages: 1,
          totalProducts: data.count || 0,
        }
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadProducts(1, "");
  }, [loadProducts]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(product) {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      discountPrice:
        product.discountPrice == null
          ? ""
          : String(product.discountPrice),
      category: product.category || categories[0],
      brand: product.brand || "Botanical Home",
      stock: String(product.stock ?? 0),
      featured: Boolean(product.featured),
      images:
        product.images?.length > 0
          ? product.images.map((image) => ({
              url: image.url || "",
              public_id: image.public_id || "",
            }))
          : [{ url: "", public_id: "" }],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateImage(index, field, value) {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index
          ? { ...image, [field]: value }
          : image
      ),
    }));
  }

  function addImageField() {
    if (form.images.length >= 8) {
      toast.error("A product can have at most 8 images.");
      return;
    }

    setForm((current) => ({
      ...current,
      images: [...current.images, { url: "", public_id: "" }],
    }));
  }

  function removeImageField(index) {
    if (form.images.length === 1) {
      toast.error("At least one product image is required.");
      return;
    }

    setForm((current) => ({
      ...current,
      images: current.images.filter((_, i) => i !== index),
    }));
  }



async function handleImageUpload(event, index) {
  const file = event.target.files?.[0];

  // Allow the same file to be selected again after an error.
  event.target.value = "";

  if (!file) return;

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    toast.error("Choose a JPG, PNG, or WebP image.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    toast.error("The image must be 5 MB or smaller.");
    return;
  }

  setUploadingImage(true);

  try {
    const data = await uploadProductImage(file);

    if (!data.success || !data.image?.url || !data.image?.public_id) {
      throw new Error("The server did not return valid image details.");
    }

    updateImage(index, "url", data.image.url);
    updateImage(index, "public_id", data.image.public_id);

    toast.success("Image uploaded successfully.");
  } catch (error) {
    toast.error(getErrorMessage(error));
  } finally {
    setUploadingImage(false);
  }
}



  async function handleSubmit(event) {
    event.preventDefault();

    const price = Number(form.price);
    const discountPrice =
      form.discountPrice.trim() === ""
        ? null
        : Number(form.discountPrice);
    const stock = Number(form.stock);

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a valid price greater than zero.");
      return;
    }

    if (
      discountPrice !== null &&
      (!Number.isFinite(discountPrice) ||
        discountPrice <= 0 ||
        discountPrice >= price)
    ) {
      toast.error("Discount price must be positive and lower than price.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      toast.error("Stock must be a non-negative whole number.");
      return;
    }

    const images = form.images.map((image) => ({
      url: image.url.trim(),
      public_id: image.public_id.trim(),
    }));

    if (
      images.some((image) => !image.url || !image.public_id)
    ) {
      toast.error("Every image needs a URL and a Cloudinary public ID.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim().toLowerCase(),
      description: form.description.trim(),
      price,
      discountPrice,
      category: form.category,
      brand: form.brand.trim() || "Botanical Home",
      stock,
      featured: form.featured,
      images,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success("Product updated successfully.");
      } else {
        await createProduct(payload);
        toast.success("Product created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadProducts(1, search);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Deactivate "${product.name}"? It will no longer appear in the shop.`
    );

    if (!confirmed) return;

    try {
      await deleteProduct(product._id);
      toast.success("Product deactivated.");

      const nextPage =
        products.length === 1 && pagination.currentPage > 1
          ? pagination.currentPage - 1
          : pagination.currentPage;

      await loadProducts(nextPage, search);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  function handleSearch(event) {
    event.preventDefault();
    loadProducts(1, search);
  }

  return (
    <section className="admin-products-page">
      <header className="admin-products-header">
        <div>
          <p className="admin-products-eyebrow">STORE MANAGEMENT</p>
          <h1>Products</h1>
          <p className="admin-products-description">
            Manage your botanical home decor collection.
          </p>
        </div>

        <button
          type="button"
          className="admin-products-primary"
          onClick={startCreate}
        >
          + Add product
        </button>
      </header>

      <div className="admin-products-summary">
        <span>Total active products</span>
        <strong>{pagination.totalProducts}</strong>
      </div>

      {showForm && (
        <form className="admin-product-form" onSubmit={handleSubmit}>
          <div className="admin-product-form-heading">
            <div>
              <p className="admin-products-eyebrow">
                {editingId ? "UPDATE COLLECTION" : "NEW COLLECTION ITEM"}
              </p>
              <h2>{editingId ? "Edit product" : "Add product"}</h2>
            </div>

            <button
              type="button"
              className="admin-products-secondary"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>

          <div className="admin-product-form-grid">
            <label>
              Product name *
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                minLength={2}
                maxLength={120}
                required
              />
            </label>

            <label>
              Product slug *
              <input
                name="slug"
                value={form.slug}
                onChange={updateField}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder="eucalyptus-ceramic-vase"
                maxLength={150}
                required
              />
            </label>

            <label>
              Price (₹) *
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={updateField}
                min="0.01"
                step="0.01"
                required
              />
            </label>

            <label>
              Discount price (₹)
              <input
                name="discountPrice"
                type="number"
                value={form.discountPrice}
                onChange={updateField}
                min="0.01"
                step="0.01"
              />
            </label>

            <label>
              Category *
              <select
                name="category"
                value={form.category}
                onChange={updateField}
                required
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Brand
              <input
                name="brand"
                value={form.brand}
                onChange={updateField}
                maxLength={80}
              />
            </label>

            <label>
              Stock quantity *
              <input
                name="stock"
                type="number"
                value={form.stock}
                onChange={updateField}
                min="0"
                step="1"
                required
              />
            </label>

            <label className="admin-product-checkbox">
              <input
                name="featured"
                type="checkbox"
                checked={form.featured}
                onChange={updateField}
              />
              Feature this product on the store
            </label>

            <label className="admin-product-full">
              Description *
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                minLength={10}
                maxLength={5000}
                rows={5}
                required
              />
            </label>
          </div>        
<div className="admin-product-images-heading">
  <div>
    <h3>Product images</h3>
    <p>
      Select JPG, PNG, or WebP images up to 5 MB each.
      Images are uploaded securely to Cloudinary.
    </p>
  </div>

  <button
    type="button"
    className="admin-products-secondary"
    onClick={addImageField}
    disabled={uploadingImage || saving || form.images.length >= 8}
  >
    + Add image
  </button>
</div>

{form.images.map((image, index) => (
  <div className="admin-product-image-row" key={index}>
    <div className="admin-product-upload-control">
      <label htmlFor={`product-image-${index}`}>
        Image {index + 1} *
      </label>

      <input
        id={`product-image-${index}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => handleImageUpload(event, index)}
        disabled={uploadingImage || saving}
        required={!image.url || !image.public_id}
      />

      {uploadingImage && (
        <p role="status">Uploading image...</p>
      )}

      {image.url && image.public_id && (
        <div className="admin-product-upload-preview">
          <img
            src={image.url}
            alt={`Preview of product image ${index + 1}`}
          />

          <div>
            <p>Upload complete</p>
            <small>{image.public_id}</small>
          </div>
        </div>
      )}
    </div>

    <button
      type="button"
      className="admin-products-danger-outline"
      onClick={() => removeImageField(index)}
      disabled={uploadingImage || saving || form.images.length === 1}
      aria-label={`Remove image ${index + 1}`}
    >
      Remove
    </button>
  </div>
))}


          {form.images.map((image, index) => (
            <div className="admin-product-image-row" key={index}>
              <label>
                Image URL *
                <input
                  type="url"
                  value={image.url}
                  onChange={(event) =>
                    updateImage(index, "url", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Cloudinary public ID *
                <input
                  value={image.public_id}
                  onChange={(event) =>
                    updateImage(index, "public_id", event.target.value)
                  }
                  required
                />
              </label>

              <button
                type="button"
                className="admin-products-danger-outline"
                onClick={() => removeImageField(index)}
                aria-label={`Remove image ${index + 1}`}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="submit"
            className="admin-products-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Save changes"
                : "Create product"}
          </button>
        </form>
      )}

      <form className="admin-products-search" onSubmit={handleSearch}>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />
        <button type="submit" className="admin-products-primary">
          Search
        </button>
      </form>

      <div className="admin-products-table-wrap">
        {loading ? (
          <p className="admin-products-message" role="status">
            Loading products...
          </p>
        ) : products.length === 0 ? (
          <p className="admin-products-message">
            No products found. Try another search or add a product.
          </p>
        ) : (
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="admin-product-table-item">
                      {product.images?.[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <div className="admin-product-image-placeholder">
                          No image
                        </div>
                      )}

                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.slug}</small>
                      </div>
                    </div>
                  </td>
                  <td>{product.category}</td>
                  <td>
                    ₹{Number(product.discountPrice ?? product.price).toLocaleString("en-IN")}
                    {product.discountPrice != null && (
                      <small className="admin-product-old-price">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                      </small>
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        product.stock > 0
                          ? "admin-product-stock"
                          : "admin-product-stock admin-product-stock-empty"
                      }
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td>{product.featured ? "Yes" : "No"}</td>
                  <td>
                    <div className="admin-product-actions">
                      <button
                        type="button"
                        className="admin-products-secondary"
                        onClick={() => startEdit(product)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="admin-products-danger"
                        onClick={() => handleDelete(product)}
                      >
                        Deactivate
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-products-pagination">
        <button
          type="button"
          className="admin-products-secondary"
          disabled={loading || pagination.currentPage <= 1}
          onClick={() => loadProducts(pagination.currentPage - 1)}
        >
          Previous
        </button>

        <span>
          Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
        </span>

        <button
          type="button"
          className="admin-products-secondary"
          disabled={
            loading ||
            pagination.currentPage >= pagination.totalPages
          }
          onClick={() => loadProducts(pagination.currentPage + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
