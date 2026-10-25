import "server-only";
import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_TIMEOUT_MS = 55_000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;
const TRANSIENT_HTTP_STATUSES = new Set([408, 500, 502, 503, 504]);
const TRANSIENT_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
]);

let client;

export class GeminiError extends Error {
  constructor(code, diagnostic = null) {
    super(code);
    this.name = "GeminiError";
    this.code = code;
    this.diagnostic = diagnostic;
  }
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function getGeminiTimeoutMs() {
  const configuredTimeout = Number.parseInt(
    process.env.GEMINI_TIMEOUT_MS ?? "",
    10,
  );

  if (!Number.isFinite(configuredTimeout) || configuredTimeout <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return Math.min(configuredTimeout, MAX_TIMEOUT_MS);
}

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiError("not_configured");
  }

  if (!client) {
    client = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: getGeminiTimeoutMs() },
    });
  }

  return client;
}

function getSafeProviderDiagnostic(error, { durationMs, attempt }) {
  const status = Number(error?.status ?? error?.statusCode) || null;
  const providerCode = String(error?.code ?? error?.status ?? "UNKNOWN")
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .slice(0, 64);
  const message = [
    error?.message,
    error?.body,
    error?.cause?.message,
    error?.cause?.body,
  ]
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLowerCase();

  let description = "Provider request failed; raw error details suppressed.";
  if (/api.?key.*(invalid|not valid)|invalid.*api.?key/.test(message)) {
    description = "Provider rejected the API key as invalid.";
  } else if (status === 403 || /permission|access.*denied|restricted/.test(message)) {
    description = "Provider denied API or project access.";
  } else if (
    status === 429 ||
    providerCode.toLowerCase().includes("resource_exhausted") ||
    message.includes("quota")
  ) {
    description = "Provider quota or billing capacity is unavailable.";
  } else if (
    error?.name === "TimeoutError" ||
    error?.name === "AbortError" ||
    status === 408 ||
    status === 504 ||
    message.includes("timed out") ||
    message.includes("timeout")
  ) {
    description = "The provider request timed out.";
  } else if (
    status === 404 ||
    /model.*(not found|unsupported|does not exist)/.test(message)
  ) {
    description = "The requested model is unavailable to this project.";
  } else if (status === 400) {
    description = "Provider rejected the request configuration.";
  } else if (status === 401) {
    description = "Provider rejected the API credential.";
  } else if (status >= 500) {
    description = "Gemini provider returned a temporary service error.";
  }

  return {
    httpStatus: status,
    providerErrorCode: providerCode || "UNKNOWN",
    description,
    model: getGeminiModel(),
    durationMs,
    timeoutType: isTimeoutError(error, status, message)
      ? "provider_or_sdk_timeout"
      : TRANSIENT_NETWORK_CODES.has(error?.code ?? error?.cause?.code)
        ? "network_error"
        : "none",
    attempt,
  };
}

function isTimeoutError(error, status, message) {
  return (
    error?.name === "TimeoutError" ||
    error?.name === "AbortError" ||
    status === 408 ||
    status === 504 ||
    message.includes("timed out") ||
    message.includes("timeout")
  );
}

function mapProviderError(error, diagnostic) {
  const status = diagnostic.httpStatus;
  const code = diagnostic.providerErrorCode.toLowerCase();

  if (
    status === 429 ||
    code.includes("resource_exhausted") ||
    diagnostic.description.includes("quota")
  ) {
    return new GeminiError("quota_exceeded", diagnostic);
  }
  if (
    error?.name === "TimeoutError" ||
    error?.name === "AbortError" ||
    diagnostic.timeoutType !== "none" ||
    status === 408 ||
    status === 504
  ) {
    return new GeminiError("timeout", diagnostic);
  }
  if (diagnostic.description.includes("API key") || status === 401) {
    return new GeminiError("invalid_api_key", diagnostic);
  }
  if (status === 403) {
    return new GeminiError("access_denied", diagnostic);
  }
  if (status === 404) {
    return new GeminiError("model_unavailable", diagnostic);
  }
  if (TRANSIENT_NETWORK_CODES.has(error?.code ?? error?.cause?.code)) {
    return new GeminiError("network_error", diagnostic);
  }
  return new GeminiError("provider_error", diagnostic);
}

