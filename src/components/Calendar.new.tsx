import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import Toast from "./Toast";
import BookingModal from "./BookingModal";
import { useBookingCalendar } from "../hooks/useBookingCalendar";
import { isSupabaseConfigured } from "../lib/supabase";

export default function Calendar() {
  const calendarRef = useRef<any>(null);
  const [seedConfirmationPending, setSeedConfirmationPending] = useState(false);

  const {
    events,
    toasts,
    modalEvent,
    setModalEvent,
    supabaseError,
    handleEventReceive,
    eventAllow,
    handleEventDrop,
    handleEventResize,
    handleEventClick,
    deleteBooking,
    rescheduleBooking,
    seedWeeklySchedule,
    pushToast,
    removeToast,
  } = useBookingCalendar();

  const isAdmin =
    typeof window !== "undefined" &&
    window.location.pathname.replace(/\/+$/, "") === "/admin";

  const confirmDeleteBooking = () => {
    if (!modalEvent) return;

    pushToast({
      id: `confirm-del-${modalEvent.id}`,
      message: `Er du helt sikker på at du vil fjerne tiden til ${modalEvent.title}?`,
      actionLabel: "Ja",
      onAction: () => deleteBooking(modalEvent.id),
      cancelLabel: "Nej",
      onCancel: () => {
        /* just close the toast */
      },
    });
  };

  const handleReschedule = (
    id: string,
    newStartIso: string,
    newEndIso?: string,
  ) => {
    rescheduleBooking(id, newStartIso, newEndIso);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-scroll-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          firstDay={1}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          slotDuration="01:00:00"
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          displayEventTime={false}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
          droppable={true}
          editable={true}
          selectable={true}
          events={events}
          eventReceive={handleEventReceive}
          eventAllow={eventAllow}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          ref={calendarRef}
          height="parent"
          scrollTime="18:00:00"
        />
      </div>

      {isSupabaseConfigured && isAdmin && (
        <div style={{ marginTop: 12 }}>
          <button
            className="btn"
            onClick={() => {
              if (seedConfirmationPending) {
                pushToast({
                  id: `seed-remind-${Date.now()}`,
                  message:
                    "Bekreft i varselet (toast) for å gjenstarte ukeplanen.",
                });
                return;
              }

              setSeedConfirmationPending(true);
              const toastId = `seed-confirm-${Date.now()}`;
              pushToast({
                id: toastId,
                message:
                  "ADVARSEL: Gjenstart ukeplan for de neste 52 ukene. Dette vil opprette bookings i databasen. Er du sikker?",
                actionLabel: "Bekreft",
                onAction: async () => {
                  setSeedConfirmationPending(false);
                  await seedWeeklySchedule(52);
                },
              });

              setTimeout(() => setSeedConfirmationPending(false), 8000);
            }}
            disabled={seedConfirmationPending}
          >
            {seedConfirmationPending
              ? "Bekreft i varselet..."
              : "Gjenstart ukeplan (52 uker)"}
          </button>
          <small style={{ marginLeft: 8, color: "#666" }}>
            Denne knappen gjenskaper ukeplanen for 52 uker frem i tid. Bekreft i
            varselet for å fullføre handlingen.
          </small>
        </div>
      )}

      {modalEvent && (
        <BookingModal
          modalEvent={modalEvent}
          onClose={() => setModalEvent(null)}
          onDeleteRequested={confirmDeleteBooking}
          onReschedule={handleReschedule}
        />
      )}

      {!isSupabaseConfigured && (
        <div className="notice" style={{ marginTop: 12, color: "#b45309" }}>
          Supabase not configured — bookings will not persist. Add keys to
          `.env` and restart dev server.
        </div>
      )}

      {isSupabaseConfigured && supabaseError && (
        <div className="notice" style={{ marginTop: 12 }}>
          <strong>Supabase error:</strong> {supabaseError}
          <div style={{ marginTop: 6 }}>
            Common causes: invalid project URL / anon key, table not created, or
            RLS policy blocking access.
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
