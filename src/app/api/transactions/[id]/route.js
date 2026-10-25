import mongoose from "mongoose";
import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  transactionCreateSchema,
  transactionPatchSchema,
} from "@/schemas/transaction.schema";

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

async function getContext(params) {
  const session = await auth();
  const userId = session?.user?.id;
  const { id } = await params;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    return {
      response: Response.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      ),
    };
  }
  if (!mongoose.isValidObjectId(id)) {
    return {
      response: Response.json(
        { success: false, message: "Invalid transaction ID." },
        { status: 400 },
      ),
    };
  }

  return { userId, id };
}

export async function PATCH(request, { params }) {
  try {
    const context = await getContext(params);
    if (context.response) {
      return context.response;
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

    const parsedPatch = transactionPatchSchema.safeParse(body);
    if (!parsedPatch.success) {
      return Response.json(
        {
          success: false,
          message: "Please enter valid transaction details.",
          errors: parsedPatch.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    await connectDB();
    const transaction = await Transaction.findOne({
      _id: context.id,
      userId: context.userId,
    });
    if (!transaction) {
      return Response.json(
        { success: false, message: "Transaction not found." },
        { status: 404 },
      );
    }

    const patch = parsedPatch.data;
    const updatedType = patch.type ?? transaction.type;
    if (patch.categorySource === "ai" && updatedType !== "expense") {
      return Response.json(
        {
          success: false,
          message: "AI category suggestions can only be used for expenses.",
        },
        { status: 400 },
      );
    }
    const validCategories =
      updatedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    let updatedCategory = patch.category ?? transaction.category;
    if (patch.type && !patch.category && !validCategories.includes(updatedCategory)) {
      updatedCategory = validCategories[0];
    }

    const merged = transactionCreateSchema.safeParse({
      type: updatedType,
      amount: patch.amount === undefined ? transaction.amountPaisa / 100 : patch.amount / 100,
      description: patch.description ?? transaction.description,
      category: updatedCategory,
      date: patch.date
        ? patch.date.toISOString().slice(0, 10)
        : transaction.date.toISOString().slice(0, 10),
    });
    if (!merged.success) {
      return Response.json(
        {
          success: false,
          message: "Please choose a category valid for the transaction type.",
          errors: merged.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    transaction.type = merged.data.type;
    transaction.amountPaisa = merged.data.amount;
    transaction.description = merged.data.description;
    transaction.category = merged.data.category;
    transaction.date = merged.data.date;
    transaction.categorySource =
      patch.categorySource ??
      (patch.category || patch.type
        ? "manual"
        : transaction.categorySource ?? "manual");
    await transaction.save();

    return Response.json({
      success: true,
      message: "Transaction updated successfully.",
      transaction: serializeTransaction(transaction),
    });
  } catch {
    return Response.json(
      { success: false, message: "Unable to update this transaction right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const context = await getContext(params);
    if (context.response) {
      return context.response;
    }

    await connectDB();
    const transaction = await Transaction.findOneAndDelete({
      _id: context.id,
      userId: context.userId,
    });
    if (!transaction) {
      return Response.json(
        { success: false, message: "Transaction not found." },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      message: "Transaction deleted successfully.",
      transaction: serializeTransaction(transaction),
    });
  } catch {
    return Response.json(
      { success: false, message: "Unable to delete this transaction right now." },
      { status: 500 },
    );
  }
}