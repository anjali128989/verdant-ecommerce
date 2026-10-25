
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const categories = [
  {
    name: "Vases & Planters",
    description: "Natural forms, considered details.",
    search: "Vases & Planters",
    className: "home-category-vases",
  },
  {
    name: "Home Decor",
    description: "Little details that make a space yours.",
    search: "Home Decor",
    className: "home-category-decor",
  },
  {
    name: "Living Essentials",
    description: "Everyday pieces, thoughtfully chosen.",
    search: "Living Essentials",
    className: "home-category-living",
  },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFeaturedProducts() {
      try {
        const response = await api.get("/products");
        const allProducts = response.data.products ?? [];

        if (!cancelled) {
          const featuredProducts = allProducts.filter(
            (product) => product.featured === true
          );

          const otherProducts = allProducts.filter(
            (product) => product.featured !== true
          );

          // Featured products appear first; fill remaining slots
          // with other products when fewer than four are featured.
          setProducts(
            [...featuredProducts, ...otherProducts].slice(0, 4)
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load home products:", error);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFeaturedProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  // Supports images stored as objects or strings, plus legacy product.image.
  function getProductImage(product) {
    const images = Array.isArray(product.images)
      ? product.images
      : [];

    const firstImage = images.find(
      (image) =>
        (typeof image === "string" && image.trim()) ||
        (typeof image?.url === "string" && image.url.trim())
    );

    if (typeof firstImage === "string") {
      return firstImage;
    }

    return firstImage?.url || product.image || "";
  }

  const formatPrice = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount ?? 0);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-eyebrow">
            A SLOWER, MORE THOUGHTFUL WAY OF LIVING
          </p>

          <h1>
            Make room
            <br />
            for <em>the natural.</em>
          </h1>

          <p className="home-hero-description">
            Considered objects, quiet colours, and meaningful details
            for a home that feels like you.
          </p>

          <div className="home-hero-actions">
            <Link to="/shop" className="home-primary-button">
              Explore the collection{" "}
              <span aria-hidden="true">↗</span>
            </Link>

            <a href="#home-story" className="home-text-link">
              Our philosophy
            </a>
          </div>

          <div className="home-hero-caption">
            <span className="home-caption-line" />
            <span>
              Thoughtfully curated for everyday living
            </span>
          </div>
        </div>

        <div className="home-hero-art" aria-hidden="true">
          <div className="home-art-orbit home-art-orbit-one" />
          <div className="home-art-orbit home-art-orbit-two" />
          <div className="home-art-sun" />
          <div className="home-art-leaf home-art-leaf-one" />
          <div className="home-art-leaf home-art-leaf-two" />
          <div className="home-art-leaf home-art-leaf-three" />
          <div className="home-art-stem" />

          <div className="home-art-vase">
            <div className="home-art-vase-neck" />
            <div className="home-art-vase-body" />
          </div>

          <span className="home-art-label">NATURALLY YOURS</span>
          <span className="home-art-number">01 / 03</span>
        </div>
      </section>

      <section className="home-values" aria-label="Our values">
        <div>
          <span className="home-value-symbol">✳</span>
          <p>Thoughtful design</p>
        </div>

        <span className="home-value-divider" />

        <div>
          <span className="home-value-symbol">⌁</span>
          <p>Nature-inspired living</p>
        </div>

        <span className="home-value-divider" />

        <div>
          <span className="home-value-symbol">○</span>
          <p>Everyday essentials</p>
        </div>
      </section>

      <section className="home-categories">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">FIND YOUR FAVOURITES</p>
            <h2>Made for your kind of home.</h2>
          </div>

          <Link to="/shop" className="home-section-link">
            Shop everything <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="home-category-grid">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              to={`/shop?category=${encodeURIComponent(category.search)}`}
              className={`home-category-card ${category.className}`}
            >
              <div className="home-category-art" aria-hidden="true">
                <span className="home-category-number">
                  0{index + 1}
                </span>

                <div className="home-category-shape" />

                <span className="home-category-art-name">
                  verdant
                </span>
              </div>

              <div className="home-category-info">
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                </div>

                <span
                  className="home-category-arrow"
                  aria-hidden="true"
                >
                  ↗
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-featured">
        <div className="home-section-heading">
          <div>
            <p className="home-eyebrow">THE CONSIDERED EDIT</p>
            <h2>Pieces to live with.</h2>

            <p className="home-section-description">
              Discover favourites selected to bring a little more
              intention to your everyday spaces.
            </p>
          </div>

          <Link to="/shop" className="home-section-link">
            View all products <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="home-featured-state">
            Preparing your collection...
          </div>
        ) : loadError ? (
          <div className="home-featured-state">
            <p>Our collection couldn't load right now.</p>

            <Link to="/shop" className="home-text-link">
              Explore the shop instead →
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div className="home-featured-state">
            <p>Our next collection is taking shape.</p>

            <Link to="/shop" className="home-text-link">
              Visit the shop →
            </Link>
          </div>
        ) : (
          <div className="home-featured-grid">
            {products.map((product) => {
              const price =
                product.discountPrice ?? product.price;

              const discounted =
                product.discountPrice != null &&
                product.discountPrice < product.price;

              const imageUrl = getProductImage(product);

              return (
                <article
                  className="home-featured-card"
                  key={product._id}
                >
                  <Link
                    to={`/product/${product.slug}`}
                    className="home-featured-image"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";

                          const fallback =
                            event.currentTarget.parentElement?.querySelector(
                              ".home-featured-placeholder"
                            );

                          if (fallback) {
                            fallback.style.display = "flex";
                          }
                        }}
                      />
                    ) : null}

                    <div
                      className="home-featured-placeholder"
                      style={{
                        display: imageUrl ? "none" : "flex",
                      }}
                    >
                      <span>verdant</span>
                    </div>

                    {discounted && (
                      <span className="home-featured-badge">
                        Considered price
                      </span>
                    )}
                  </Link>

                  <div className="home-featured-info">
                    <div>
                      <p>{product.category || "The collection"}</p>

                      <Link to={`/product/${product.slug}`}>
                        {product.name}
                      </Link>
                    </div>

                    <div className="home-featured-prices">
                      <span>{formatPrice(price)}</span>

                      {discounted && (
                        <span className="home-featured-old-price">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="home-story" id="home-story">
        <div className="home-story-art" aria-hidden="true">
          <div className="home-story-circle" />
          <div className="home-story-leaf home-story-leaf-one" />
          <div className="home-story-leaf home-story-leaf-two" />
          <div className="home-story-leaf home-story-leaf-three" />
          <div className="home-story-stem" />
        </div>

        <div className="home-story-content">
          <p className="home-eyebrow">A LITTLE MORE MEANING</p>

          <h2>
            A home isn't
            <br />
            made in a day.
          </h2>

          <p>
            It comes together slowly. A favourite object here, a
            calming corner there, and the small things that make
            everyday life feel special.
          </p>

          <Link to="/shop" className="home-primary-button">
            Find your next favourite{" "}
            <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="home-bottom-cta">
        <p className="home-eyebrow">YOUR SPACE, YOUR STORY</p>
        <h2>Let your home grow with you.</h2>
        <p>Explore pieces that feel right, today and every day.</p>

        <Link to="/shop" className="home-primary-button">
          Discover verdant <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </div>
  );
}
