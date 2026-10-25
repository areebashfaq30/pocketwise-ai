"use client";

import { Pencil, Trash2 } from "lucide-react";

function formatPKR(paisa) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(paisa / 100);
}

export default function TransactionTable({
  transactions,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
  isDeleting,
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          No transactions found
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Add an income or expense to start building your history.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left">
          <thead className="bg-slate-50">
            <tr>
              {["Date", "Description", "Category", "Type", "Amount", "Actions"].map(
                (heading) => (
                  <th
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    key={heading}
                    scope="col"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((transaction) => (
              <tr className="hover:bg-slate-50/70" key={transaction.id}>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                  {new Date(`${transaction.date}T00:00:00`).toLocaleDateString(
                    undefined,
                    { year: "numeric", month: "short", day: "numeric" },
                  )}
                </td>
                <td className="max-w-56 px-4 py-4 text-sm font-medium text-slate-900">
                  <span className="block truncate">{transaction.description}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                  {transaction.category}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                      transaction.type === "income"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {transaction.type}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-4 text-sm font-semibold ${
                    transaction.type === "income"
                      ? "text-emerald-700"
                      : "text-slate-900"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatPKR(transaction.amountPaisa)}
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      aria-label={`Edit ${transaction.description}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      onClick={() => onEdit(transaction)}
                      type="button"
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                    <button
                      aria-label={`Delete ${transaction.description}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                      disabled={isDeleting === transaction.id}
                      onClick={() => onDelete(transaction)}
                      type="button"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
            transactions
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50"
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}