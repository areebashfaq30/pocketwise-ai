import Link from "next/link";
import DashboardNavigation from "@/components/DashboardNavigation";

export default function StudentHeader({ userName }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <Link className="font-semibold text-slate-900" href="/dashboard">
            PocketWise AI
          </Link>
          <p className="truncate text-sm text-slate-600">Welcome, {userName}</p>
        </div>
        <DashboardNavigation />
      </div>
    </header>
  );
}
