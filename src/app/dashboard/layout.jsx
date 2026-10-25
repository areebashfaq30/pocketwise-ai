import { redirect } from "next/navigation";
import { auth } from "@/auth";
import StudentHeader from "@/components/StudentHeader";
import { formatStudentName } from "@/models/User";

export default async function DashboardLayout({ children }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <StudentHeader userName={formatStudentName(session.user.name)} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}