import DraggableNames from "./components/DraggableNames";
import Calendar from "./components/Calendar";
import Landing from "./components/Landing";

export default function App() {
  // show landing page when at root path
  const path =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/+$/, "")
      : "";

  if (path === "" || path === "/") {
    return <Landing />;
  }

  return (
    <div className="app-container">
      <h1>
        <span className="h1-emoji" aria-hidden="true">
          🤘🧑‍🎤🎸
        </span>
        Rockeklubben Os
        <span className="h1-emoji" aria-hidden="true">
          🎤👨‍🎤🤘
        </span>
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
