import { Link } from "react-router-dom";

export default function Home() {
  return (
    <section className="home-page">
      <div className="home-hero">
        <p className="home-eyebrow">THOUGHTFULLY CURATED FOR YOUR SPACE</p>

        <h1>Find your everyday favourite.</h1>

        <p className="home-description">
          Beautiful details. A more intentional home.
        </p>

        <Link to="/shop" className="home-shop-button">
          Explore the collection
        </Link>
      </div>
    </section>
  );
}