
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";

import api from "../api/axios";
import { addToCart } from "../api/cartApi";
import { setCart } from "../redux/cartSlice";

export default function Shop() {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const authLoading = useSelector((state) => state.auth.loading);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [searchParams] = useSearchParams();
const requestedCategory = searchParams.get("category");
  const [saleOnly, setSaleOnly] = useState(false);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/products");
        const data = response.data.products ?? [];

        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message ||
              "We couldn't load the collection. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, []);



  useEffect(() => {
  if (!requestedCategory) {
    setCategory("All");
    return;
  }

  const matchingCategory = products.some(
    (product) => product.category === requestedCategory
  );

  setCategory(matchingCategory ? requestedCategory : "All");
}, [requestedCategory, products]);
  // Supports both the current images array and the legacy image field.
  function getProductImage(product) {
    const images = Array.isArray(product.images)
      ? product.images
      : [];

    const firstImage = images.find(
      (image) => typeof image === "string" || image?.url
    );

    if (typeof firstImage === "string") {
      return firstImage;
    }

    return firstImage?.url || product.image || "";
  }

  const categories = useMemo(() => {
    const uniqueCategories = products
      .map((product) => product.category)
      .filter(Boolean);

    return ["All", ...new Set(uniqueCategories)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        !term ||
        [
          product.name,
          product.category,
          product.description,
        ]
          .filter(Boolean)
          .some((value) =>
            value.toLowerCase().includes(term)
          );

      const matchesCategory =
        category === "All" ||
        product.category === category;

      const matchesSale =
        !saleOnly ||
        (product.discountPrice != null &&
          product.discountPrice < product.price);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSale
      );
    });

    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        break;

      case "price-low":
        result.sort(
          (a, b) =>
            (a.discountPrice ?? a.price) -
            (b.discountPrice ?? b.price)
        );
        break;

      case "price-high":
        result.sort(
          (a, b) =>
            (b.discountPrice ?? b.price) -
            (a.discountPrice ?? a.price)
        );
        break;

      default:
        break;
    }

    return result;
  }, [products, search, category, saleOnly, sortBy]);

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount ?? 0);

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setSortBy("featured");
    setSaleOnly(false);
  }

  async function handleAddToBag(product) {
    if (addingId) return;

    if (!user) {
      toast.error(
        "Please sign in before adding items to your bag."
      );
      return;
    }

    if (!product.stock || product.stock < 1) {
      toast.error("This product is currently sold out.");
      return;
    }

    setAddingId(product._id);

    try {
      const cart = await addToCart(product._id, 1);
      dispatch(setCart(cart));
      toast.success(`${product.name} added to your bag.`);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error(
          "Your session may have expired. Please sign in again."
        );
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
      <header className="shop-hero">
        <p className="shop-eyebrow">
          THE VERDANT COLLECTION
        </p>

        <h1>Considered pieces. Everyday living.</h1>

        <p>
          Discover thoughtful details that bring warmth,
          calm, and character to your home.
        </p>
      </header>

      <div className="shop-toolbar">
        <div className="shop-search-wrap">
          <label htmlFor="shop-search">
            Search collection
          </label>

          <input
            id="shop-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Try vase, planter, decor..."
          />
        </div>

        <div className="shop-sort-wrap">
          <label htmlFor="shop-sort">Sort by</label>

          <select
            id="shop-sort"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value)
            }
          >
            <option value="featured">Featured</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="price-low">
              Price: Low to High
            </option>
            <option value="price-high">
              Price: High to Low
            </option>
          </select>
        </div>
      </div>

      <div className="shop-content">
        <aside className="shop-filters">
          <div className="shop-filter-heading">
            <h2>Refine</h2>

            <button type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <fieldset className="shop-category-filter">
            <legend>Categories</legend>

            {categories.map((item) => (
              <label
                key={item}
                className="shop-category-option"
              >
                <input
                  type="radio"
                  name="product-category"
                  value={item}
                  checked={category === item}
                  onChange={() => setCategory(item)}
                />

                <span>{item}</span>
              </label>
            ))}
          </fieldset>

          <div className="shop-sale-filter">
            <label>
              <input
                type="checkbox"
                checked={saleOnly}
                onChange={(event) =>
                  setSaleOnly(event.target.checked)
                }
              />

              <span>Discounted items only</span>
            </label>
          </div>
        </aside>

        <div className="shop-results">
          <div className="shop-results-heading">
            <p>
              {loading
                ? "Loading collection..."
                : `${filteredProducts.length} ${
                    filteredProducts.length === 1
                      ? "piece"
                      : "pieces"
                  }`}
            </p>
          </div>

          {loading ? (
            <div className="shop-state">
              <p>Gathering the collection...</p>
            </div>
          ) : error ? (
            <div className="shop-state">
              <h2>Something went wrong.</h2>
              <p>{error}</p>

              <button
                type="button"
                className="shop-reset-button"
                onClick={() => window.location.reload()}
              >
                Try again
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="shop-state">
              <h2>No pieces found.</h2>
              <p>
                Try another search or adjust your filters.
              </p>

              <button
                type="button"
                className="shop-reset-button"
                onClick={resetFilters}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="shop-product-grid">
              {filteredProducts.map((product) => {
                const price =
                  product.discountPrice ?? product.price;

                const hasDiscount =
                  product.discountPrice != null &&
                  product.discountPrice < product.price;

                const imageUrl = getProductImage(product);

                return (
                  <article
                    className="shop-product-card"
                    key={product._id}
                  >
                    <Link
                      to={`/product/${product.slug}`}
                      className="shop-product-image"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";

                            const fallback =
                              event.currentTarget.parentElement
                                ?.querySelector(
                                  ".shop-image-fallback"
                                );

                            if (fallback) {
                              fallback.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}

                      <div
                        className="shop-image-fallback"
                        style={{
                          display: imageUrl ? "none" : "flex",
                        }}
                      >
                        <span>verdant</span>
                      </div>

                      {hasDiscount && (
                        <span className="shop-sale-badge">
                          On sale
                        </span>
                      )}

                      {(!product.stock ||
                        product.stock < 1) && (
                        <span className="shop-sold-out-badge">
                          Sold out
                        </span>
                      )}
                    </Link>

                    <div className="shop-product-info">
                      {product.category && (
                        <p className="shop-product-category">
                          {product.category}
                        </p>
                      )}

                      <Link
                        to={`/product/${product.slug}`}
                        className="shop-product-name"
                      >
                        {product.name}
                      </Link>

                      <div className="shop-product-price">
                        <span>{formatPrice(price)}</span>

                        {hasDiscount && (
                          <span className="shop-original-price">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="shop-add-button"
                        disabled={
                          !product.stock ||
                          product.stock < 1 ||
                          addingId === product._id ||
                          authLoading
                        }
                        onClick={() =>
                          handleAddToBag(product)
                        }
                      >
                        {!product.stock ||
                        product.stock < 1
                          ? "Sold out"
                          : addingId === product._id
                            ? "Adding..."
                            : authLoading
                              ? "Loading..."
                              : "Add to bag"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
