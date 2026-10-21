import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="not-found-page">
      <p className="not-found-code">404</p>
      <h1>Looks like you're taking a different path.</h1>
      <p>The page you’re looking for doesn’t exist.</p>

      <Link to="/" className="not-found-button">
        Return home
      </Link>
    </section>
  );
}