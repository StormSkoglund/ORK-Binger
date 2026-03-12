export default function Landing() {
  return (
    <div className="landing-container">
      <h1>BOOKINGSYSTEM - MUSIKKBINGENE OS</h1>
      <p>
        Velkommen til bookingsystemet for musikkbingene i Os. Klikk på den
        bingen du ønsker å booke, for å navigere til bookingkalenderen.
      </p>
      <ul className="room-list">
        <li>
          <a href="/musikkbinge1">Musikkbinge 1</a>
        </li>
        <li>
          <a href="/musikkbinge2">Musikkbinge 2</a>
        </li>
        <li>
          <a href="/musikkbinge3">Musikkbinge 3</a>
        </li>
      </ul>
      <footer className="app-footer" role="contentinfo">
        <small>© {new Date().getFullYear()} Alex Storm Skoglund</small>
      </footer>
    </div>
  );
}
