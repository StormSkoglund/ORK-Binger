import { useEffect, useState } from "react";
import type { ModalEvent } from "../hooks/useBookingCalendar";

function formatForDateTimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const year = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${mm}-${dd}T${hh}:${min}`;
}

type BookingModalProps = {
  modalEvent: ModalEvent;
  onClose: () => void;
  onDeleteRequested: () => void;
  onReschedule: (id: string, newStartIso: string, newEndIso?: string) => void;
};

export default function BookingModal({
  modalEvent,
  onClose,
  onDeleteRequested,
  onReschedule,
}: BookingModalProps) {
  const [startValue, setStartValue] = useState(
    formatForDateTimeLocal(modalEvent.startIso),
  );
  const [endValue, setEndValue] = useState(
    modalEvent.endIso ? formatForDateTimeLocal(modalEvent.endIso) : "",
  );

  useEffect(() => {
    setStartValue(formatForDateTimeLocal(modalEvent.startIso));
    setEndValue(
      modalEvent.endIso ? formatForDateTimeLocal(modalEvent.endIso) : "",
    );
  }, [modalEvent]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{modalEvent.title}</h3>
        <div className="modal-row">
          Start:{" "}
          {new Date(modalEvent.startIso).toLocaleString(undefined, {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
        <div className="modal-row">
          End:{" "}
          {modalEvent.endIso
            ? new Date(modalEvent.endIso).toLocaleString(undefined, {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </div>
        <div className="modal-actions">
          <button className="btn btn-danger" onClick={onDeleteRequested}>
            Cancel booking
          </button>
          <div className="reschedule">
            <label>
              Start:
              <input
                value={startValue}
                onChange={(event) => setStartValue(event.target.value)}
                type="datetime-local"
                id={`reschedule-start-${modalEvent.id}`}
              />
            </label>
            <label>
              End:
              <input
                value={endValue}
                onChange={(event) => setEndValue(event.target.value)}
                type="datetime-local"
                id={`reschedule-end-${modalEvent.id}`}
              />
            </label>
            <button
              className="btn"
              onClick={() => {
                if (startValue)
                  onReschedule(
                    modalEvent.id,
                    new Date(startValue).toISOString(),
                    endValue ? new Date(endValue).toISOString() : undefined,
                  );
              }}
            >
              Save
            </button>
          </div>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
