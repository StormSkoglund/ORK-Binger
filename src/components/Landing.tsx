import NewsFeed from "./NewsFeed";

const VENUES = [
  { id: "musikkbinge1", name: "Musikkbingen Søfteland", meta: "Søfteland" },
  { id: "musikkbinge2", name: "Musikkbingen Os Sentrum", meta: "Os Sentrum" },
  { id: "musikkbinge3", name: "Musikkbingen Nore Neset", meta: "Nore Neset" },
];

export default function Landing() {
  return (
    <div className="landing-root">
      {/* Top navigation bar */}
      <header className="site-header">
        <div className="site-header-inner">
          <div className="site-logo">
            <span className="site-logo-icon">♩</span>
            <span className="site-logo-name">Musikkbingene Os</span>
          </div>
          <span className="site-header-badge">Booking Portal</span>
        </div>
      </header>

      {/* Main content */}
      <main className="landing-main">
        {/* Hero */}
        <section className="hero">
          <span className="hero-tag">Online bookingsystem</span>
          <h1 className="hero-title">Musikkbingene i Os</h1>
          <p className="hero-subtitle">
            Velg ønsket binge for å se tilgjengelige tider.
          </p>
        </section>

        {/* Two-column: venues + news feed */}
        <div className="landing-body">
          <div>
            <p className="venue-section-label">Tilgjengelige lokaler</p>
            <ul className="venue-list">
              {VENUES.map((v, i) => (
                <li key={v.id}>
                  <a href={`/${v.id}`} className="venue-card">
                    <div className="venue-card-index">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="venue-card-body">
                      <h2 className="venue-card-name">{v.name}</h2>
                      <span className="venue-card-meta">
                        Klikk for å åpne kalender
                      </span>
                    </div>
                    <span className="venue-card-arrow">→</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <NewsFeed />
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer" role="contentinfo">
        <span>© {new Date().getFullYear()} Alex Storm Skoglund</span>
        <span className="site-footer-dot">·</span>
        <span>Musikkbingene Os</span>
      </footer>
    </div>
  );
}
