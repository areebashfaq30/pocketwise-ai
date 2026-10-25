"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "#047857",
  "#059669",
  "#10b981",
  "#34d399",
  "#6ee7b7",
  "#0f766e",
  "#14b8a6",
  "#2dd4bf",
  "#a7f3d0",
];

function formatPKR(paisa) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(paisa / 100);
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-slate-900">{item.category}</p>
      <p className="mt-1 text-sm text-slate-600">{formatPKR(item.totalPaisa)}</p>
    </div>
  );
}

export default function ExpenseChart({ data }) {
  const totalPaisa = data.reduce((total, item) => total + item.totalPaisa, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Expenses by category
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Expense transactions for the selected month.
        </p>
      </div>
      {totalPaisa === 0 ? (
        <div className="flex min-h-64 items-center justify-center text-center">
          <p className="max-w-xs text-sm leading-6 text-slate-500">
            No expenses recorded this month. Expense categories will appear
            here when you add transactions.
          </p>
        </div>
      ) : (
        <>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="totalPaisa"
                  nameKey="category"
                  innerRadius="56%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="white"
                  strokeWidth={2}
                >
                  {data.map((item, index) => (
                    <Cell
                      key={item.category}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-sm font-semibold text-slate-700">
            Total expenses: {formatPKR(totalPaisa)}
          </p>
        </>
      )}
    </section>
  );
}