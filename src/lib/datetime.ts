/**
 * Every time shown in the product is 12-hour with AM/PM. Never render raw
 * 24-hour clock values.
 */

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
};

export function formatTime(value: string | Date): string {
  return new Date(value).toLocaleTimeString(undefined, TIME_OPTS);
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString(undefined, DATE_OPTS);
}

export function formatDateTime(value: string | Date): string {
  return `${formatDate(value)}, ${formatTime(value)}`;
}

export function formatTimeRange(start: string | Date, end: string | Date): string {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/** "YYYY-MM-DDTHH:mm" for the current moment in the viewer's timezone. */
export function localNowInput(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

/** Splits a `datetime-local` string into its date and 24h time halves. */
export function splitLocalInput(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.split("T");
  return { date, time: time.slice(0, 5) };
}

export function joinLocalInput(date: string, time: string): string {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

/** Converts a 24h "HH:mm" to its 12-hour label, e.g. "01:30 PM". */
export function label12h(time: string): string {
  const [h = "0", m = "00"] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${String(display).padStart(2, "0")}:${m} ${suffix}`;
}

/** 15-minute slots across the whole day, as { value: "HH:mm", label }. */
export function timeSlots(stepMinutes = 15): { value: string; label: string }[] {
  const slots: { value: string; label: string }[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const value = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
      minutes % 60,
    ).padStart(2, "0")}`;
    slots.push({ value, label: label12h(value) });
  }
  return slots;
}
