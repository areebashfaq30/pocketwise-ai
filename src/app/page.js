import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Building2,
  CalendarDays,
  ChartPie,
  Check,
  CircleDollarSign,
  GraduationCap,
  HandCoins,
  Lightbulb,
  Receipt,
  Sparkles,
  Wallet,
} from "lucide-react";
import { auth } from "@/auth";
import Navbar from "@/components/Navbar";

const features = [
  {
    icon: HandCoins,
    title: "Pocket Money Tracking",
    description:
      "Keep your monthly allowance in view and know what you have to work with.",
  },
  {
    icon: Receipt,
    title: "Daily Expense Management",
    description:
      "Record everyday spending, from cafeteria lunches to campus essentials.",
  },
  {
    icon: ChartPie,
    title: "Monthly Budget Planning",
    description:
      "Set a budget that fits student life and keep an eye on your progress.",
  },
  {
    icon: Sparkles,
    title: "AI Expense Categorization",
    description:
      "Get a category suggestion while recording an expense, then review it before saving.",
  },
  {
    icon: Lightbulb,
    title: "AI Spending Insights",
    description:
      "Generate a monthly summary and practical recommendations from your spending.",
  },
  {
    icon: BellRing,
    title: "Smart Budget Alerts",
    description:
      "See a clear alert when recorded spending reaches or exceeds your monthly plan.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description: "Sign up in a moment and set up your personal student account.",
  },
  {
    number: "02",
    title: "Set Your Monthly Pocket Money",
    description: "Add the allowance or monthly amount you want to keep track of.",
  },
  {
    number: "03",
    title: "Track Daily Expenses",
    description: "Log your spending as you go to build a clearer picture.",
  },
  {
    number: "04",
    title: "Understand Spending with AI",
    description:
      "Request category suggestions and monthly insights when you need them.",
  },
];

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[510px]">
      <div className="absolute -inset-4 rounded-[2rem] bg-emerald-50/80" />
      <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-36px_rgba(15,23,42,0.3)] sm:p-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Wallet size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">My allowance</p>
              <p className="text-xs text-slate-500">Illustrative preview</p>
            </div>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            This month
          </span>
        </div>

        <div className="py-6">
          <p className="text-sm text-slate-500">Remaining pocket money</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              PKR 18,400
            </span>
            <span className="text-sm text-slate-500">of PKR 30,000</span>
          </div>
          <div
            className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="img"
            aria-label="Illustrative preview: 61 percent of monthly pocket money remaining"
          >
            <div className="h-full w-[61%] rounded-full bg-emerald-600" />
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>PKR 11,600 spent</span>
            <span>61% remaining</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Spending overview</p>
              <p className="mt-0.5 text-xs text-slate-500">Illustrative weekly activity</p>
            </div>
            <ArrowUpRight className="text-emerald-700" size={18} aria-hidden="true" />
          </div>
          <div
            className="flex h-24 items-end justify-between gap-2 px-1"
            role="img"
            aria-label="Illustrative weekly spending chart"
          >
            {[38, 58, 44, 76, 50, 66, 34].map((height, index) => (
              <div className="flex h-full flex-1 flex-col justify-end" key={index}>
                <div
                  className={`rounded-t-md ${
                    index === 3 ? "bg-emerald-600" : "bg-emerald-200"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-slate-400">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Sample figures only — not real account data
        </p>
      </div>
    </div>
  );
}

export default async function Home() {
  const session = await auth();
  const isAuthenticated = Boolean(session?.user?.id);

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900">
      <Navbar isAuthenticated={isAuthenticated} />

      <main>
        <section className="relative border-b border-slate-100">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:px-12 lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3.5 py-1.5 text-sm font-medium text-emerald-800">
                <CircleDollarSign size={16} aria-hidden="true" />
                Made for student life
              </div>
              <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.65rem]">
                Make Your Pocket Money{" "}
                <span className="text-emerald-700">Last Longer.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Track expenses, manage your monthly allowance, and build better
                spending habits with AI-powered insights — designed for
                university and hostel students.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  href={isAuthenticated ? "/dashboard" : "/register"}
                >
                  {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  href="#features"
                >
                  Explore Features
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Check size={16} className="text-emerald-700" aria-hidden="true" />
                  Simple to get started
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check size={16} className="text-emerald-700" aria-hidden="true" />
                  Built for student budgets
                </span>
              </div>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section className="scroll-mt-20 py-20 sm:py-24" id="features">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Everything in one place
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                A clearer view of your money
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Practical tools for the little daily decisions that add up over
                the month.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-900/[0.04]"
                  key={title}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="scroll-mt-20 border-y border-slate-100 bg-slate-50/70 py-20 sm:py-24"
          id="how-it-works"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                A few simple steps
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Make money habits feel manageable
              </h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(({ number, title, description }) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                  key={number}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold tracking-wide text-emerald-700">
                      {number}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">
                Built around your routine
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Student life has its own kind of budget.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                PocketWise AI is designed to make allowance tracking feel
                straightforward, whether you are on campus or making a hostel
 budget stretch to month-end.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: GraduationCap, label: "University students" },
                { icon: Building2, label: "Hostel residents" },
                { icon: CalendarDays, label: "Monthly allowances" },
              ].map(({ icon: Icon, label }) => (
                <div
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-col sm:items-start sm:p-5"
                  key={label}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon size={19} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium leading-5 text-slate-800">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12">
          <div className="mx-auto max-w-7xl rounded-2xl border border-emerald-100 bg-emerald-50/70 px-6 py-12 text-center sm:px-12 sm:py-16">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Your next month starts here
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Take Control of Your Pocket Money.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
              Start tracking your spending and make your monthly allowance work
              for you.
            </p>
            <Link
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              href={isAuthenticated ? "/dashboard" : "/register"}
            >
              {isAuthenticated ? "Open Dashboard" : "Create Free Account"}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            {!isAuthenticated && (
              <p className="mt-4 text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  className="font-semibold text-emerald-800 underline-offset-4 hover:underline"
                  href="/login"
                >
                  Sign in
                </Link>
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-9 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <div className="max-w-sm">
            <Link
              className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-slate-900"
              href="/"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Wallet size={17} aria-hidden="true" />
              </span>
              PocketWise AI
            </Link>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              A simpler way for university and hostel students to keep track of
              their pocket money.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600"
          >
            <Link className="transition hover:text-emerald-700" href="#features">
              Features
            </Link>
            <Link className="transition hover:text-emerald-700" href={isAuthenticated ? "/dashboard" : "/login"}>
              {isAuthenticated ? "Dashboard" : "Sign In"}
            </Link>
            {!isAuthenticated && (
              <Link className="transition hover:text-emerald-700" href="/register">
                Sign Up
              </Link>
            )}
          </nav>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} PocketWise AI
          </p>
        </div>
      </footer>
    </div>
  );
}
