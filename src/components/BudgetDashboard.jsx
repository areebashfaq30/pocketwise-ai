"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Pencil,
  Plus,
  Receipt,
} from "lucide-react";
import BudgetSetup from "@/components/BudgetSetup";
import BudgetProgress from "@/components/BudgetProgress";
import AIInsights from "@/components/AIInsights";
import ExpenseChart from "@/components/ExpenseChart";
import SpendingTrendChart from "@/components/SpendingTrendChart";
import SurvivalPlanner from "@/components/SurvivalPlanner";
import { getMonthInFinanceTimeZone } from "@/lib/finance-date";

function formatPKR(paisa) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(paisa / 100);
}

export default function BudgetDashboard({
  initialMonth,
  initialData,
  studentName,
}) {
  const [month, setMonth] = useState(initialMonth);
  const [budget, setBudget] = useState(initialData.budget);
  const [summary, setSummary] = useState(initialData.summary);
  const [expenseCategoryTotals, setExpenseCategoryTotals] = useState(
    initialData.expenseCategoryTotals,
  );
  const [dailySpending, setDailySpending] = useState(initialData.dailySpending);
  const [alerts, setAlerts] = useState(initialData.alerts);
  const [dailySafeSpending, setDailySafeSpending] = useState(
    initialData.dailySafeSpending,
  );
  const [recentTransactions, setRecentTransactions] = useState(
    initialData.recentTransactions,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const initialMonthRef = useRef(initialMonth);
  const selectedMonthRef = useRef(initialMonth);
  const aiInsightsKey = JSON.stringify({
    month,
    budget,
    summary,
    expenseCategoryTotals,
  });

  useEffect(() => {
    selectedMonthRef.current = month;
  }, [month]);

  useEffect(() => {
    const skipInitialLoad = initialMonthRef.current === month;
    if (skipInitialLoad) {
      initialMonthRef.current = null;
    }

    const controller = new AbortController();
    async function loadBudget() {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/dashboard?month=${encodeURIComponent(month)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Unable to load this dashboard.");
        }

        if (selectedMonthRef.current === month) {
          setBudget(result.budget);
          setSummary(result.summary);
          setExpenseCategoryTotals(result.expenseCategoryTotals);
          setDailySpending(result.dailySpending);
          setAlerts(result.alerts);
          setDailySafeSpending(result.dailySafeSpending);
          setRecentTransactions(result.recentTransactions);
          setIsEditing(false);
          setSavedNotice("");
        }
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message || "Unable to load this dashboard.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    if (!skipInitialLoad) {
      loadBudget();
    }
    window.addEventListener("focus", loadBudget);
    window.addEventListener("pageshow", loadBudget);
    return () => {
      controller.abort();
      window.removeEventListener("focus", loadBudget);
      window.removeEventListener("pageshow", loadBudget);
    };
  }, [month]);

  async function handleSaved(savedBudget) {
    setBudget(savedBudget);
    const monthlyAllowancePaisa = Math.round(
      savedBudget.monthlyAllowance * 100,
    );
    const additionalMoneyPaisa = Math.round(savedBudget.additionalMoney * 100);
    setSummary((current) => ({
      ...current,
      monthlyAllowancePaisa,
      additionalMoneyPaisa,
      totalAvailablePaisa:
        monthlyAllowancePaisa +
        additionalMoneyPaisa +
        current.otherIncomePaisa,
      remainingBalancePaisa:
        monthlyAllowancePaisa +
        additionalMoneyPaisa +
        current.otherIncomePaisa -
        current.expensesPaisa,
    }));
    setSavedNotice(`Budget saved for ${savedBudget.month}.`);
    setIsEditing(false);

    try {
      const response = await fetch(
        `/api/dashboard?month=${encodeURIComponent(month)}`,
        { cache: "no-store" },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to refresh dashboard analytics.");
      }
      setBudget(result.budget);
      setSummary(result.summary);
      setExpenseCategoryTotals(result.expenseCategoryTotals);
      setDailySpending(result.dailySpending);
      setAlerts(result.alerts);
      setDailySafeSpending(result.dailySafeSpending);
      setRecentTransactions(result.recentTransactions);
    } catch (refreshError) {
      setError(refreshError.message || "Unable to refresh dashboard analytics.");
    }
  }

  function handlePlannerSaved(savedBudget) {
    if (savedBudget.month !== selectedMonthRef.current) {
      return;
    }

    setBudget(savedBudget);
    setSavedNotice(`Survival Planner settings saved for ${savedBudget.month}.`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Monthly pocket money
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            {studentName
              ? `Your finances, ${studentName}`
              : "Your monthly overview"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Monthly overview for {month}. All analytics use your recorded data.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-1 flex items-center gap-2">
              <CalendarDays size={16} aria-hidden="true" />
              Select month
            </span>
            <input
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              type="month"
              value={month}
              required
              onChange={(event) => {
                const selectedMonth = event.target.value;
                if (selectedMonth) {
                  setSavedNotice("");
                  setBudget(null);
                  setSummary(null);
                  setExpenseCategoryTotals([]);
                  setDailySpending([]);
                  setAlerts([]);
                  setDailySafeSpending(null);
                  setRecentTransactions([]);
                  setIsEditing(false);
                  selectedMonthRef.current = selectedMonth;
                  setMonth(selectedMonth);
                }
              }}
            />
          </label>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            aria-expanded={isEditing}
            aria-controls="pocket-money-setup"
          >
            <Pencil size={16} aria-hidden="true" />
            {budget ? "Edit Pocket Money" : "Set Pocket Money"}
          </button>
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            href="/transactions"
          >
            <Receipt size={16} aria-hidden="true" />
            Transactions
          </Link>
        </div>
      </div>

      {savedNotice && (
        <p
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          role="status"
        >
          {savedNotice}
        </p>
      )}

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {isEditing && !isLoading && (
        <div id="pocket-money-setup">
          <BudgetSetup
            key={`${month}-${budget?.id ?? "new"}`}
            budget={budget}
            month={month}
            onSaved={handleSaved}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      )}

      {isLoading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading this month&apos;s overview...
        </p>
      ) : summary ? (
        <section aria-label="Monthly budget summary">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {budget ? `Budget for ${budget.month}` : `Overview for ${month}`}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Available money is allowance plus additional money. No expenses
                are included.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[
              ["Monthly allowance", summary.monthlyAllowancePaisa],
              ["Additional pocket money", summary.additionalMoneyPaisa],
              ["Other recorded income", summary.otherIncomePaisa],
              ["Total available", summary.totalAvailablePaisa],
              ["Total expenses", summary.expensesPaisa],
              ["Remaining balance", summary.remainingBalancePaisa],
              ["Monthly spending limit", summary.spendingLimitPaisa],
            ].map(([label, amount]) => (
              <article
                className={`min-w-0 rounded-2xl border p-3.5 sm:p-5 ${
                  label === "Total available"
                    ? "border-emerald-200 bg-emerald-50/70"
                    : label === "Remaining balance"
                      ? "border-emerald-300 bg-white shadow-sm"
                      : label === "Monthly spending limit"
                        ? "border-slate-300 bg-slate-50/70"
                        : "border-slate-200 bg-white"
                }`}
                key={label}
              >
                <p className="text-xs leading-5 text-slate-600 sm:text-sm">
                  {label}
                </p>
                <p className="mt-1.5 break-words text-base font-semibold tracking-tight text-slate-900 sm:mt-2 sm:text-xl">
                  {formatPKR(amount)}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Other recorded income excludes transactions categorized as Extra
            Pocket Money to avoid counting amounts already entered in your
            budget twice.
          </p>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <BudgetProgress
              spendingLimitPaisa={summary.spendingLimitPaisa}
              expensesPaisa={summary.expensesPaisa}
              hasBudget={Boolean(budget)}
              onSetBudget={() => setIsEditing(true)}
            />
            <SurvivalPlanner
              key={month}
              month={month}
              budget={budget}
              remainingBalancePaisa={summary.remainingBalancePaisa}
              fallbackDailySafeSpending={dailySafeSpending}
              isCurrentMonth={month === getMonthInFinanceTimeZone()}
              onSaved={handlePlannerSaved}
            />
          </div>

          {alerts.length > 0 && (
            <section
              className="mt-6 space-y-2"
              aria-label="Budget alerts"
              aria-live="polite"
            >
              {alerts.map((alert) => (
                <p
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    alert.level === "danger"
                      ? "border-rose-200 bg-rose-50 text-rose-800"
                      : "border-amber-200 bg-amber-50 text-amber-900"
                  }`}
                  key={alert.code}
                >
                  {alert.message}
                </p>
              ))}
            </section>
          )}

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <ExpenseChart data={expenseCategoryTotals} />
            <SpendingTrendChart data={dailySpending} month={month} />
          </div>

          <div className="mt-6">
            <AIInsights key={aiInsightsKey} month={month} />
          </div>

          {!budget && (
            <section className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-5">
              <h2 className="font-semibold text-slate-900">
                No pocket money budget for {month}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Add your allowance and any additional pocket money. Income and
                expenses below reflect only recorded transactions.
              </p>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                <Plus size={16} aria-hidden="true" />
                Set Pocket Money
              </button>
            </section>
          )}
          {budget && (
            <>
              <p className="mt-3 text-sm text-slate-500">
                Spending limit target: {formatPKR(Math.round(budget.spendingLimit * 100))}
                . It is a planning target, not an expense.
              </p>
              {budget.spendingLimit * 100 > summary.totalAvailablePaisa && (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Your spending limit is higher than total available money.
                </p>
              )}
            </>
          )}

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Recent transactions
              </h2>
              <Link
                className="text-sm font-semibold text-emerald-700 hover:underline"
                href="/transactions"
              >
                View all
              </Link>
            </div>
            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                {recentTransactions.map((transaction) => (
                  <div
                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    key={transaction.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          transaction.type === "income"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {transaction.type === "income" ? (
                          <ArrowDownLeft size={18} aria-hidden="true" />
                        ) : (
                          <ArrowUpRight size={18} aria-hidden="true" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-slate-500">
                          {transaction.category} · {transaction.date}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        transaction.type === "income"
                          ? "text-emerald-700"
                          : "text-slate-900"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatPKR(transaction.amountPaisa)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                No transactions recorded for this month.
              </p>
            )}
          </div>
        </section>
      ) : null}

    </div>
  );
}
