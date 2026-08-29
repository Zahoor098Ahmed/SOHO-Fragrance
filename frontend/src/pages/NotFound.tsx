import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ivory pt-16 flex items-center justify-center px-6">
      <div className="text-center">
        <div className="font-display text-9xl text-cream font-light leading-none">404</div>
        <h1 className="font-display text-3xl text-dark-text mt-4 mb-3">Page Not Found</h1>
        <p className="text-muted-text mb-8">The page you're looking for has drifted away, like a forgotten scent.</p>
        <Link to="/" className="inline-block px-8 py-3 bg-burgundy text-cream text-xs tracking-[0.3em] uppercase font-semibold hover:bg-dark-burgundy transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
}
