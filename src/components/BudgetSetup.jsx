"use client";

import { useState } from "react";

const MAX_AMOUNT = 100_000_000;

export default function BudgetSetup({ month, budget, onSaved, onCancel }) {
  const [form, setForm] = useState({
    monthlyAllowance: budget?.monthlyAllowance?.toString() ?? "",
    additionalMoney: budget?.additionalMoney?.toString() ?? "",
    spendingLimit: budget?.spendingLimit?.toString() ?? "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const parsedAmounts = Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, Number(value)]),
  );
  const availableMinor =
    Math.round((parsedAmounts.monthlyAllowance || 0) * 100) +
    Math.round((parsedAmounts.additionalMoney || 0) * 100);
  const spendingLimitMinor = Math.round(
    (parsedAmounts.spendingLimit || 0) * 100,
  );
  const showLimitWarning =
    Number.isFinite(spendingLimitMinor) &&
    Number.isFinite(availableMinor) &&
    spendingLimitMinor > availableMinor;

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: "" }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccess("");

    const errors = {};
    for (const [field, value] of Object.entries(form)) {
      if (value.trim() === "") {
        errors[field] = "Enter an amount.";
        continue;
      }

      const amount = Number(value);
      if (!Number.isFinite(amount) || amount < 0 || amount > MAX_AMOUNT) {
        errors[field] = "Enter a valid nonnegative amount.";
      } else if (
        Math.abs(amount * 100 - Math.round(amount * 100)) >= 1e-7
      ) {
        errors[field] = "Use no more than two decimal places.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          monthlyAllowance: Number(form.monthlyAllowance),
          additionalMoney: Number(form.additionalMoney),
          spendingLimit: Number(form.spendingLimit),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        const nextFieldErrors = {};
        for (const item of result.errors ?? []) {
          nextFieldErrors[item.field] = item.message;
        }
        setFieldErrors(nextFieldErrors);
        setError(result.message || "Unable to save this budget.");
        return;
      }

      onSaved(result.budget);
      setSuccess("Budget saved successfully.");
    } catch {
      setError("Unable to connect right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  const fields = [
    {
      name: "monthlyAllowance",
      label: "Monthly allowance (PKR)",
      description: "Your usual pocket money for this month.",
    },
    {
      name: "additionalMoney",
      label: "Additional pocket money (PKR)",
      description: "Any extra money available this month.",
    },
    {
      name: "spendingLimit",
      label: "Monthly spending limit (PKR)",
      description: "Your planned limit; this is not actual spending.",
    },
  ];
  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
      onSubmit={handleSubmit}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {budget ? "Edit pocket money" : "Set your pocket money"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter your amounts for {month}. All values are in PKR.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ name, label, description }) => (
          <label
            className="block text-sm font-medium text-slate-700"
            key={name}
          >
            {label}
            <input
              className={inputClass}
              name={name}
              type="number"
              inputMode="decimal"
              min="0"
              max={MAX_AMOUNT}
              step="0.01"
              value={form[name]}
              onChange={updateField}
              aria-describedby={fieldErrors[name] ? `${name}-error` : undefined}
              required
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              {description}
            </span>
            {fieldErrors[name] && (
              <span
                className="mt-1 block text-sm text-red-600"
                id={`${name}-error`}
              >
                {fieldErrors[name]}
              </span>
            )}
          </label>
        ))}
      </div>

      {showLimitWarning && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Your spending limit is higher than your total available pocket money.
          You can still save it if that is intentional.
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-4 text-sm text-emerald-700" role="status">
          {success}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          type="button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
