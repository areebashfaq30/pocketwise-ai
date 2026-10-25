"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
];

function linkClass(isActive, compact = false) {
  return `rounded-lg px-3 py-2 text-sm font-medium transition ${
    compact ? "block" : "inline-flex items-center"
  } ${
    isActive
      ? "bg-emerald-50 text-emerald-800"
      : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
  }`;
}

export default function DashboardNavigation() {
  const pathname = usePathname();

  function renderLinks(compact = false) {
    return links.map(({ href, label }) => {
      const isActive =
        href === "/dashboard"
          ? pathname === href || pathname.startsWith("/dashboard/")
          : pathname === href || pathname.startsWith(`${href}/`);

      return (
        <Link
          aria-current={isActive ? "page" : undefined}
          className={linkClass(isActive, compact)}
          href={href}
          key={href}
        >
          {label}
        </Link>
      );
    });
  }

  return (
    <>
      <nav
        aria-label="Student navigation"
        className="hidden items-center gap-1 sm:flex"
      >
        {renderLinks()}
        <LogoutButton />
      </nav>
      <details className="group relative sm:hidden">
        <summary
          aria-label="Open student navigation"
          className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
        >
          <Menu size={18} aria-hidden="true" />
          Menu
        </summary>
        <nav
          aria-label="Student navigation"
          className="absolute right-0 top-12 z-50 flex w-52 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {renderLinks(true)}
          <div className="mt-1 border-t border-slate-100 pt-2">
            <LogoutButton />
          </div>
        </nav>
      </details>
    </>
  );
}
