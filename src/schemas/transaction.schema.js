import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "Food & Mess",
  "Hostel Rent",
  "Transport",
  "Shopping",
  "Education",
  "Mobile & Internet",
  "Entertainment",
  "Health",
  "Other",
];

export const INCOME_CATEGORIES = [
  "Extra Pocket Money",
  "Part-Time Work",
  "Gift",
  "Other Income",
];

export const TRANSACTION_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
];

export const MAX_TRANSACTION_AMOUNT_PKR = 100_000_000;

const typeSchema = z.enum(["income", "expense"]);
const categorySchema = z.enum(TRANSACTION_CATEGORIES);
const categorySourceSchema = z.enum(["manual", "ai"]);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid transaction date.")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const amountPaisaSchema = z
  .number()
  .finite("Enter a valid amount.")
  .positive("Amount must be greater than zero.")
  .max(MAX_TRANSACTION_AMOUNT_PKR, "Amount exceeds the maximum allowed value.")
  .refine((amount) => {
    const paisa = amount * 100;
    return (
      Number.isSafeInteger(Math.round(paisa)) &&
      Math.abs(paisa - Math.round(paisa)) < 1e-7
    );
  }, "Amount can have no more than two decimal places.")
  .transform((amount) => Math.round(amount * 100));

const transactionFields = {
  type: typeSchema,
  amount: amountPaisaSchema,
  description: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .max(200, "Description must be 200 characters or fewer."),
  category: categorySchema,
  date: dateSchema,
};

function validateCategoryForType(transaction, context) {
  const categories =
    transaction.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!categories.includes(transaction.category)) {
    context.addIssue({
      code: "custom",
      path: ["category"],
      message: `Choose a category valid for ${transaction.type}.`,
    });
  }
  if (transaction.categorySource === "ai" && transaction.type !== "expense") {
    context.addIssue({
      code: "custom",
      path: ["categorySource"],
      message: "AI category suggestions can only be used for expenses.",
    });
  }
}

export const transactionCreateSchema = z
  .object({
    ...transactionFields,
    categorySource: categorySourceSchema.optional(),
  })
  .strict()
  .superRefine(validateCategoryForType);

export const transactionPatchSchema = z
  .object({
    type: typeSchema.optional(),
    amount: amountPaisaSchema.optional(),
    description: transactionFields.description.optional(),
    category: categorySchema.optional(),
    date: dateSchema.optional(),
    categorySource: categorySourceSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update.",
  });

export const transactionQuerySchema = z
  .object({
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM format.")
      .optional(),
    category: categorySchema.optional(),
    type: typeSchema.optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).max(100_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict()
  .superRefine((filters, context) => {
    if (!filters.type || !filters.category) {
      return;
    }

    const allowed =
      filters.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!allowed.includes(filters.category)) {
      context.addIssue({
        code: "custom",
        path: ["category"],
        message: `Category is not valid for ${filters.type}.`,
      });
    }
  });