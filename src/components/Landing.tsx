import React from "react";

export default function Landing() {
  return (
    <div className="landing-container">
      <h1>Velg Musikkbinge</h1>
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
      <p>
        Alternativt kan du legge til <code>?cal=musikkbinge1</code> (eller
        musikkbinge2/musikkbinge3) etter URLen for å velge direkte.
      </p>
    </div>
  );
}
