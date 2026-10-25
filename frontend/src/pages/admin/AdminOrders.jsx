
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import "./AdminOrders.css";

const STATUSES = ["Pending", "Processing", "Shipped", "Delivered"];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [notice, setNotice] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/orders/admin/all");
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load orders. Check your admin login and API connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(order, orderStatus) {
    const orderId = order._id;

    if (!orderId) {
      setError("This order is missing its database ID. Refresh the page.");
      return;
    }

    if (
      order.paymentMethod === "razorpay" &&
      order.paymentStatus !== "paid" &&
      ["Processing", "Shipped", "Delivered"].includes(orderStatus)
    ) {
      setError(
        `Order #${orderId.slice(-8).toUpperCase()} cannot be fulfilled because its Razorpay payment is not completed.`
      );
      return;
    }

    setUpdatingId(orderId);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/orders/${orderId}/status`,
        { orderStatus }
      );

      setNotice(
        response.data?.message || "Order status updated successfully."
      );

      await loadOrders();
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to update order status.";

      setError(
        `${message} (Order #${orderId.slice(-8).toUpperCase()})`
      );

      // Restore the dropdown to the status saved in the database.
      await loadOrders();
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="admin-orders-page">
      <header className="admin-orders-header">
        <div>
          <p className="admin-orders-eyebrow">
            VERDANT / ADMINISTRATION
          </p>
          <h1>Order Management</h1>
          <p>Review purchases and manage order progress.</p>
        </div>

        <Link className="admin-orders-back" to="/admin">
          ← Dashboard
        </Link>
      </header>

      <section className="admin-orders-summary">
        <div>
          <span>Total orders</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>Pending</span>
          <strong>
            {orders.filter(
              (order) => order.orderStatus === "Pending"
            ).length}
          </strong>
        </div>
        <div>
          <span>Shipped</span>
          <strong>
            {orders.filter(
              (order) => order.orderStatus === "Shipped"
            ).length}
          </strong>
        </div>
      </section>

      {error && (
        <div className="admin-orders-alert error" role="alert">
          {error}
          <button type="button" onClick={loadOrders}>
            Retry
          </button>
        </div>
      )}

      {notice && (
        <div className="admin-orders-alert success" role="status">
          {notice}
        </div>
      )}

      <section className="admin-orders-panel">
        <div className="admin-orders-panel-header">
          <div>
            <h2>All orders</h2>
            <p>Order details and fulfilment status</p>
          </div>

          <button
            type="button"
            className="admin-orders-refresh"
            onClick={loadOrders}
            disabled={loading || Boolean(updatingId)}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p className="admin-orders-empty" role="status">
            Loading orders…
          </p>
        ) : orders.length === 0 && !error ? (
          <p className="admin-orders-empty">
            No orders found yet.
          </p>
        ) : (
          <div className="admin-orders-table-wrap">
            <table className="admin-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Update status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const orderId = order._id;
                  const currentStatus = order.orderStatus || "Pending";
                  const isUpdating = updatingId === orderId;

                  const canUpdate = ![
                    "Delivered",
                    "Cancelled",
                  ].includes(currentStatus);

                  const unpaidRazorpay =
                    order.paymentMethod === "razorpay" &&
                    order.paymentStatus !== "paid";

                  const customer =
                    typeof order.user === "object" && order.user
                      ? order.user.name ||
                        order.user.email ||
                        "Customer"
                      : "Customer";

                  return (
                    <tr key={orderId}>
                      <td data-label="Order">
                        <strong>
                          #{orderId.slice(-8).toUpperCase()}
                        </strong>
                        <small>
                          {order.createdAt
                            ? new Date(
                                order.createdAt
                              ).toLocaleDateString()
                            : "Date unavailable"}
                        </small>
                      </td>

                      <td data-label="Customer">{customer}</td>

                      <td data-label="Total">
                        ₹
                        {Number(order.total ?? 0).toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td data-label="Payment">
                        <span className="admin-order-payment">
                          {order.paymentStatus || "Pending"}
                        </span>
                        <small>
                          {order.paymentMethod || "Not specified"}
                        </small>
                      </td>

                      <td data-label="Status">
                        <span
                          className={`admin-order-status status-${currentStatus
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {currentStatus}
                        </span>
                      </td>

                      <td data-label="Update status">
                        {canUpdate ? (
                          <select
                            aria-label={`Update order #${orderId.slice(-8).toUpperCase()} status`}
                            value={currentStatus}
                            disabled={isUpdating}
                            onChange={(event) =>
                              updateStatus(order, event.target.value)
                            }
                          >
                            {STATUSES.map((status) => {
                              const isFulfilmentStatus = [
                                "Processing",
                                "Shipped",
                                "Delivered",
                              ].includes(status);

                              return (
                                <option
                                  key={status}
                                  value={status}
                                  disabled={
                                    STATUSES.indexOf(status) <
                                      STATUSES.indexOf(currentStatus) ||
                                    (unpaidRazorpay &&
                                      isFulfilmentStatus)
                                  }
                                >
                                  {status}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <span className="admin-order-final">
                            {currentStatus}
                          </span>
                        )}

                        {isUpdating && <small>Saving…</small>}

                        {unpaidRazorpay && canUpdate && (
                          <small>
                            Complete Razorpay payment before fulfilment.
                          </small>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
