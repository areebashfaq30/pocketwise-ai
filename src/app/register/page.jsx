"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setFieldErrors((current) => ({ ...current, [event.target.name]: "" }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (form.password.length < 8) {
      setFieldErrors({
        password: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        const errors = {};
        for (const item of result.errors ?? []) {
          errors[item.field] = item.message;
        }
        setFieldErrors(errors);
        setError(result.message || "Unable to create your account.");
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("Unable to connect right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-semibold text-emerald-700">PocketWise AI</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">Start building better money habits.</p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate>
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input className={inputClass} name="name" autoComplete="name" value={form.name} onChange={updateField} required />
            {fieldErrors.name && <span className="mt-1 block text-sm text-red-600">{fieldErrors.name}</span>}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input className={inputClass} name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required />
            {fieldErrors.email && <span className="mt-1 block text-sm text-red-600">{fieldErrors.email}</span>}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input className={inputClass} name="password" type="password" autoComplete="new-password" value={form.password} onChange={updateField} required minLength={8} aria-describedby={fieldErrors.password ? "password-error" : undefined} />
            {fieldErrors.password && <span id="password-error" className="mt-1 block text-sm text-red-600">{fieldErrors.password}</span>}
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirm password
            <input className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={updateField} required />
            {fieldErrors.confirmPassword && <span className="mt-1 block text-sm text-red-600">{fieldErrors.confirmPassword}</span>}
          </label>

          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button
            className="w-full rounded-lg bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-emerald-700 hover:underline" href="/login">
            Sign In
          </Link>
        </p>
      </section>
    </main>
  );
}
