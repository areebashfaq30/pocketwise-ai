import mongoose from "mongoose";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_CATEGORIES,
} from "@/schemas/transaction.schema";

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amountPaisa: {
      type: Number,
      required: true,
      min: 1,
      max: 10_000_000_000,
      validate: {
        validator: Number.isSafeInteger,
        message: "Amount must be a whole number of paisa.",
      },
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: TRANSACTION_CATEGORIES,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    categorySource: {
      type: String,
      enum: ["manual", "ai"],
      default: "manual",
      required: true,
    },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1, date: -1 });

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export { EXPENSE_CATEGORIES, INCOME_CATEGORIES };
export default Transaction;
