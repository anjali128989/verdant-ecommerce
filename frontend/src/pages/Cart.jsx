
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";

import {
  getCart,
  updateCartItem,
  removeCartItem,
} from "../api/cartApi";

import { setCart, clearCart } from "../redux/cartSlice";

export default function Cart() {
  const dispatch = useDispatch();
  const { items, itemCount, subtotal } = useSelector(
    (state) => state.cart
  );
  const { user, loading: authLoading } = useSelector(
    (state) => state.auth
  );

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCart() {
      if (authLoading) return;

      if (!user) {
        dispatch(clearCart());
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const cart = await getCart();

        if (!cancelled) {
          dispatch(setCart(cart));
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err.response?.data?.message ||
            "Unable to load your bag. Please try again.";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCart();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, dispatch]);

  async function handleQuantityChange(item, nextQuantity) {
    if (nextQuantity < 1 || updatingId) return;

    const stock = item.product?.stock ?? 0;

    if (nextQuantity > stock) {
      toast.error(`Only ${stock} item(s) are currently available.`);
      return;
    }

    setUpdatingId(item._id);

    try {
      const cart = await updateCartItem(item._id, nextQuantity);
      dispatch(setCart(cart));
      toast.success("Quantity updated.");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not update quantity. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRemove(item) {
    if (removingId) return;

    setRemovingId(item._id);

    try {
      const cart = await removeCartItem(item._id);
      dispatch(setCart(cart));
      toast.success("Item removed from your bag.");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Could not remove item. Please try again."
      );
    } finally {
      setRemovingId(null);
    }
  }

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount ?? 0);

  if (authLoading || loading) {
    return (
      <section className="cart-page">
        <p className="cart-status">Loading your bag...</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="cart-page cart-empty">
        <p className="cart-eyebrow">YOUR COLLECTION</p>
        <h1>Your bag awaits.</h1>
        <p>Please sign in to view your saved bag.</p>
        <Link to="/login" className="cart-primary-button">
          Sign in
        </Link>
      </section>
    );
  }

  if (error) {
    return (
      <section className="cart-page cart-empty">
        <h1>We couldn't load your bag.</h1>
        <p>{error}</p>
        <button
          className="cart-primary-button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </section>
    );
  }

  if (!items.length) {
    return (
      <section className="cart-page cart-empty">
        <p className="cart-eyebrow">A MORE INTENTIONAL HOME</p>
        <h1>Your bag is taking a little break.</h1>
        <p>Discover considered pieces for your everyday spaces.</p>
        <Link to="/shop" className="cart-primary-button">
          Explore the collection
        </Link>
      </section>
    );
  }

  return (
    <section className="cart-page">
      <div className="cart-heading">
        <div>
          <p className="cart-eyebrow">YOUR COLLECTION</p>
          <h1>Your shopping bag</h1>
        </div>
        <p className="cart-count">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {items.map((item) => {
            const product = item.product;
            const quantityBusy =
              updatingId === item._id || Boolean(updatingId);
            const removeBusy =
              removingId === item._id || Boolean(removingId);

            return (
              <article className="cart-item" key={item._id}>
                <Link
                  to={`/product/${product?.slug}`}
                  className="cart-item-image"
                  aria-label={`View ${product?.name || "product"}`}
                >
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="cart-image-placeholder">
                      verdant
                    </div>
                  )}
                </Link>

                <div className="cart-item-info">
                  <Link
                    to={`/product/${product?.slug}`}
                    className="cart-item-name"
                  >
                    {product?.name || "Product unavailable"}
                  </Link>

                  {product?.category && (
                    <p className="cart-item-category">
                      {product.category}
                    </p>
                  )}

                  <p className="cart-item-price">
                    {formatPrice(item.unitPrice)}
                  </p>

                  <div className="cart-item-actions">
                    <div
                      className="cart-quantity"
                      aria-label="Product quantity"
                    >
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={quantityBusy || item.quantity <= 1}
                        onClick={() =>
                          handleQuantityChange(
                            item,
                            item.quantity - 1
                          )
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={
                          quantityBusy ||
                          item.quantity >= (product?.stock ?? 0)
                        }
                        onClick={() =>
                          handleQuantityChange(
                            item,
                            item.quantity + 1
                          )
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-remove-button"
                      disabled={removeBusy || Boolean(updatingId)}
                      onClick={() => handleRemove(item)}
                    >
                      {removeBusy ? "Removing..." : "Remove"}
                    </button>
                  </div>

                  {product?.stock === 0 && (
                    <p className="cart-stock-warning">
                      Currently out of stock. Remove this item to continue.
                    </p>
                  )}
                </div>

                <p className="cart-line-total">
                  {formatPrice(item.lineTotal)}
                </p>
              </article>
            );
          })}
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>

          <div className="cart-summary-row">
            <span>Items</span>
            <span>{itemCount}</span>
          </div>

          <div className="cart-summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <p className="cart-shipping-note">
            Shipping and any applicable taxes are calculated at checkout.
          </p>

          <div className="cart-summary-total">
            <span>Subtotal</span>
            <strong>{formatPrice(subtotal)}</strong>
          </div>

          <Link
            to="/shop"
            className="cart-primary-button cart-continue-button"
          >
            Continue shopping
          </Link>
        


        
          <p className="cart-secure-note">
            Thoughtfully chosen, made for everyday living.
          </p>

          <Link to="/checkout" className="checkout-primary-button">
  Proceed to checkout
</Link>
        </aside>
      </div>
    </section>
  );
}
