import mongoose from "mongoose";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Budget from "@/models/Budget";
import {
  budgetInputSchema,
  budgetPlannerInputSchema,
  budgetQuerySchema,
} from "@/schemas/budget.schema";

export const runtime = "nodejs";

function serializeBudget(budget) {
  if (!budget) {
    return null;
  }

  return {
    id: budget._id.toString(),
    month: budget.month,
    monthlyAllowance: budget.monthlyAllowance,
    additionalMoney: budget.additionalMoney,
    spendingLimit: budget.spendingLimit,
    nextAllowanceDate: budget.nextAllowanceDate
      ? new Date(budget.nextAllowanceDate).toISOString().slice(0, 10)
      : null,
    essentialReservePaisa: budget.essentialReservePaisa ?? 0,
    currency: budget.currency,
  };
}

async function getAuthenticatedUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return null;
  }

  return userId;
}

export async function GET(request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return Response.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const parsedQuery = budgetQuerySchema.safeParse({
      month: searchParams.get("month"),
    });
    if (!parsedQuery.success) {
      return Response.json(
        {
          success: false,
          message: "A valid month in YYYY-MM format is required.",
        },
        { status: 400 },
      );
    }

    await connectDB();
    const budget = await Budget.findOne({
      userId,
      month: parsedQuery.data.month,
    }).lean();

    return Response.json({
      success: true,
      budget: serializeBudget(budget),
    });
  } catch {
    return Response.json(
      { success: false, message: "Unable to load this budget right now." },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return Response.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = budgetInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Please enter valid budget amounts and a valid month.",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    await connectDB();
    const { month, monthlyAllowance, additionalMoney, spendingLimit } =
      parsed.data;
    const filter = { userId, month };
    const update = {
      $set: { monthlyAllowance, additionalMoney, spendingLimit, currency: "PKR" },
      $setOnInsert: filter,
    };

    let budget;
    try {
      budget = await Budget.findOneAndUpdate(filter, update, {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }).lean();
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }

      budget = await Budget.findOneAndUpdate(filter, update, {
        new: true,
        runValidators: true,
      }).lean();
      if (!budget) {
        throw error;
      }
    }

    return Response.json({
      success: true,
      message: "Budget saved successfully.",
      budget: serializeBudget(budget),
    });
  } catch {
    return Response.json(
      { success: false, message: "Unable to save this budget right now." },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return Response.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { success: false, message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    const parsed = budgetPlannerInputSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Please enter a valid allowance date and unpaid essential reserve.",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    await connectDB();
    const { month, nextAllowanceDate, essentialReservePaisa } = parsed.data;
    const filter = { userId, month };
    const update = {
      $set: {
        nextAllowanceDate: nextAllowanceDate
          ? new Date(`${nextAllowanceDate}T00:00:00.000Z`)
          : null,
        essentialReservePaisa,
      },
      $setOnInsert: filter,
    };

    let budget;
    try {
      budget = await Budget.findOneAndUpdate(filter, update, {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }).lean();
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
      budget = await Budget.findOneAndUpdate(filter, update, {
        new: true,
        runValidators: true,
      }).lean();
      if (!budget) {
        throw error;
      }
    }

    return Response.json({
      success: true,
      message: "Survival Planner settings saved.",
      budget: serializeBudget(budget),
    });
  } catch {
    return Response.json(
      {
        success: false,
        message: "Unable to save Survival Planner settings right now.",
      },
      { status: 500 },
    );
  }
}