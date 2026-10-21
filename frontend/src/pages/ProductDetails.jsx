
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";

import api from "../api/axios";
import { addToCart } from "../api/cartApi";
import { setCart } from "../redux/cartSlice";

export default function ProductDetails() {
  const { slug } = useParams();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setQuantity(1);

      try {
        const response = await api.get("/products");
        const products = response.data.products ?? [];
        const found = products.find((item) => item.slug === slug);

        if (cancelled) return;

        if (!found) {
          setError("We couldn't find this product.");
          return;
        }

        setProduct(found);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "Unable to load this product. Please try again."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount ?? 0);

  const price = product
    ? product.discountPrice ?? product.price
    : 0;

  const hasDiscount =
    product?.discountPrice != null &&
    product.discountPrice < product.price;

  const stock = product?.stock ?? 0;
  const isAvailable = stock > 0;

  async function handleAddToBag() {
    if (!product || adding) return;

    if (!user) {
      toast.error("Please sign in to add items to your bag.");
      return;
    }

    if (quantity < 1 || quantity > stock) {
      toast.error("Please select an available quantity.");
      return;
    }

    setAdding(true);

    try {
      const cart = await addToCart(product._id, quantity);
      dispatch(setCart(cart));
      toast.success(`${product.name} added to your bag.`);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Your session may have expired. Please sign in again.");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Unable to add this product. Please try again."
        );
      }
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <section className="product-details-state">
        <p>Discovering something lovely...</p>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="product-details-state">
        <p className="product-eyebrow">VERDANT COLLECTION</p>
        <h1>Something is missing.</h1>
        <p>{error || "This product is unavailable."}</p>
        <Link to="/shop" className="product-back-link">
          Return to the shop
        </Link>
      </section>
    );
  }

  return (
    <section className="product-details-page">
      <nav className="product-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="product-details-grid">
        <div className="product-gallery">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="product-main-image"
            />
          ) : (
            <div className="product-image-fallback">
              <span>verdant</span>
              <p>Considered pieces for everyday living.</p>
            </div>
          )}
        </div>

        <div className="product-information">
          <p className="product-eyebrow">
            {product.category || "THE VERDANT COLLECTION"}
          </p>

          <h1>{product.name}</h1>

          <div className="product-price-row">
            <span className="product-current-price">
              {formatPrice(price)}
            </span>

            {hasDiscount && (
              <>
                <span className="product-original-price">
                  {formatPrice(product.price)}
                </span>
                <span className="product-discount">
                  Save{" "}
                  {Math.round(
                    ((product.price - price) / product.price) * 100
                  )}
                  %
                </span>
              </>
            )}
          </div>

          {product.description && (
            <p className="product-description">
              {product.description}
            </p>
          )}

          <div className="product-stock">
            <span
              className={`product-stock-dot ${
                isAvailable ? "is-available" : "is-unavailable"
              }`}
            />
            {isAvailable
              ? `${stock} available`
              : "Currently out of stock"}
          </div>

          {isAvailable && (
            <div className="product-purchase-controls">
              <label htmlFor="product-quantity">Quantity</label>

              <div className="product-quantity-control">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1 || adding}
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                >
                  −
                </button>

                <span>{quantity}</span>

                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= stock || adding}
                  onClick={() =>
                    setQuantity((current) =>
                      Math.min(stock, current + 1)
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="product-add-button"
            disabled={!isAvailable || adding || authLoading}
            onClick={handleAddToBag}
          >
            {!isAvailable
              ? "Currently unavailable"
              : adding
                ? "Adding to bag..."
                : authLoading
                  ? "Checking your session..."
                  : "Add to bag"}
          </button>

          {!user && !authLoading && (
            <p className="product-login-note">
              Already have an account?{" "}
              <Link to="/login">Sign in</Link> to add items to your bag.
            </p>
          )}

          <div className="product-details-note">
            <p>Thoughtfully chosen for your home.</p>
            <p>Prices and stock availability are subject to change.</p>
          </div>
        </div>
      </div>

      <div className="product-continue-shopping">
        <Link to="/shop">← Continue exploring the collection</Link>
      </div>
    </section>
  );
}
