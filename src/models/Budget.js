import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
    },
    monthlyAllowance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100_000_000,
    },
    additionalMoney: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100_000_000,
    },
    spendingLimit: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      max: 100_000_000,
    },
    nextAllowanceDate: {
      type: Date,
      default: null,
    },
    essentialReservePaisa: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isSafeInteger,
        message: "Essential reserve must be a nonnegative safe integer in paisa.",
      },
    },
    currency: {
      type: String,
      required: true,
      default: "PKR",
      enum: ["PKR"],
    },
  },
  { timestamps: true },
);

budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

const Budget = mongoose.models.Budget || mongoose.model("Budget", budgetSchema);

export default Budget;
