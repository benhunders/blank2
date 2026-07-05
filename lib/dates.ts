// Date-only (YYYY-MM-DD) helpers. `new Date("2026-06-21")` parses as UTC
// midnight, which renders as the *previous day* in timezones west of UTC —
// always parse date-only strings as local time instead.

export function parseLocalDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00`);
}

export function formatDay(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
): string {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, options);
}
