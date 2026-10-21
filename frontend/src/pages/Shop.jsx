
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import { addToCart } from "../api/cartApi";
import { setCart } from "../redux/cartSlice";

export default function Shop() {
  const dispatch = useDispatch();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All");
  const [saleOnly, setSaleOnly] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products");

        if (!ignore) {
          setProducts(response.data.products ?? []);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              "Unable to load products. Please try again."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, []);

  const categories = [
    "All",
    ...new Set(
      products.map((product) => product.category).filter(Boolean)
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const categoryMatches =
      category === "All" || product.category === category;

    const saleMatches =
      !saleOnly ||
      (product.discountPrice != null &&
        product.discountPrice < product.price);

    return categoryMatches && saleMatches;
  });

  async function handleAddToBag(product) {
    if (!product.stock || product.stock < 1) {
      toast.error("This product is currently sold out.");
      return;
    }

    try {
      setAddingId(product._id);

      const cart = await addToCart(product._id, 1);

      dispatch(setCart(cart));
      toast.success(`${product.name} added to your bag.`);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Please sign in before adding items to your bag.");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Unable to add this product. Please try again."
        );
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <section className="shop-page">
      <header className="shop-heading">
        <p className="shop-eyebrow">CURATED FOR YOUR SPACE</p>
        <h1>Shop the collection</h1>
        <p>Thoughtful details for a more intentional home.</p>
      </header>

      <div className="shop-filters">
        <label>
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="sale-filter">
          <input
            type="checkbox"
            checked={saleOnly}
            onChange={(event) => setSaleOnly(event.target.checked)}
          />
          On sale
        </label>
      </div>

      {loading ? (
        <p className="shop-message">Loading products...</p>
      ) : error ? (
        <p className="shop-message" role="alert">{error}</p>
      ) : filteredProducts.length === 0 ? (
        <p className="shop-message">No products match these filters.</p>
      ) : (
        <div className="shop-grid">
          {filteredProducts.map((product) => {
            const price = product.discountPrice ?? product.price;
            const image =
              product.images?.[0]?.url || product.image || "";

            return (
              <article className="shop-product" key={product._id}>
                <Link
                  to={`/product/${encodeURIComponent(
                    product.slug || product._id
                  )}`}
                  className="shop-product-image-link"
                  aria-label={`View ${product.name}`}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={product.name}
                      className="shop-product-image"
                      loading="lazy"
                    />
                  ) : (
                    <div className="shop-product-placeholder">
                      Image coming soon
                    </div>
                  )}
                </Link>

                <div className="shop-product-info">
                  <p className="shop-product-category">
                    {product.category}
                  </p>

                  <h2>
                    <Link
                      to={`/product/${encodeURIComponent(
                        product.slug || product._id
                      )}`}
                    >
                      {product.name}
                    </Link>
                  </h2>

                  <p className="shop-product-description">
                    {product.description}
                  </p>

                  <p className="shop-product-price">
                    ₹{Number(price).toLocaleString("en-IN")}
                    {product.discountPrice != null &&
                      product.discountPrice < product.price && (
                        <span className="shop-old-price">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </span>
                      )}
                  </p>

                  <button
                    type="button"
                    className="add-to-cart-button"
                    disabled={
                      !product.stock || product.stock < 1 ||
                      addingId === product._id
                    }
                    onClick={() => handleAddToBag(product)}
                  >
                    {!product.stock || product.stock < 1
                      ? "Sold out"
                      : addingId === product._id
                        ? "Adding..."
                        : "Add to bag"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
