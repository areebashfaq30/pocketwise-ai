"use client";

import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import ExpenseForm from "@/components/ExpenseForm";
import TransactionTable from "@/components/TransactionTable";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_CATEGORIES,
} from "@/schemas/transaction.schema";

const EMPTY_PAGINATION = { page: 1, pageSize: 20, total: 0, totalPages: 0 };

export default function TransactionManager({ initialMonth }) {
  const [month, setMonth] = useState(initialMonth);
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTransactions() {
      setIsLoading(true);
      setError("");
      const params = new URLSearchParams({
        month,
        page: String(page),
        pageSize: "20",
      });
      if (type) params.set("type", type);
      if (category) params.set("category", category);
      if (search.trim()) params.set("search", search.trim());

      try {
        const response = await fetch(`/api/transactions?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Unable to load transactions.");
        }
        setTransactions(result.transactions);
        setPagination(result.pagination);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message || "Unable to load transactions.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadTransactions();
    return () => controller.abort();
  }, [month, type, category, search, page, refreshKey]);

  function closeForm() {
    setIsFormOpen(false);
    setEditingTransaction(null);
    setFormError("");
  }

  async function saveTransaction(values) {
    setIsSaving(true);
    setFormError("");
    try {
      const response = await fetch(
        editingTransaction
          ? `/api/transactions/${editingTransaction.id}`
          : "/api/transactions",
        {
          method: editingTransaction ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        const fieldMessage = result.errors?.[0]?.message;
        setFormError(fieldMessage || result.message || "Unable to save transaction.");
        return;
      }

      closeForm();
      setPage(1);
      setRefreshKey((current) => current + 1);
    } catch {
      setFormError("Unable to connect right now. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function editTransaction(transaction) {
    setEditingTransaction(transaction);
    setFormError("");
    setIsFormOpen(true);
  }

  async function deleteTransaction(transaction) {
    if (!window.confirm(`Delete "${transaction.description}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(transaction.id);
    setError("");
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to delete transaction.");
      }
      setPage(1);
      setRefreshKey((current) => current + 1);
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete transaction.");
    } finally {
      setDeletingId("");
    }
  }

  const categories = type
    ? type === "income"
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES
    : TRANSACTION_CATEGORIES;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            Income &amp; expenses
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Transaction history
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Record money coming in and going out. Each amount is kept precise to
            the nearest paisa.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:self-auto"
          type="button"
          onClick={() => {
            setEditingTransaction(null);
            setFormError("");
            setIsFormOpen(true);
          }}
        >
          <Plus size={18} aria-hidden="true" />
          Add Transaction
        </button>
      </div>

      {isFormOpen && (
        <ExpenseForm
          key={editingTransaction?.id ?? "new"}
          transaction={editingTransaction}
          onSubmit={saveTransaction}
          onCancel={closeForm}
          isSaving={isSaving}
          error={formError}
        />
      )}

      <section aria-label="Transaction filters">
        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm font-medium text-slate-700">
            Month
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              type="month"
              value={month}
              required
              onChange={(event) => {
                if (event.target.value) {
                  setMonth(event.target.value);
                  setPage(1);
                }
              }}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Type
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setCategory("");
                setPage(1);
              }}
            >
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Category
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Search description
            <span className="relative mt-1 block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
                aria-hidden="true"
              />
              <input
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-slate-900"
                type="search"
                maxLength={100}
                placeholder="Search transactions"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </span>
          </label>
        </div>
      </section>

      {error && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading transactions...
        </p>
      ) : (
        <TransactionTable
          transactions={transactions}
          pagination={pagination}
          onEdit={editTransaction}
          onDelete={deleteTransaction}
          onPageChange={setPage}
          isDeleting={deletingId}
        />
      )}
    </div>
  );
}
