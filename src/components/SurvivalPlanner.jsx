"use client";

import { useState } from "react";
import { CalendarClock, Pencil, ShieldCheck } from "lucide-react";
import { getDateInFinanceTimeZone } from "@/lib/finance-date";
import { calculateSurvivalPlan } from "@/lib/survival-planner";

function formatPKR(paisa) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(paisa / 100);
}

function formatAllowanceDate(date) {
  if (!date) {
    return "Not set";
  }
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00.000Z`));
}

export default function SurvivalPlanner({
  month,
  budget,
  remainingBalancePaisa,
  fallbackDailySafeSpending,
  isCurrentMonth,
  onSaved,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nextAllowanceDate, setNextAllowanceDate] = useState(
    budget?.nextAllowanceDate ?? "",
  );
  const [essentialReserve, setEssentialReserve] = useState(
    ((budget?.essentialReservePaisa ?? 0) / 100).toFixed(2),
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const reservePaisa = budget?.essentialReservePaisa ?? 0;
  const today = getDateInFinanceTimeZone();
  const plan = calculateSurvivalPlan({
    remainingBalancePaisa,
    essentialReservePaisa: reservePaisa,
    nextAllowanceDate: budget?.nextAllowanceDate,
    today,
  });
  const hasPlannerSettings = Boolean(budget?.nextAllowanceDate);

  async function saveSettings(event) {
    event.preventDefault();
    setError("");
    setSavedMessage("");

    const reservePkr = Number(essentialReserve);
    const reserveMinorUnits = reservePkr * 100;
    if (
      !Number.isFinite(reservePkr) ||
      reservePkr < 0 ||
      !Number.isSafeInteger(Math.round(reserveMinorUnits)) ||
      Math.abs(reserveMinorUnits - Math.round(reserveMinorUnits)) >= 1e-7
    ) {
      setError("Enter a nonnegative reserve with no more than two decimal places.");
      return;
    }
    if (nextAllowanceDate && !/^\d{4}-\d{2}-\d{2}$/.test(nextAllowanceDate)) {
      setError("Choose a valid next allowance date.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/budget", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          nextAllowanceDate: nextAllowanceDate || null,
          essentialReservePaisa: Math.round(reserveMinorUnits),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to save planner settings.");
      }
      if (
        result.budget?.month !== month ||
        result.budget?.nextAllowanceDate !== (nextAllowanceDate || null) ||
        result.budget?.essentialReservePaisa !== Math.round(reserveMinorUnits)
      ) {
        throw new Error(
          "The server did not confirm the saved settings. Please reload and try again.",
        );
      }

      onSaved(result.budget);
      setNextAllowanceDate(result.budget.nextAllowanceDate ?? "");
      setEssentialReserve(
        ((result.budget.essentialReservePaisa ?? 0) / 100).toFixed(2),
      );
      setIsEditing(false);
      setSavedMessage("Survival Planner settings saved.");
    } catch (saveError) {
      setError(saveError.message || "Unable to save planner settings.");
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  if (!isCurrentMonth) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Pocket money survival planner
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This is a {month < today.slice(0, 7) ? "historical" : "future"} month.
          The live survival recommendation is only shown for the current month.
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="survival-planner-heading"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <ShieldCheck size={16} aria-hidden="true" />
            Pocket money survival planner
          </p>
          <h2
            className="mt-1 text-lg font-semibold text-slate-900"
            id="survival-planner-heading"
          >
            Make your money last
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Your remaining balance comes from this month&apos;s budget and
            recorded transactions. Reserve only essential costs you have not
            paid or recorded yet.
          </p>
        </div>
        {!isEditing && (
          <button
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-700 px-3.5 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
            type="button"
            onClick={() => {
              setError("");
              setNextAllowanceDate(budget?.nextAllowanceDate ?? "");
              setEssentialReserve((reservePaisa / 100).toFixed(2));
              setIsEditing(true);
            }}
          >
            {hasPlannerSettings ? (
              <Pencil size={16} aria-hidden="true" />
            ) : (
              <CalendarClock size={16} aria-hidden="true" />
            )}
            {hasPlannerSettings
              ? "Edit Survival Planner"
              : "Set Up Survival Planner"}
          </button>
        )}
      </div>

      {isEditing ? (
        <form className="mt-5 space-y-4" onSubmit={saveSettings}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Next allowance date
              <input
                className={inputClass}
                type="date"
                value={nextAllowanceDate}
                onChange={(event) => setNextAllowanceDate(event.target.value)}
              />
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Leave blank to use month-end guidance instead.
              </span>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Unpaid essential reserve (PKR)
              <input
                className={inputClass}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={essentialReserve}
                onChange={(event) => setEssentialReserve(event.target.value)}
                required
              />
            </label>
          </div>
          <p className="text-xs leading-5 text-slate-500">
            Include only essential costs that are still unpaid and not already
            entered as transactions.
          </p>
          {error && (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              type="button"
              onClick={() => {
                setNextAllowanceDate(budget?.nextAllowanceDate ?? "");
                setEssentialReserve((reservePaisa / 100).toFixed(2));
                setIsEditing(false);
                setError("");
              }}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          {savedMessage && (
            <p className="mt-4 text-sm text-emerald-700" role="status">
              {savedMessage}
            </p>
          )}
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-sm text-slate-600">Next allowance date</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {formatAllowanceDate(budget?.nextAllowanceDate)}
              </dd>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <dt className="text-sm text-slate-600">
                Unpaid essential reserve
              </dt>
              <dd className="mt-1 font-semibold text-amber-950">
                {formatPKR(reservePaisa)}
              </dd>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <dt className="text-sm text-slate-600">
                Remaining pocket money
              </dt>
              <dd
                className={`mt-1 font-semibold ${
                  remainingBalancePaisa < 0 ? "text-rose-700" : "text-slate-900"
                }`}
              >
                {formatPKR(remainingBalancePaisa)}
              </dd>
              <span className="mt-1 block text-xs text-slate-500">
                Read-only; based on recorded finances.
              </span>
            </div>
          </dl>

          {plan.status === "upcoming" ? (
            <div className="mt-4 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-600">Spendable balance</p>
                <p className="mt-1 text-lg font-semibold text-emerald-900">
                  {formatPKR(plan.spendableBalancePaisa)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  Spending days until allowance
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {plan.daysUntilAllowance}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">
                  Recommended daily spending limit
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-900">
                  {formatPKR(plan.dailySafeSpendingPaisa)}
                </p>
              </div>
              <p className="text-xs leading-5 text-slate-600 sm:col-span-3">
                Calculated in whole paisa using {plan.daysUntilAllowance} days:
                today is included and the allowance date is excluded. The
                displayed limit rounds down to avoid overspending.
              </p>
            </div>
          ) : plan.status === "due-today" ? (
            <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Your allowance is due today, so there are no spending days before
              it arrives. A daily limit is not calculated.
            </p>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                {plan.status === "overdue"
                  ? "The saved allowance date has passed. Update it for a current recommendation."
                  : plan.status === "invalid"
                    ? "The saved allowance date is invalid. Update it to calculate a personalized daily limit."
                    : "Add your next allowance date to calculate a personalized daily limit."}
              </p>
              {fallbackDailySafeSpending &&
                fallbackDailySafeSpending.monthRelation !== "past" && (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Month-end guidance fallback:{" "}
                    <span className="font-semibold text-slate-900">
                      {formatPKR(fallbackDailySafeSpending.amountPaisa)} per day
                    </span>
                    . This uses the existing month-end calculation and does not
                    subtract the reserve.
                  </p>
                )}
            </div>
          )}

          {plan.hasNegativeRemainingBalance && (
            <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              Your recorded expenses exceed the money currently available.
              There is no positive spendable balance; review your budget and
              transactions.
            </p>
          )}
          {plan.reserveExceedsRemaining && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Your unpaid essential reserve is greater than your remaining
              pocket money. No money is available for other spending.
            </p>
          )}
          {plan.spendableBalancePaisa === 0 &&
            !plan.hasNegativeRemainingBalance &&
            !plan.reserveExceedsRemaining && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No spendable balance remains after setting aside your essential
                reserve. A zero daily limit is a warning, not a sign that your
                finances are healthy.
              </p>
            )}
          {plan.status === "upcoming" &&
            fallbackDailySafeSpending?.amountPaisa > 0 &&
            plan.dailySafeSpendingPaisa <
              fallbackDailySafeSpending.amountPaisa && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Money may be running low: your allowance-date limit is below
                the usual month-end guidance.
              </p>
            )}
        </>
      )}
    </section>
  );
}
