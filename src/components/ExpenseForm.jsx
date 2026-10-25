"use client";

import { useRef, useState } from "react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/schemas/transaction.schema";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({
  transaction,
  onSubmit,
  onCancel,
  isSaving,
  error,
}) {
  const [form, setForm] = useState(() => ({
    type: transaction?.type ?? "expense",
    amount: transaction ? String(transaction.amount) : "",
    description: transaction?.description ?? "",
    category: transaction?.category ?? EXPENSE_CATEGORIES[0],
    date: transaction?.date ?? getToday(),
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [categorySource, setCategorySource] = useState(
    transaction?.categorySource ?? "manual",
  );
  const [suggestion, setSuggestion] = useState("");
  const [suggestionError, setSuggestionError] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const manuallySelectedCategory = useRef(
    Boolean(transaction && (transaction.categorySource ?? "manual") === "manual"),
  );
  const descriptionRef = useRef(form.description);
  const suggestionRequestRef = useRef(0);

  const categories =
    form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function updateField(event) {
    const { name, value } = event.target;
    if (name === "description") {
      descriptionRef.current = value;
      suggestionRequestRef.current += 1;
      setSuggestion("");
      setSuggestionError("");
      setCategorySource("manual");
    }
    if (name === "category") {
      setCategorySource("manual");
      manuallySelectedCategory.current = true;
    }
    if (name === "type") {
      setCategorySource("manual");
      setSuggestion("");
      setSuggestionError("");
      manuallySelectedCategory.current = false;
    }
    setForm((current) => {
      const updated = { ...current, [name]: value };
      if (name === "type") {
        const nextCategories =
          value === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        if (!nextCategories.includes(current.category)) {
          updated.category = nextCategories[0];
        }
      }
      return updated;
    });
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  }

  async function requestCategorySuggestion() {
    const description = form.description.trim();
    if (!description) {
      setFieldErrors({ description: "Enter a description before requesting a suggestion." });
      return;
    }

    const requestId = suggestionRequestRef.current + 1;
    suggestionRequestRef.current = requestId;
    descriptionRef.current = description;
    setIsSuggesting(true);
    setSuggestionError("");
    setSuggestion("");

    try {
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.message || "AI category suggestions are unavailable right now.",
        );
      }
      if (
        suggestionRequestRef.current === requestId &&
        descriptionRef.current.trim() === description
      ) {
        setSuggestion(result.category);
      }
    } catch (requestError) {
      if (suggestionRequestRef.current === requestId) {
        setSuggestionError(
          requestError.message ||
            "AI category suggestions are unavailable. You can still choose a category.",
        );
      }
    } finally {
      if (suggestionRequestRef.current === requestId) {
        setIsSuggesting(false);
      }
    }
  }

  function acceptSuggestion() {
    if (!suggestion) {
      return;
    }
    if (
      manuallySelectedCategory.current &&
      form.category !== suggestion &&
      !window.confirm(
        `Replace your selected category "${form.category}" with the AI suggestion "${suggestion}"?`,
      )
    ) {
      return;
    }

    setForm((current) => ({ ...current, category: suggestion }));
    setCategorySource("ai");
    manuallySelectedCategory.current = false;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldErrors({});
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldErrors({ amount: "Enter an amount greater than zero." });
      return;
    }
    if (Math.abs(amount * 100 - Math.round(amount * 100)) >= 1e-7) {
      setFieldErrors({ amount: "Use no more than two decimal places." });
      return;
    }
    if (!form.description.trim()) {
      setFieldErrors({ description: "Description is required." });
      return;
    }

    await onSubmit({
      ...form,
      amount,
      description: form.description.trim(),
      categorySource:
        form.type === "expense" ? categorySource : "manual",
    });
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <form
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          {transaction ? "Edit transaction" : "Add transaction"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter the amount in PKR. It will be stored precisely in paisa.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-700">Type</legend>
        <div className="mt-2 flex gap-2">
          {["expense", "income"].map((type) => (
            <label
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium capitalize transition ${
                form.type === type
                  ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
              key={type}
            >
              <input
                className="sr-only"
                type="radio"
                name="type"
                value={type}
                checked={form.type === type}
                onChange={updateField}
              />
              {type}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Amount (PKR)
          <input
            className={inputClass}
            name="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            max="100000000"
            step="0.01"
            value={form.amount}
            onChange={updateField}
            required
            aria-invalid={Boolean(fieldErrors.amount)}
            aria-describedby={fieldErrors.amount ? "amount-error" : undefined}
          />
          {fieldErrors.amount && (
            <span className="mt-1 block text-sm text-red-600" id="amount-error">
              {fieldErrors.amount}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Category
          <select
            className={inputClass}
            name="category"
            value={form.category}
            onChange={updateField}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        {form.type === "expense" && (
          <div className="sm:col-span-2">
            <button
              className="rounded-lg border border-emerald-700 px-3.5 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
              type="button"
              onClick={requestCategorySuggestion}
              disabled={isSuggesting || isSaving}
            >
              {isSuggesting ? "Suggesting category..." : "Suggest Category with AI"}
            </button>
            {suggestion && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <p className="text-slate-700">
                  AI suggestion: <span className="font-semibold">{suggestion}</span>
                </p>
                <button
                  className="font-semibold text-emerald-700 underline underline-offset-2"
                  type="button"
                  onClick={acceptSuggestion}
                  disabled={isSaving}
                >
                  Accept suggestion
                </button>
              </div>
            )}
            {suggestionError && (
              <p className="mt-2 text-sm text-amber-800" role="status">
                {suggestionError} Manual categorization is still available.
              </p>
            )}
          </div>
        )}

        <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
          Description
          <input
            className={inputClass}
            name="description"
            type="text"
            maxLength={200}
            value={form.description}
            onChange={updateField}
            required
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={
              fieldErrors.description ? "description-error" : undefined
            }
          />
          {fieldErrors.description && (
            <span
              className="mt-1 block text-sm text-red-600"
              id="description-error"
            >
              {fieldErrors.description}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Date
          <input
            className={inputClass}
            name="date"
            type="date"
            value={form.date}
            onChange={updateField}
            required
          />
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : transaction ? "Save Changes" : "Save Transaction"}
        </button>
        <button
          className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
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