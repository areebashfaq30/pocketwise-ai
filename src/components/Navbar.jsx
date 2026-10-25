import Link from "next/link";
import { ArrowRight, Menu, Wallet } from "lucide-react";

const linkClass =
  "text-sm font-medium text-slate-600 transition hover:text-emerald-700";

export default function Navbar({ isAuthenticated = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link
          className="inline-flex shrink-0 items-center gap-2.5 font-semibold tracking-tight text-slate-900"
          href="/"
          aria-label="PocketWise AI home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Wallet size={19} aria-hidden="true" />
          </span>
          <span>PocketWise AI</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          <Link className={linkClass} href="#features">
            Features
          </Link>
          <Link className={linkClass} href="#how-it-works">
            How It Works
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
              href="/dashboard"
            >
              Dashboard
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                href="/login"
              >
                Sign In
              </Link>
              <Link
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                href="/register"
              >
                Get Started
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </>
          )}
        </div>

        <details className="group relative md:hidden">
          <summary
            className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden"
            aria-label="Open navigation menu"
          >
            <Menu size={20} aria-hidden="true" />
          </summary>
          <nav
            aria-label="Mobile navigation"
            className="absolute right-0 top-12 z-50 flex w-64 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
          >
            <Link
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
              href="#features"
            >
              Features
            </Link>
            <Link
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
              href="#how-it-works"
            >
              How It Works
            </Link>
            {isAuthenticated ? (
              <Link
                className="mt-1 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                href="/dashboard"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-emerald-700"
                  href="/login"
                >
                  Sign In
                </Link>
                <Link
                  className="mt-1 rounded-lg bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  href="/register"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}