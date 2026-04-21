import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

type BookingRow = {
  id: string;
  user_name: string;
  start_ts: string;
  end_ts: string;
  calendar_id: string;
  created_at?: string;
};

type FeedItem = {
  id: string;
  time: string;
  message: string;
};

const CALENDAR_IDS = ["musikkbinge1", "musikkbinge2", "musikkbinge3"] as const;

function calendarLabel(calendarId: string) {
  const match = calendarId.match(/^musikkbinge(\d+)$/i);
  return match ? `Musikkbinge ${match[1]}` : calendarId;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("nb-NO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function makeMessage(eventType: string, row: BookingRow) {
  const room = calendarLabel(row.calendar_id);
  const name = row.user_name || "Ukjent";
  const start = formatDateTime(row.start_ts);
  const end = formatDateTime(row.end_ts);

  if (eventType === "INSERT") {
    return `Ny booking i ${room}: ${name} (${start}–${end})`;
  }
  if (eventType === "DELETE") {
    return `Booking slettet i ${room}: ${name} (${start}–${end})`;
  }
  // UPDATE
  return `Booking endret i ${room}: ${name} (${start}–${end})`;
}

export default function NewsFeed() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  const calendarIdFilter = useMemo(() => CALENDAR_IDS.join(","), []);

  useEffect(() => {
    let channel: any;
    async function load() {
      if (!isSupabaseConfigured) {
        setFeedItems([
          {
            id: "no-supabase",
            time: new Date().toISOString(),
            message:
              "Supabase er ikke konfigurert. Nyhetsfeeden trenger Supabase for å vise bookingendringer.",
          },
        ]);
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("id,user_name,start_ts,end_ts,calendar_id,created_at")
        .in("calendar_id", CALENDAR_IDS)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error && data) {
        const items: FeedItem[] = data
          .map((row: BookingRow) => ({
            id: row.id,
            time: row.created_at ?? row.start_ts,
            message: `Ny booking i ${calendarLabel(row.calendar_id)}: ${row.user_name} (${formatDateTime(
              row.start_ts,
            )}–${formatDateTime(row.end_ts)})`,
          }))
          .sort((a, b) => (a.time < b.time ? 1 : -1));
        setFeedItems(items);
      }

      channel = supabase
        .channel("public:bookings:newsfeed")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookings",
            filter: `calendar_id=in.(${calendarIdFilter})`,
          },
          (payload: any) => {
            const row: BookingRow = payload.new || payload.old;
            if (!row) return;
            const message = makeMessage(payload.eventType, row);
            const item: FeedItem = {
              id: `${payload.eventType}-${row.id}-${Date.now()}`,
              time: new Date().toISOString(),
              message,
            };
            setFeedItems((prev) => [item, ...prev].slice(0, 20));
          },
        )
        .subscribe();
    }

    load();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [calendarIdFilter]);

  return (
    <section className="news-feed" aria-label="Nyheter">
      <div className="news-feed-header">
        <h3>Aktivitetslogg</h3>
        <span className="news-feed-live">Live</span>
      </div>
      <p className="news-feed-intro">
        Nye bookinger og endringer fra alle musikkbingene vises her i sanntid.
      </p>
      <ol className="news-feed-list">
        {feedItems.length === 0 ? (
          <li className="news-feed-item">
            <div className="news-feed-dot" />
            <div className="news-feed-content">
              <span className="news-feed-message">
                Ingen nye hendelser akkurat nå.
              </span>
            </div>
          </li>
        ) : (
          feedItems.map((item) => (
            <li key={item.id} className="news-feed-item">
              <div className="news-feed-dot" />
              <div className="news-feed-content">
                <span className="news-feed-time">
                  {formatDateTime(item.time)}
                </span>
                <span className="news-feed-message">{item.message}</span>
              </div>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
