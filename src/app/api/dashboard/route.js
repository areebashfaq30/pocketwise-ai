import mongoose from "mongoose";
import { auth } from "@/auth";
import { getMonthlyDashboardData } from "@/lib/dashboard-data";
import { budgetQuerySchema } from "@/schemas/budget.schema";

export const runtime = "nodejs";

export async function GET(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return Response.json(
        { success: false, message: "Authentication required." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = budgetQuerySchema.safeParse({
      month: searchParams.get("month"),
    });
    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "A valid month in YYYY-MM format is required.",
        },
        { status: 400 },
      );
    }

    const data = await getMonthlyDashboardData(userId, parsed.data.month);
    return Response.json({ success: true, ...data });
  } catch {
    return Response.json(
      { success: false, message: "Unable to load the dashboard right now." },
      { status: 500 },
    );
  }
}