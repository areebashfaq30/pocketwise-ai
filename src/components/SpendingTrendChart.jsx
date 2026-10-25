"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatPKR(paisa) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(paisa / 100);
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-500">Day {label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">
        {formatPKR(payload[0].value)}
      </p>
    </div>
  );
}

export default function SpendingTrendChart({ data, month }) {
  const hasExpenses = data.some((item) => item.totalPaisa > 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Daily spending trend
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Expense totals by calendar day for {month}.
        </p>
      </div>
      {!hasExpenses ? (
        <div className="flex min-h-64 items-center justify-center text-center">
          <p className="max-w-xs text-sm leading-6 text-slate-500">
            No daily spending to chart yet. Only recorded expenses appear here.
          </p>
        </div>
      ) : (
        <div
          className="mt-4 h-64 w-full"
          role="img"
          aria-label={`Daily recorded expense totals for ${month}`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 12, left: 4, bottom: 4 }}
            >
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickFormatter={(paisa) =>
                  new Intl.NumberFormat("en-PK", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(paisa / 100)
                }
                width={52}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="totalPaisa"
                name="Expenses"
                stroke="#047857"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "#047857" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
