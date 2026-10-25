import mongoose from "mongoose";
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import connectDB from "@/lib/mongodb";
import {
  FINANCE_TIME_ZONE,
  getDayInFinanceTimeZone,
  getMonthInFinanceTimeZone,
} from "@/lib/finance-date";

function serializeTransaction(transaction) {
  return {
    id: transaction._id.toString(),
    type: transaction.type,
    amountPaisa: transaction.amountPaisa,
    description: transaction.description,
    category: transaction.category,
    date: new Date(transaction.date).toISOString().slice(0, 10),
  };
}

export async function getMonthlyDashboardData(
  userId,
  month,
  { includeRecentTransactions = true } = {},
) {
  await connectDB();

  const ownerId = new mongoose.Types.ObjectId(userId);
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  const daysInMonth = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const dateRange = { $gte: start, $lt: end };

  const [budgetRecord, totals, expenseCategoryTotals, dailyExpenseTotals, recentRecords] =
    await Promise.all([
    Budget.findOne({ userId: ownerId, month })
      .select(
        "month monthlyAllowance additionalMoney spendingLimit nextAllowanceDate essentialReservePaisa currency",
      )
      .lean(),
    Transaction.aggregate([
      { $match: { userId: ownerId, date: dateRange } },
      {
        $group: {
          _id: { type: "$type", category: "$category" },
          totalPaisa: { $sum: "$amountPaisa" },
        },
      },
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId: ownerId,
          date: dateRange,
          type: "expense",
        },
      },
      { $group: { _id: "$category", totalPaisa: { $sum: "$amountPaisa" } } },
      { $sort: { totalPaisa: -1, _id: 1 } },
    ]),
    Transaction.aggregate([
      {
        $match: {
          userId: ownerId,
          date: dateRange,
          type: "expense",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "UTC",
            },
          },
          totalPaisa: { $sum: "$amountPaisa" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    includeRecentTransactions
      ? Transaction.find({ userId: ownerId, date: dateRange })
          .sort({ date: -1, createdAt: -1, _id: -1 })
          .limit(5)
          .select("type amountPaisa description category date")
          .lean()
      : Promise.resolve([]),
  ]);

  const budget = budgetRecord
    ? {
        month: budgetRecord.month,
        monthlyAllowance: budgetRecord.monthlyAllowance,
        additionalMoney: budgetRecord.additionalMoney,
        spendingLimit: budgetRecord.spendingLimit,
        nextAllowanceDate: budgetRecord.nextAllowanceDate
          ? new Date(budgetRecord.nextAllowanceDate).toISOString().slice(0, 10)
          : null,
        essentialReservePaisa: budgetRecord.essentialReservePaisa ?? 0,
        currency: budgetRecord.currency,
      }
    : null;
  let recordedIncomePaisa = 0;
  let expensesPaisa = 0;
  for (const item of totals) {
    if (item._id.type === "expense") {
      expensesPaisa += item.totalPaisa;
    } else if (item._id.category === "Extra Pocket Money") {
      continue;
    } else {
      recordedIncomePaisa += item.totalPaisa;
    }
  }
  const monthlyAllowancePaisa = Math.round(
    (budget?.monthlyAllowance ?? 0) * 100,
  );
  const additionalMoneyPaisa = Math.round(
    (budget?.additionalMoney ?? 0) * 100,
  );
  const otherIncomePaisa = recordedIncomePaisa;
  const totalAvailablePaisa =
    monthlyAllowancePaisa + additionalMoneyPaisa + otherIncomePaisa;
  const remainingBalancePaisa = totalAvailablePaisa - expensesPaisa;
  const spendingLimitPaisa = Math.round((budget?.spendingLimit ?? 0) * 100);
  const utilizationPercent =
    spendingLimitPaisa > 0
      ? (expensesPaisa / spendingLimitPaisa) * 100
      : null;
  const alerts = [];
  if (utilizationPercent !== null && utilizationPercent >= 100) {
    alerts.push({
      code: "budget-exceeded",
      level: "danger",
      message: "You have reached or exceeded your monthly spending limit.",
    });
  } else if (utilizationPercent !== null && utilizationPercent >= 80) {
    alerts.push({
      code: "budget-warning",
      level: "warning",
      message: "You have used at least 80% of your monthly spending limit.",
    });
  }
  if (
    remainingBalancePaisa <= 0 &&
    (budget || totalAvailablePaisa !== 0 || expensesPaisa > 0)
  ) {
    alerts.push({
      code: "balance-depleted",
      level: "danger",
      message: "Your remaining balance is zero or below.",
    });
  }

  const currentMonth = getMonthInFinanceTimeZone();
  const monthRelation =
    month === currentMonth ? "current" : month < currentMonth ? "past" : "future";
  const remainingDays =
    monthRelation === "current"
      ? daysInMonth - getDayInFinanceTimeZone() + 1
      : monthRelation === "future"
        ? daysInMonth
        : null;
  const dailySafeSpendingPaisa =
    remainingDays === null
      ? null
      : Math.floor(Math.max(remainingBalancePaisa, 0) / remainingDays);
  const dailySpendingMap = new Map(
    dailyExpenseTotals.map((item) => [item._id, item.totalPaisa]),
  );
  const dailySpending = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, "0")}`;
    return {
      date,
      day,
      totalPaisa: dailySpendingMap.get(date) ?? 0,
    };
  });

  return {
    budget,
    summary: {
      monthlyAllowancePaisa,
      additionalMoneyPaisa,
      otherIncomePaisa,
      expensesPaisa,
      totalAvailablePaisa,
      remainingBalancePaisa,
      spendingLimitPaisa,
      budgetUtilizationPercent: utilizationPercent,
    },
    expenseCategoryTotals: expenseCategoryTotals.map((item) => ({
      category: item._id,
      totalPaisa: item.totalPaisa,
    })),
    dailySpending,
    alerts,
    dailySafeSpending: {
      amountPaisa: dailySafeSpendingPaisa,
      remainingDays,
      monthRelation,
      timeZone: FINANCE_TIME_ZONE,
    },
    recentTransactions: recentRecords.map(serializeTransaction),
  };
}
