
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyOrders } from "../api/orderApi";

function formatPrice(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "paid" || normalized === "delivered") {
    return "order-status-success";
  }

  if (
    normalized === "cancelled" ||
    normalized === "failed" ||
    normalized === "refunded"
  ) {
    return "order-status-danger";
  }

  return "order-status-pending";
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");

        const response = await getMyOrders();

        if (active) {
          setOrders(
            Array.isArray(response.orders) ? response.orders : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "We couldn't load your orders. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className="my-orders-page">
        <div className="my-orders-container">
          <p className="orders-message" role="status">
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="my-orders-page">
        <div className="my-orders-container">
          <h1>Your orders</h1>
          <p className="orders-error" role="alert">{error}</p>
          <button
            className="orders-retry-button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="my-orders-page">
      <div className="my-orders-container">
        <header className="my-orders-header">
          <div>
            <p className="checkout-eyebrow">YOUR ACCOUNT</p>
            <h1>Your orders</h1>
            <p className="my-orders-subtitle">
              Keep track of your purchases and delivery progress.
            </p>
          </div>

          <Link to="/shop" className="orders-shop-link">
            Continue shopping
          </Link>
        </header>

        <div className="orders-count">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </div>

        {orders.length === 0 ? (
          <section className="orders-empty">
            <div className="orders-empty-icon" aria-hidden="true">
              ♧
            </div>
            <h2>No orders yet</h2>
            <p>
              Your purchases will appear here once you place an order.
            </p>
            <Link to="/shop" className="checkout-primary-button">
              Explore the collection
            </Link>
          </section>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const orderItems = order.items || order.orderItems || [];
              const paymentMethod =
                order.paymentMethod?.toLowerCase() === "razorpay"
                  ? "Razorpay"
                  : order.paymentMethod?.toLowerCase() === "cod"
                    ? "Cash on Delivery"
                    : order.paymentMethod || "Not specified";

              const total =
                order.totalAmount ?? order.total ?? order.totalPrice ?? 0;

              return (
                <article className="order-card" key={order._id}>
                  <div className="order-card-header">
                    <div className="order-card-reference">
                      <span>ORDER REFERENCE</span>
                      <strong>{order._id}</strong>
                      <small>Placed on {formatDate(order.createdAt)}</small>
                    </div>

                    <span
                      className={`order-status ${getStatusClass(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus || "Pending"}
                    </span>
                  </div>

                  <div className="order-card-body">
                    <div className="order-card-items">
                      <h2>Order summary</h2>

                      {orderItems.length > 0 ? (
                        <ul>
                          {orderItems.map((item, index) => {
  const quantity = Number(item.quantity) || 1;

  const unitPrice = Number(
    item.unitPrice ??
      item.price ??
      item.product?.discountPrice ??
      item.product?.price ??
      0
  );

  const lineTotal = Number(
    item.lineTotal ??
      item.subtotal ??
      unitPrice * quantity
  );

  return (
    <li key={item._id || item.product?._id || item.product || index}>
      <span>
        {item.name ||
          item.productName ||
          item.product?.name ||
          "Product"}
        {" × "}
        {quantity}

        <small className="order-item-unit-price">
          {" "}
          ({formatPrice(unitPrice)} each)
        </small>
      </span>

      <strong>{formatPrice(lineTotal)}</strong>
    </li>
  );
})}
                        </ul>
                      ) : (
                        <p className="order-items-note">
                          Item details are unavailable for this order.
                        </p>
                      )}
                    </div>

                    <div className="order-card-payment">
                      <span>Payment method</span>
                      <strong>{paymentMethod}</strong>

                      <span>Payment status</span>
                      <strong
                        className={`order-payment-label ${getStatusClass(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus || "Pending"}
                      </strong>

                      <span>Order total</span>
                      <strong className="order-total">
                        {formatPrice(total)}
                      </strong>
                    </div>
                  </div>

                  <footer className="order-card-footer">
                    <span>
                      {order.orderStatus === "Delivered"
                        ? "Your order has been delivered."
                        : order.orderStatus === "Cancelled"
                          ? "This order has been cancelled."
                          : "Thank you for shopping with Verdant."}
                    </span>
                    <Link to={`/order-success/${order._id}`}>
                      View order
                    </Link>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
