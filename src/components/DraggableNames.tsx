import { useEffect, useRef } from "react";
import { Draggable } from "@fullcalendar/interaction";
import { getCalendarId } from "../lib/calendar";

const NAME_MAP: Record<string, string[]> = {
  musikkbinge1: ["Storm Valley", "E39", "De Navnløse", "The Admins"],
  musikkbinge2: ["Sick Fade", "Grim Spencer", "Henrik Furuvik", "The Admins"],
  musikkbinge3: ["Henrik Furuvik", "The Admins"],
};

type DraggableNamesProps = {
  guestBand?: string | null;
  guestMode?: boolean;
};

export default function DraggableNames({
  guestBand,
  guestMode,
}: DraggableNamesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calendarId =
    typeof window !== "undefined"
      ? getCalendarId().toLowerCase()
      : "musikkbinge1";
  const names = NAME_MAP[calendarId] || [];
  const bandList = guestBand
    ? [guestBand, ...names.filter((name) => name !== guestBand)]
    : names;

  useEffect(() => {
    let draggable: any;
    const container = containerRef.current;

    let onPointerDown: (ev: PointerEvent | TouchEvent) => void;
    let onPointerUp: () => void;
    let onTouchMove: (ev: TouchEvent) => void;

    if (container) {
      draggable = new Draggable(container, {
        itemSelector: ".fc-external",
        appendTo: document.body,
        eventData: function (el) {
          return {
            title: el.getAttribute("data-name") || "Unknown",
            duration: "01:00",
          };
        },
      });

      onPointerDown = (ev: any) => {
        const target = ev.target as HTMLElement;
        const el =
          target && target.closest ? target.closest(".fc-external") : null;
        if (el) document.body.classList.add("is-dragging");
      };
      onPointerUp = () => document.body.classList.remove("is-dragging");
      onTouchMove = (e: TouchEvent) => {
        if (document.body.classList.contains("is-dragging")) {
          e.preventDefault();
        }
      };

      container.addEventListener("pointerdown", onPointerDown as EventListener);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      container.addEventListener("touchstart", onPointerDown as EventListener, {
        passive: true,
      });
      window.addEventListener("touchend", onPointerUp);
      window.addEventListener("touchcancel", onPointerUp);
      window.addEventListener("dragend", onPointerUp);
      window.addEventListener("touchmove", onTouchMove as EventListener, {
        passive: false,
      });
    }

    return () => {
      if (draggable) draggable.destroy();
      if (container) {
        container.removeEventListener(
          "pointerdown",
          onPointerDown as EventListener,
        );
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        container.removeEventListener(
          "touchstart",
          onPointerDown as EventListener,
        );
        window.removeEventListener("touchend", onPointerUp);
        window.removeEventListener("touchcancel", onPointerUp);
        window.removeEventListener("dragend", onPointerUp);
        window.removeEventListener("touchmove", onTouchMove as EventListener);
      }
    };
  }, []);

  return (
    <div className="external-container" ref={containerRef}>
      <h3>Bands (trekk og slipp i kalenderen)</h3>
      {bandList.map((band) => {
        const isDraggable = guestMode && guestBand === band;
        return isDraggable ? (
          <div key={band} className="fc-external" data-name={band}>
            {band}
          </div>
        ) : (
          <div key={band} className="fc-external-disabled" aria-disabled="true">
            {band}
          </div>
        );
      })}
      <strong>Booking</strong>
      <p className="hint">
        Dra bandet ditt til et tidsrom for å lage en falsk booking. Bare ditt
        band er interaktivt i denne demoen.
      </p>
      <strong>Slette Booking</strong>
      <p className="hint">
        Trykk på din egen booking i kalenderen for å fjerne den.
      </p>
    </div>
  );
}
