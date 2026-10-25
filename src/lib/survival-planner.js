const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

function toUtcDay(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return null;
  }

  const date = new Date(`${dateString}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateString
  ) {
    return null;
  }

  return date.getTime() / MILLISECONDS_PER_DAY;
}

export function calculateSurvivalPlan({
  remainingBalancePaisa,
  essentialReservePaisa = 0,
  nextAllowanceDate,
  today,
}) {
  const spendableBalancePaisa = Math.max(
    0,
    remainingBalancePaisa - essentialReservePaisa,
  );
  const hasAllowanceDate = typeof nextAllowanceDate === "string";
  const allowanceDay = hasAllowanceDate ? toUtcDay(nextAllowanceDate) : null;
  const todayDay = toUtcDay(today);
  const hasValidDates = allowanceDay !== null && todayDay !== null;
  const daysUntilAllowance = hasValidDates
    ? allowanceDay - todayDay
    : null;
  const status = !hasAllowanceDate
    ? "not-configured"
    : !hasValidDates
      ? "invalid"
      : daysUntilAllowance < 0
      ? "overdue"
      : daysUntilAllowance === 0
        ? "due-today"
        : "upcoming";

  return {
    status,
    daysUntilAllowance,
    spendableBalancePaisa,
    dailySafeSpendingPaisa:
      status === "upcoming"
        ? Math.floor(spendableBalancePaisa / daysUntilAllowance)
        : null,
    reserveExceedsRemaining:
      essentialReservePaisa > Math.max(remainingBalancePaisa, 0),
    hasNegativeRemainingBalance: remainingBalancePaisa < 0,
  };
}
