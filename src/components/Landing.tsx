import NewsFeed from "./NewsFeed";

export default function Landing() {
  return (
    <div className="landing-container">
      <h1>BOOKINGSYSTEM - MUSIKKBINGENE OS</h1>
      <h2>Velkommen til bookingsystemet for musikkbingene i Os. </h2>
      <p>Klikk på bingen du vil booke for å gå til bookingkalenderen. </p>

      <div className="landing-columns">
        <ul className="room-list">
          <li>
            <a href="/musikkbinge1">Musikkbingen Søfteland</a>
          </li>
          <li>
            <a href="/musikkbinge2">Musikkbingen Os Sentrum</a>
          </li>
          <li>
            <a href="/musikkbinge3">Musikkbingen Nore Neset</a>
          </li>
        </ul>

        <NewsFeed />
      </div>

      <footer className="app-footer" role="contentinfo">
        <small>© {new Date().getFullYear()} Alex Storm Skoglund</small>
      </footer>
    </div>
  );
}
