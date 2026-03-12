import DraggableNames from "./components/DraggableNames";
import Calendar from "./components/Calendar";
import Landing from "./components/Landing";
import { getCalendarId } from "./lib/calendar";

export default function App() {
  // show landing page when at root path **only if no calendar query**
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

  // compute calendar-specific title (fallback to generic branding)
  const calendarId = getCalendarId();
  let appTitle = "Rockeklubben Os";
  if (calendarId) {
    // some installations use paths like /musikkbinge1 etc.  convert to
    // a human-friendly label when possible
    const match = calendarId.match(/^musikkbinge(\d+)$/i);
    if (match) {
      appTitle = `Musikkbinge ${match[1]}`;
    } else if (!/default/i.test(calendarId)) {
      // if the id is something else, just use it verbatim (capitalized)
      appTitle = calendarId.charAt(0).toUpperCase() + calendarId.slice(1);
    }
  }

  return (
    <div className="app-container">
      <h1>
        <span className="h1-emoji" aria-hidden="true"></span>
        {appTitle}
        <span className="h1-emoji" aria-hidden="true"></span>
      </h1>

      <div className="layout">
        <DraggableNames />
        <Calendar />
      </div>

      <footer className="app-footer" role="contentinfo">
        <small>© {new Date().getFullYear()} Alex Storm Skoglund</small>
      </footer>
    </div>
  );
}
