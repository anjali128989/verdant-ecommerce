import { useSelector } from "react-redux";

export default function Cart() {
  const { items, itemCount, subtotal } = useSelector(
    (state) => state.cart
  );

  return (
    <section className="cart-page">
      <div className="cart-container">
        <h1>Your Shopping Bag</h1>

        {items.length === 0 ? (
          <div className="empty-cart">
            <p>Your bag is currently empty.</p>
            <a href="/shop" className="continue-shopping">
              Continue Shopping
            </a>
          </div>
        ) : (
          <>
            <p>{itemCount} item(s) in your bag</p>

            {items.map((item) => (
              <article key={item._id} className="cart-item">
                <div>
                  <h2>{item.product?.name ?? "Product"}</h2>
                  <p>Quantity: {item.quantity}</p>
                  <p>
                    Price: ₹{Number(item.unitPrice ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>

                <p>
                  ₹{Number(item.lineTotal ?? 0).toLocaleString("en-IN")}
                </p>
              </article>
            ))}

            <h2>
              Subtotal: ₹{Number(subtotal).toLocaleString("en-IN")}
            </h2>
          </>
        )}
      </div>
    </section>
  );
}