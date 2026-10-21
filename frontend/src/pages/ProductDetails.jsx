import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadProduct() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/products/${encodeURIComponent(slug)}`
        );

        const data = response.data;
        const foundProduct = data.product ?? data;

        if (!ignore) setProduct(foundProduct);
      } catch (err) {
        if (!ignore) {
          setError(
            err.response?.data?.message ||
              "Unable to load this product. Please try again."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      ignore = true;
    };
  }, [slug]);

  if (loading) {
    return <section className="product-details-page">Loading product...</section>;
  }

  if (error || !product) {
    return (
      <section className="product-details-page">
        <h1>Product unavailable</h1>
        <p>{error || "We couldn't find this product."}</p>
        <Link to="/shop">Return to shop</Link>
      </section>
    );
  }

  const price = product.discountPrice ?? product.price;
  const image =
    product.images?.[0]?.url || product.image || "";

  return (
    <section className="product-details-page">
      <Link to="/shop" className="back-to-shop">
        ← Back to shop
      </Link>

      <div className="product-details-grid">
        {image ? (
          <img
            className="product-details-image"
            src={image}
            alt={product.name}
          />
        ) : (
          <div className="product-details-image product-image-placeholder">
            Image coming soon
          </div>
        )}

        <div className="product-details-info">
          <p className="product-details-category">
            {product.category}
          </p>
          <h1>{product.name}</h1>
          <p className="product-details-price">
            ₹{Number(price).toLocaleString("en-IN")}
          </p>
          <p>{product.description}</p>
          <p>
            {product.stock > 0
              ? `${product.stock} available`
              : "Currently sold out"}
          </p>
        </div>
      </div>
    </section>
  );
}