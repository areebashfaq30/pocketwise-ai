export const FINANCE_TIME_ZONE = "Asia/Karachi";

export function getMonthInFinanceTimeZone(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: FINANCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export function getDayInFinanceTimeZone(date = new Date()) {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: FINANCE_TIME_ZONE,
      day: "2-digit",
    }).format(date),
  );
}

export function getDateInFinanceTimeZone(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: FINANCE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}