export async function generateStructuredContent(input, schema) {
  const startedAt = Date.now();
  const timeoutMs = getGeminiTimeoutMs();
  const deadline = startedAt + timeoutMs;
  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt += 1;
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      const diagnostic = {
        httpStatus: null,
        providerErrorCode: "TIMEOUT",
        description: "Gemini request exceeded its configured time limit.",
        model: getGeminiModel(),
        durationMs: Date.now() - startedAt,
        timeoutType: "application_deadline",
        attempt: attempt - 1,
      };
      console.error("Gemini provider request failed.", diagnostic);
      throw new GeminiError("timeout", diagnostic);
    }

    try {
      const response = await getClient().models.generateContent({
        model: getGeminiModel(),
        contents: input,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: schema,
          httpOptions: { timeout: remainingMs },
        },
      });
      const diagnostic = {
        httpStatus: response.sdkHttpResponse?.status ?? 200,
        providerErrorCode: "NONE",
        description: "Request completed.",
        model: getGeminiModel(),
        durationMs: Date.now() - startedAt,
        timeoutType: "none",
        attempt,
      };
      console.info("Gemini provider request completed.", diagnostic);

      if (typeof response.text !== "string" || !response.text) {
        throw new GeminiError("malformed_response");
      }

      try {
        return JSON.parse(response.text);
      } catch {
        throw new GeminiError("malformed_response");
      }
    } catch (error) {
      if (error instanceof GeminiError) {
        throw error;
      }

      const diagnostic = getSafeProviderDiagnostic(error, {
        durationMs: Date.now() - startedAt,
        attempt,
      });
      const networkCode = error?.code ?? error?.cause?.code;
      const isTransient =
        TRANSIENT_HTTP_STATUSES.has(diagnostic.httpStatus) ||
        TRANSIENT_NETWORK_CODES.has(networkCode) ||
        diagnostic.timeoutType !== "none";
      const delayMs = RETRY_DELAY_MS * 2 ** (attempt - 1);

      if (
        isTransient &&
        attempt < MAX_ATTEMPTS &&
        deadline - Date.now() > delayMs + 250
      ) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      console.error("Gemini provider request failed.", diagnostic);
      throw mapProviderError(error, diagnostic);
    }
  }

  throw new GeminiError("provider_error");
}

export function getGeminiErrorResponse(error) {
  if (!(error instanceof GeminiError)) {
    return {
      status: 502,
      code: "GEMINI_PROVIDER_ERROR",
      message: "Gemini could not complete the request. Please try again later.",
    };
  }

  switch (error.code) {
    case "not_configured":
      return {
        status: 503,
        code: "GEMINI_NOT_CONFIGURED",
        message: "Gemini is not configured on the server.",
      };
    case "invalid_api_key":
      return {
        status: 503,
        code: "GEMINI_INVALID_API_KEY",
        message: "The Gemini API key was rejected. Ask an administrator to check the server configuration.",
      };
    case "access_denied":
      return {
        status: 503,
        code: "GEMINI_ACCESS_DENIED",
        message: "Gemini access is restricted for this project. Check API and project permissions.",
      };
    case "model_unavailable":
      return {
        status: 503,
        code: "GEMINI_MODEL_UNAVAILABLE",
        message: "The configured Gemini model is unavailable. Please try again later.",
      };
    case "timeout":
      return {
        status: 504,
        code: "GEMINI_TIMEOUT",
        message: "Gemini did not respond within the configured time limit. Please try again.",
      };
    case "network_error":
      return {
        status: 502,
        code: "GEMINI_NETWORK_ERROR",
        message: "A network error interrupted the Gemini request. Please try again.",
      };
    case "quota_exceeded":
      return {
        status: 429,
        code: "GEMINI_QUOTA_EXCEEDED",
        message: "AI request capacity is temporarily exhausted. Please try later.",
      };
    case "malformed_response":
      return {
        status: 502,
        code: "GEMINI_INVALID_RESPONSE",
        message: "Gemini returned an invalid response. Please try again.",
      };
    default:
      return {
        status: 502,
        code: "GEMINI_PROVIDER_ERROR",
        message: "Gemini could not complete the request. Please try again later.",
      };
  }
}
