// utility for resolving the current calendar/room identifier
// The front end checks the ?cal= query parameter, then the path segment,
// then an environment variable (VITE_CALENDAR_ID), and finally falls back
// to "default".  This mirrors the logic used in Calendar.tsx previously.

export function getCalendarId(): string {
  if (typeof window === "undefined") return "default";
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get("cal");
    if (qp) return qp;

    // use pathname as fallback; strip trailing slash
    const path = url.pathname.replace(/\/+$/, "");
    if (path && path !== "/") {
      // return last segment without leading '/'
      const seg = path.split("/").pop();
      if (seg) return seg;
    }
  } catch {
    /* ignore malformed URL */
  }

  return (import.meta.env.VITE_CALENDAR_ID as string) || "default";
}

export const CALENDAR_ID = getCalendarId();
