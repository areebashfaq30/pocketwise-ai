import mongoose from "mongoose";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { transactionCreateSchema, transactionQuerySchema } from "@/schemas/transaction.schema";

export const runtime = "nodejs";

function serializeTransaction(transaction) {
  return {
    id: transaction._id.toString(),
    type: transaction.type,
    amountPaisa: transaction.amountPaisa,
    amount: transaction.amountPaisa / 100,
    description: transaction.description,
    category: transaction.category,
    date: new Date(transaction.date).toISOString().slice(0, 10),
    categorySource: transaction.categorySource,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

async function getAuthenticatedUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  return userId && mongoose.isValidObjectId(userId) ? userId : null;
}

function getDateRange(month) {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return { $gte: start, $lt: end };
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

    const url = new URL(request.url);
    const parsed = transactionQuerySchema.safeParse(
      Object.fromEntries(url.searchParams.entries()),
    );
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Invalid transaction filters.",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { month, category, type, search, page, pageSize } = parsed.data;
    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    if (month) {
      filter.date = getDateRange(month);
    }
    if (category) {
      filter.category = category;
    }
    if (type) {
      filter.type = type;
    }
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.description = { $regex: escapedSearch, $options: "i" };
    }

    await connectDB();
    const [records, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, createdAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      transactions: records.map(serializeTransaction),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch {
    return Response.json(
      { success: false, message: "Unable to load transactions right now." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
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

    const parsed = transactionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Please enter valid transaction details.",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    await connectDB();
    const transaction = await Transaction.create({
      userId,
      type: parsed.data.type,
      amountPaisa: parsed.data.amount,
      description: parsed.data.description,
      category: parsed.data.category,
      date: parsed.data.date,
      categorySource: parsed.data.categorySource ?? "manual",
    });

    return Response.json(
      {
        success: true,
        message: "Transaction created successfully.",
        transaction: serializeTransaction(transaction),
      },
      { status: 201 },
    );
  } catch {
    return Response.json(
      { success: false, message: "Unable to create this transaction right now." },
      { status: 500 },
    );
  }
}