import { z } from "zod";

export const MAX_BUDGET_AMOUNT = 100_000_000;

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM format.");

const amountSchema = z
  .number()
  .finite("Enter a valid amount.")
  .min(0, "Amount cannot be negative.")
  .max(MAX_BUDGET_AMOUNT, "Amount exceeds the maximum allowed value.")
  .refine((amount) => {
    const minorUnits = amount * 100;
    return Math.abs(minorUnits - Math.round(minorUnits)) < 1e-7;
  }, "Amount can have no more than two decimal places.");

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid date.");

export const budgetQuerySchema = z.object({
  month: monthSchema,
});

export const budgetInputSchema = z
  .object({
    month: monthSchema,
    monthlyAllowance: amountSchema,
    additionalMoney: amountSchema,
    spendingLimit: amountSchema,
  })
  .strict();

export const budgetPlannerInputSchema = z
  .object({
    month: monthSchema,
    nextAllowanceDate: dateOnlySchema.nullable(),
    essentialReservePaisa: z
      .number()
      .int("Reserve must be a whole number of paisa.")
      .nonnegative("Reserve cannot be negative.")
      .refine(Number.isSafeInteger, "Reserve must be a safe integer."),
  })
  .strict();