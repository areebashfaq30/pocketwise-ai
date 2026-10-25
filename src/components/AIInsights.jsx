"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

const RISK_STYLES = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-800",
  moderate: "border-amber-200 bg-amber-50 text-amber-900",
  high: "border-rose-200 bg-rose-50 text-rose-800",
};
const REQUEST_TIMEOUT_MS = 90_000;

export default function AIInsights({ month }) {
  const [insight, setInsight] = useState(null);
  const [insufficientMessage, setInsufficientMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef(null);
  const timeoutRef = useRef(null);
  const requestInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      controllerRef.current?.abort();
    };
  }, []);

  async function generateInsights(force = false) {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    let requestTimedOut = false;
    timeoutRef.current = setTimeout(() => {
      requestTimedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);
    setIsLoading(true);
    setError("");
    setInsufficientMessage("");

    try {
      const response = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, force }),
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Unable to generate insights.");
      }
      if (result.insufficientData) {
        setInsight(null);
        setInsufficientMessage(result.message);
      } else {
        setInsight(result.insight);
      }
    } catch (requestError) {
      if (requestTimedOut) {
        setError(
          "The insights request timed out while waiting for the server. Please try again.",
        );
      } else if (requestError.name !== "AbortError") {
        setError(requestError.message || "Unable to generate insights.");
      }
    } finally {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      requestInFlightRef.current = false;
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
      if (!controller.signal.aborted || requestTimedOut) {
        setIsLoading(false);
      }
    }
  }

  return (
    <section
      className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6"
      aria-labelledby="ai-insights-heading"
    >
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <Sparkles size={16} aria-hidden="true" />
            PocketWise AI
          </p>
          <h2
            className="mt-1 text-lg font-semibold text-slate-900"
            id="ai-insights-heading"
          >
            Monthly AI Spending Summary
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Recommendations use only your aggregated financial data for {month}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!insight ? (
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60"
              type="button"
              onClick={() => generateInsights()}
              disabled={isLoading}
            >
              <Sparkles size={16} aria-hidden="true" />
              {isLoading ? "Generating..." : "Generate Insights"}
            </button>
          ) : (
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-700 px-3.5 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-60"
              type="button"
              onClick={() => generateInsights(true)}
              disabled={isLoading}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {isLoading ? "Refreshing..." : "Refresh Insights"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      {insufficientMessage ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          {insufficientMessage}
        </p>
      ) : insight ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${
                RISK_STYLES[insight.riskLevel] ??
                "border-slate-200 bg-slate-50 text-slate-700"
              }`}
            >
              {insight.riskLevel} budget risk
            </span>
            <p className="text-xs text-slate-500">
              Generated {new Date(insight.generatedAt).toLocaleString()}
            </p>
          </div>
          <p className="text-sm leading-6 text-slate-700">{insight.summary}</p>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Personalized Recommendations
            </h3>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
              {insight.recommendations.map((recommendation, index) => (
                <li key={`${index}-${recommendation}`}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">
          Generate an insight when you are ready. Your transaction details and
          account identifiers are not sent to Gemini.
        </p>
      )}
    </section>
  );
}