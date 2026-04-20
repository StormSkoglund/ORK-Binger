import { useEffect, useState } from "react";
import type { EventInput } from "@fullcalendar/core";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { CALENDAR_ID } from "../lib/calendar";

type BookingRow = {
  id: string;
  user_name: string;
  start_ts: string;
  end_ts: string;
  calendar_id?: string;
};

export type ToastItem = {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
};

export type ModalEvent = {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
};

export function useBookingCalendar() {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modalEvent, setModalEvent] = useState<ModalEvent | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  useEffect(() => {
    loadBookings();

    let channelRef: any = null;
    const setupRealtime = async () => {
      if (!isSupabaseConfigured) return;

      const ch = supabase
        .channel("public:bookings")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `calendar_id=eq.${CALENDAR_ID}`,
          },
          (payload: any) => {
            const row = payload.new || payload.old;
            if (!row) return;

            if (payload.eventType === "INSERT") {
              setEvents((prev) =>
                prev.some((e) => e.id === row.id)
                  ? prev
                  : [
                      ...prev,
                      {
                        id: row.id,
                        title: row.user_name,
                        start: row.start_ts,
                        end: row.end_ts,
                      },
                    ],
              );
            }
            if (payload.eventType === "UPDATE") {
              setEvents((prev) =>
                prev.map((e) =>
                  e.id === row.id
                    ? {
                        id: row.id,
                        title: row.user_name,
                        start: row.start_ts,
                        end: row.end_ts,
                      }
                    : e,
                ),
              );
            }
            if (payload.eventType === "DELETE") {
              setEvents((prev) => prev.filter((e) => e.id !== row.id));
            }
          },
        )
        .subscribe();

      channelRef = ch;
    };

    setupRealtime();

    return () => {
      if (channelRef) channelRef.unsubscribe();
    };
  }, []);

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("id,user_name,start_ts,end_ts")
      .eq("calendar_id", CALENDAR_ID)
      .order("start_ts", { ascending: true });

    if (error) {
      console.error("Supabase loadBookings error", error);
      const msg =
        (error && (error.message || error.details || JSON.stringify(error))) ||
        "Unknown Supabase error";
      setSupabaseError(msg);
      pushToast({
        id: `supabase-err-${Date.now()}`,
        message: `Supabase error: ${msg}`,
      });
      return;
    }

    setSupabaseError(null);
    const evs = (data || []).map((b: BookingRow) => ({
      id: b.id,
      title: b.user_name,
      start: b.start_ts,
      end: b.end_ts,
    }));
    setEvents(evs || []);

    if (
      (CALENDAR_ID === "musikkbinge2" ||
        CALENDAR_ID === "os_sentrum" ||
        CALENDAR_ID === "musikkbingeos") &&
      evs.length === 0
    ) {
      pushToast({
        id: `seed-fallback-${Date.now()}`,
        message:
          "Ingen bookings funnet for Musikkbingen 2. Genererer fast søndagsbooking for Henrik Furuvik...",
      });
      await seedWeeklySchedule(52);
    }
  }

  function isRangeBooked(start: Date, end: Date, allowEventId?: string) {
    return events.some((e) => {
      const es = new Date(e.start as string);
      const ee = new Date((e.end as string) || es);
      const overlap = rangesOverlap(start, end, es, ee);
      return overlap && (!allowEventId || e.id !== allowEventId);
    });
  }

  function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && bStart < aEnd;
  }

  function getWeeklyTemplates(calendarId: string) {
    const id = (calendarId || "").toLowerCase();

    if (
      id === "musikkbinge2" ||
      id === "os_sentrum" ||
      id === "musikkbingeos"
    ) {
      return [
        {
          names: "Henrik Furuvik",
          weekday: 0,
          startTime: "18:00",
          endTime: "22:00",
        },
      ];
    }

    if (id === "musikkbinge1" || id === "soefteland") {
      return [
        {
          names: "Storm Valley",
          weekday: 1,
          startTime: "19:00",
          endTime: "24:00",
        },
        { names: "E39", weekday: 2, startTime: "18:00", endTime: "24:00" },
        {
          names: "De Navnløse",
          weekday: 0,
          startTime: "17:00",
          endTime: "20:00",
        },
      ];
    }

    return [
      {
        names: "Silver Monochrome",
        weekday: 1,
        startTime: "18:00",
        endTime: "22:00",
      },
      {
        names: "Young Collection",
        weekday: 2,
        startTime: "16:00",
        endTime: "20:00",
      },
      {
        names: "Blue Experience",
        weekday: 3,
        startTime: "16:00",
        endTime: "20:30",
      },
      {
        names: ["Warfart", "Verdiløse Menn"],
        weekday: 4,
        startTime: "18:00",
        endTime: "23:00",
      },
      { names: "Dødsdau", weekday: 5, startTime: "18:00", endTime: "23:00" },
      { names: "Notörious", weekday: 6, startTime: "14:00", endTime: "18:00" },
      {
        names: "Storm Valley",
        weekday: 6,
        startTime: "18:30",
        endTime: "23:00",
      },
      { names: "Tommy Cash", weekday: 0, startTime: "18:00", endTime: "23:00" },
    ];
  }

  function getDateForWeekday(base: Date, weekday: number, weekOffset = 0) {
    const d = new Date(base);
    const diff = (weekday - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function setTime(dt: Date, timeStr: string) {
    const [hhStr, mmStr] = timeStr.split(":");
    const hh = parseInt(hhStr, 10);
    const mm = parseInt(mmStr, 10);
    const d = new Date(dt);

    if (hh === 24) {
      d.setDate(d.getDate() + 1);
      d.setHours(0, mm, 0, 0);
    } else {
      d.setHours(hh, mm, 0, 0);
    }
    return d;
  }

  function pushToast(t: ToastItem) {
    const id = t.id || String(Date.now());
    setToasts((s) => [...s, { ...t, id }]);
    setTimeout(() => removeToast(id), 6000);
  }

  function removeToast(id: string) {
    setToasts((s) => s.filter((t) => t.id !== id));
  }

  async function seedWeeklySchedule(weeks = 52) {
    if (!isSupabaseConfigured) {
      pushToast({
        id: `seed-nosb-${Date.now()}`,
        message: "Supabase not configured — cannot seed schedule.",
      });
      return;
    }

    pushToast({
      id: `seed-start-${Date.now()}`,
      message: `Seeding weekly schedule (${weeks} weeks) for calendar '${CALENDAR_ID}'...`,
    });

    const today = new Date();
    const templates = getWeeklyTemplates(CALENDAR_ID);
    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    try {
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + weeks * 7);

      await supabase
        .from("bookings")
        .delete()
        .eq("calendar_id", CALENDAR_ID)
        .gte("start_ts", today.toISOString())
        .lt("start_ts", endDate.toISOString());
    } catch (err) {
      console.error("Failed to clear existing seed bookings", err);
    }

    for (let w = 0; w < weeks; w++) {
      for (const tpl of templates) {
        const bandName = Array.isArray(tpl.names)
          ? tpl.names[w % tpl.names.length]
          : tpl.names;
        const dayDate = getDateForWeekday(today, tpl.weekday, w);
        const startDt = setTime(dayDate, tpl.startTime);
        const endDt = setTime(dayDate, tpl.endTime);

        try {
          const { data, error } = await supabase
            .from("bookings")
            .insert([
              {
                start_ts: startDt.toISOString(),
                end_ts: endDt.toISOString(),
                user_name: bandName,
                calendar_id: CALENDAR_ID,
              },
            ])
            .select()
            .single();

          if (error || !data) {
            skipped++;
            continue;
          }

          inserted++;
          setEvents((prev) => [
            ...prev,
            {
              id: data.id,
              title: data.user_name,
              start: data.start_ts,
              end: data.end_ts,
            },
          ]);
        } catch (err) {
          console.error("Seed error", err);
          failed++;
        }
      }
    }

    pushToast({
      id: `seed-done-${Date.now()}`,
      message: `Seeding finished for '${CALENDAR_ID}' — added ${inserted}, skipped ${skipped}, failed ${failed}.`,
    });
  }

  async function handleEventReceive(info: any) {
    const event = info.event;
    const start = event.start as Date | null;
    const end =
      (event.end as Date) ||
      (start ? new Date(start.getTime() + 60 * 60 * 1000) : null);

    if (!start || !end) {
      pushToast({
        id: `err-no-date-${Date.now()}`,
        message: "Drop failed — no date/time detected.",
      });
      info.revert();
      return;
    }

    if (end <= start) {
      pushToast({
        id: `err-invalid-range-${Date.now()}`,
        message: "Invalid time range.",
      });
      info.revert();
      return;
    }

    if (isRangeBooked(start, end)) {
      pushToast({
        id: `err-overlap-${Date.now()}`,
        message:
          "Time slot overlaps an existing booking — please contact the band to request permission.",
      });
      info.revert();
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .insert([
        {
          start_ts: start.toISOString(),
          end_ts: end.toISOString(),
          user_name: event.title,
          calendar_id: CALENDAR_ID,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      console.error("Supabase insert error", error);
      const m =
        (error && (error.message || error.details || JSON.stringify(error))) ||
        "";
      const errMsg = /overlap|exclude|constraint/i.test(m)
        ? "That time slot is already taken."
        : "Failed to save booking.";
      pushToast({
        id: `err-insert-${Date.now()}`,
        message: `${errMsg} ${m ? `(${m})` : ""}`,
      });
      setSupabaseError(m || "Insert failed");
      info.revert();
      return;
    }

    event.setProp("id", data.id);
    setEvents((prev) => [
      ...prev,
      {
        id: data.id,
        title: data.user_name,
        start: data.start_ts,
        end: data.end_ts,
      },
    ]);

    pushToast({
      id: data.id,
      message: `Booked ${data.user_name} — ${new Date(
        data.start_ts,
      ).toLocaleString(undefined, {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
      actionLabel: "Undo",
      onAction: async () => await undoDeleteBooking(data.id),
    });
  }

  function eventAllow(dropInfo: any) {
    const start = dropInfo.start as Date;
    const end =
      (dropInfo.end as Date) ||
      (start ? new Date(start.getTime() + 60 * 60 * 1000) : null);
    const draggingEventId = dropInfo.event?.id;
    if (!start || !end) return false;
    return !isRangeBooked(start, end, draggingEventId);
  }

  async function handleEventDrop(info: any) {
    const event = info.event;
    const id = event.id as string;
    const newStart = event.start as Date | null;
    const newEnd =
      (event.end as Date) ||
      (newStart ? new Date(newStart.getTime() + 60 * 60 * 1000) : null);

    if (!newStart || !newEnd) {
      pushToast({
        id: `err-no-date-${Date.now()}`,
        message: "Invalid drop target.",
      });
      info.revert();
      return;
    }

    if (isRangeBooked(newStart, newEnd, id)) {
      pushToast({
        id: `err-overlap-${Date.now()}`,
        message:
          "That time overlaps another booking — please contact the band to request permission.",
      });
      info.revert();
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({
        start_ts: newStart.toISOString(),
        end_ts: newEnd.toISOString(),
      })
      .eq("id", id)
      .eq("calendar_id", CALENDAR_ID)
      .select()
      .single();

    if (error || !data) {
      console.error("Failed to update booking", error);
      pushToast({
        id: `err-update-${Date.now()}`,
        message: "Failed to reschedule (date/time may be taken).",
      });
      info.revert();
      return;
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, start: data.start_ts, end: data.end_ts } : e,
      ),
    );
    pushToast({
      id,
      message: `Rescheduled ${data.user_name} → ${new Date(
        data.start_ts,
      ).toLocaleString(undefined, {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
      actionLabel: "Undo",
      onAction: async () => await undoDeleteBooking(id),
    });
  }

  async function handleEventResize(info: any) {
    const id = info.event.id as string;
    const newStart = info.event.start as Date;
    const newEnd = info.event.end as Date;
    if (!newStart || !newEnd) {
      info.revert();
      return;
    }

    if (isRangeBooked(newStart, newEnd, id)) {
      pushToast({
        id: `err-overlap-${Date.now()}`,
        message:
          "That time overlaps an existing booking — please contact the band to request permission.",
      });
      info.revert();
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({
        start_ts: newStart.toISOString(),
        end_ts: newEnd.toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      pushToast({
        id: `err-resize-${Date.now()}`,
        message: "Failed to save resized booking.",
      });
      info.revert();
      return;
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, start: data.start_ts, end: data.end_ts } : e,
      ),
    );

    pushToast({
      id,
      message: `Updated ${data.user_name} → ${new Date(
        data.start_ts,
      ).toLocaleString(undefined, {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
    });
  }

  function handleEventClick(arg: any) {
    const id = arg.event.id as string;
    const title = arg.event.title;
    const startIso = arg.event.start
      ? (arg.event.start as Date).toISOString()
      : "";
    const endIso = arg.event.end ? (arg.event.end as Date).toISOString() : "";
    setModalEvent({ id, title, startIso, endIso });
  }

  async function deleteBooking(id: string) {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)
      .eq("calendar_id", CALENDAR_ID);
    if (error) {
      console.error("Delete failed", error);
      alert("Failed to cancel booking");
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    pushToast({ id: `del-${id}`, message: "Booking canceled" });
    setModalEvent(null);
  }

  async function rescheduleBooking(
    id: string,
    newStartIso: string,
    newEndIso?: string,
  ) {
    if (!newStartIso) {
      pushToast({
        id: `err-no-date-resched-${Date.now()}`,
        message: "Please choose a valid start date/time.",
      });
      return;
    }

    const newStart = new Date(newStartIso);
    const newEnd = newEndIso
      ? new Date(newEndIso)
      : new Date(newStart.getTime() + 60 * 60 * 1000);

    if (isRangeBooked(newStart, newEnd, id)) {
      pushToast({
        id: `err-booked-${newStartIso}`,
        message: "That time is already booked. Choose another time.",
      });
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({
        start_ts: newStart.toISOString(),
        end_ts: newEnd.toISOString(),
      })
      .eq("id", id)
      .eq("calendar_id", CALENDAR_ID)
      .select()
      .single();

    if (error || !data) {
      console.error("Reschedule failed", error);
      pushToast({
        id: `err-resched-${Date.now()}`,
        message: "Failed to reschedule (date/time may be taken)",
      });
      return;
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, start: data.start_ts, end: data.end_ts } : e,
      ),
    );
    pushToast({
      id,
      message: `Rescheduled ${data.user_name} → ${new Date(
        data.start_ts,
      ).toLocaleString(undefined, {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
      actionLabel: "Undo",
      onAction: async () => await undoDeleteBooking(id),
    });
    setModalEvent(null);
  }

  async function undoDeleteBooking(id: string) {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)
      .eq("calendar_id", CALENDAR_ID);
    if (error) {
      console.error("Undo delete failed", error);
      alert("Undo failed");
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return {
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
    undoDeleteBooking,
    seedWeeklySchedule,
    pushToast,
    removeToast,
  };
}
