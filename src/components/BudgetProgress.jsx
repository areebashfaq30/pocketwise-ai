"use client";

import { AlertTriangle, CircleCheck, CircleX } from "lucide-react";

function formatPKR(paisa) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(paisa / 100);
}

export default function BudgetProgress({
  spendingLimitPaisa,
  expensesPaisa,
  hasBudget,
  onSetBudget,
}) {
  if (!hasBudget || spendingLimitPaisa <= 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Budget progress
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Set a monthly spending limit to track your budget usage. Your limit
          is a target and does not count as spending.
        </p>
        {onSetBudget && (
          <button
            className="mt-4 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            type="button"
            onClick={onSetBudget}
          >
            Set spending limit
          </button>
        )}
      </section>
    );
  }

  const remainingPaisa = spendingLimitPaisa - expensesPaisa;
  const percent = (expensesPaisa / spendingLimitPaisa) * 100;
  const exceeded = percent >= 100;
  const warning = percent >= 80 && !exceeded;
  const progress = Math.min(percent, 100);
  const tone = exceeded
    ? "bg-rose-600"
    : warning
      ? "bg-amber-500"
      : "bg-emerald-600";
  const Icon = exceeded ? CircleX : warning ? AlertTriangle : CircleCheck;
  const status = exceeded
    ? "Spending limit exceeded"
    : warning
      ? "Approaching spending limit"
      : "Within your spending plan";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Budget progress
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Based on recorded expenses only.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            exceeded
              ? "bg-rose-50 text-rose-700"
              : warning
                ? "bg-amber-50 text-amber-800"
                : "bg-emerald-50 text-emerald-800"
          }`}
        >
          <Icon size={14} aria-hidden="true" />
          {status}
        </span>
      </div>
      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight text-slate-900">
            {formatPKR(expensesPaisa)}
          </p>
          <p className="mt-1 text-sm text-slate-500">spent</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-700">
            {formatPKR(spendingLimitPaisa)}
          </p>
          <p className="mt-1 text-xs text-slate-500">monthly limit</p>
        </div>
      </div>
      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Monthly spending limit used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(Math.round(percent), 100)}
        aria-valuetext={`${Math.round(percent)} percent of spending limit used`}
      >
        <div
          className={`h-full rounded-full transition-all ${tone}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-700">
          {Math.round(percent)}% used
        </span>
        <span
          className={exceeded ? "font-medium text-rose-700" : "text-slate-500"}
        >
          {exceeded
            ? `${formatPKR(Math.abs(remainingPaisa))} over`
            : `${formatPKR(remainingPaisa)} remaining`}
        </span>
      </div>
    </section>
  );
}