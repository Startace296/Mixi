const HOUR_MINUTE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const FULL_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type DateInput = string | number | Date | null | undefined;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatMessengerTime(value: DateInput, now: Date = new Date()): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffDays = Math.floor((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86400000);
  const timeLabel = HOUR_MINUTE_FORMATTER.format(date);

  if (diffDays === 0) return timeLabel;
  if (diffDays === 1) return `Yesterday ${timeLabel}`;
  if (diffDays > 1 && diffDays < 7) {
    return `${WEEKDAY_FORMATTER.format(date)} ${timeLabel}`;
  }

  return DATE_FORMATTER.format(date);
}

export function formatFullMessageTime(value: DateInput): string {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return FULL_DATE_TIME_FORMATTER.format(date);
}
