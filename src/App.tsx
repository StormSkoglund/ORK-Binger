import { useState } from "react";
import DraggableNames from "./components/DraggableNames";
import Calendar from "./components/Calendar.new";
import Landing from "./components/Landing";
import { getCalendarId } from "./lib/calendar";
import { useGuestPass } from "./hooks/useGuestPass";

export default function App() {
  const path =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/+$/, "")
      : "";
  const hasCalParam =
    typeof window !== "undefined"
      ? new URL(window.location.href).searchParams.has("cal")
      : false;

  if ((path === "" || path === "/") && !hasCalParam) {
    return <Landing />;
  }

  const calendarId = getCalendarId();
  let appTitle = "Rockeklubben Os";
  if (calendarId) {
    const match = calendarId.match(/^musikkbinge(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num === 1) appTitle = "Musikkbingen Søfteland";
      else if (num === 2) appTitle = "Musikkbingen Os Sentrum";
      else if (num === 3) appTitle = "Musikkbingen Nore Neset";
      else appTitle = `Musikkbinge ${match[1]}`;
    } else if (!/default/i.test(calendarId)) {
      appTitle = calendarId.charAt(0).toUpperCase() + calendarId.slice(1);
    }
  }

  const {
    guestBand,
    setGuestBand,
    guestEvents,
    addGuestBooking,
    updateGuestBooking,
    removeGuestBooking,
    guestIntroOpen,
  } = useGuestPass();

  const isAdmin =
    typeof window !== "undefined" &&
    window.location.pathname.replace(/\/+$/, "") === "/admin";

  const guestMode = !isAdmin && Boolean(guestBand);
  const [bandInput, setBandInput] = useState(guestBand || "");

  return (
    <div className="app-shell">
      {/* App header */}
      <header className="app-header">
        <div className="app-header-inner">
          <a href="/" className="app-header-logo">
            <span className="app-header-logo-icon">♩</span>
            <span className="app-header-logo-text">Musikkbingene Os</span>
          </a>
          <span className="app-header-divider" />
          <h1 className="app-header-title">{appTitle}</h1>
          {((path !== "" && path !== "/") || hasCalParam) && (
            <a className="btn btn-sm btn-ghost" href="/">← Oversikt</a>
          )}
        </div>
      </header>

      <main className="app-main">
      <div className="layout">
        <DraggableNames guestBand={guestBand} guestMode={guestMode} />
        <Calendar
          guestBand={guestBand}
          guestMode={guestMode}
          guestEvents={guestEvents}
          addGuestBooking={addGuestBooking}
          updateGuestBooking={updateGuestBooking}
          removeGuestBooking={removeGuestBooking}
        />
      </div>
      </main>

      {!isAdmin && guestIntroOpen && (
        <div className="modal-backdrop" onClick={() => {}}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Velkommen til demoen</h3>
            <p>
              Du ser ekte bookinger fra databasen. Som gjest kan du legge til og
              fjerne dine egne falske bookinger, disse lagres kun i nettleseren.
            </p>
            <p>
              De ekte bookingene er kun til visning og kan ikke endres her i
              demoen.
            </p>
            <label>
              Navn på bandet ditt:
              <input
                className="text-input"
                value={bandInput}
                onChange={(event) => setBandInput(event.target.value)}
                placeholder="Skriv bandnavn her"
              />
            </label>
            <div className="modal-actions">
              <button
                className="btn"
                onClick={() => {
                  const name = bandInput.trim();
                  if (!name) return;
                  setGuestBand(name);
                }}
              >
                Start demoen
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer" role="contentinfo">
        <small>© {new Date().getFullYear()} Alex Storm Skoglund — Musikkbingene Os</small>
      </footer>
    </div>
  );
}
