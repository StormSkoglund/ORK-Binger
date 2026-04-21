import { useEffect, useState } from "react";

const STORAGE_KEY_GUEST_BAND = "guest-pass-band";
const STORAGE_KEY_GUEST_BOOKINGS = "guest-pass-bookings";

type GuestBooking = {
  id: string;
  title: string;
  start: string;
  end?: string;
  isGuest: true;
};

function isGuestBooking(value: unknown): value is GuestBooking {
  if (!value || typeof value !== "object") return false;
  const booking = value as Record<string, unknown>;
  return (
    typeof booking.id === "string" &&
    typeof booking.title === "string" &&
    typeof booking.start === "string" &&
    (typeof booking.end === "string" || booking.end === undefined)
  );
}

export function useGuestPass() {
  const [guestBand, setGuestBand] = useState<string | null>(null);
  const [guestEvents, setGuestEvents] = useState<GuestBooking[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedBand = window.localStorage.getItem(STORAGE_KEY_GUEST_BAND);
    const storedEvents = window.localStorage.getItem(
      STORAGE_KEY_GUEST_BOOKINGS,
    );

    if (storedBand) {
      setGuestBand(storedBand);
    }

    if (storedEvents) {
      try {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed)) {
          const bookings = parsed.filter(isGuestBooking);
          setGuestEvents(bookings);
        }
      } catch {
        setGuestEvents([]);
      }
    }

    setInitialized(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !initialized) return;
    if (guestBand) {
      window.localStorage.setItem(STORAGE_KEY_GUEST_BAND, guestBand);
    } else {
      window.localStorage.removeItem(STORAGE_KEY_GUEST_BAND);
    }
  }, [guestBand, initialized]);

  useEffect(() => {
    if (typeof window === "undefined" || !initialized) return;
    window.localStorage.setItem(
      STORAGE_KEY_GUEST_BOOKINGS,
      JSON.stringify(guestEvents),
    );
  }, [guestEvents, initialized]);

  const addGuestBooking = (booking: GuestBooking) => {
    setGuestEvents((prev) => [...prev, booking]);
  };

  const updateGuestBooking = (
    id: string,
    updated: Partial<Omit<GuestBooking, "id" | "isGuest">>,
  ) => {
    setGuestEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, ...updated, isGuest: true } : event,
      ),
    );
  };

  const removeGuestBooking = (id: string) => {
    setGuestEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const guestIntroOpen = initialized && !guestBand;

  return {
    guestBand,
    setGuestBand,
    guestEvents,
    addGuestBooking,
    updateGuestBooking,
    removeGuestBooking,
    guestIntroOpen,
  };
}
