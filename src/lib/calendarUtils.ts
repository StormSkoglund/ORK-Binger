export type WeeklyTemplate = {
  names: string | string[];
  weekday: number;
  startTime: string;
  endTime: string;
};

export function formatForDateTimeLocal(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const year = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${mm}-${dd}T${hh}:${min}`;
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
) {
  return aStart < bEnd && bStart < aEnd;
}

export function getWeeklyTemplates(calendarId: string): WeeklyTemplate[] {
  const id = (calendarId || "").toLowerCase();

  if (id === "musikkbinge2" || id === "os_sentrum" || id === "musikkbingeos") {
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

export function getDateForWeekday(base: Date, weekday: number, weekOffset = 0) {
  const d = new Date(base);
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function setTime(dt: Date, timeStr: string) {
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
