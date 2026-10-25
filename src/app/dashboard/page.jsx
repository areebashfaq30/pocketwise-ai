import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMonthlyDashboardData } from "@/lib/dashboard-data";
import { getMonthInFinanceTimeZone } from "@/lib/finance-date";
import { formatStudentName } from "@/models/User";
import BudgetDashboard from "@/components/BudgetDashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const initialMonth = getMonthInFinanceTimeZone();
  const initialData = await getMonthlyDashboardData(
    session.user.id,
    initialMonth,
  );

  return (
    <BudgetDashboard
      initialMonth={initialMonth}
      initialData={initialData}
      studentName={formatStudentName(session.user.name)}
    />
  );
}
