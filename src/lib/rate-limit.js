import { isIP } from "node:net";

const rateLimitStore =
  globalThis.authRateLimitStore ?? new Map();

if (!globalThis.authRateLimitStore) {
  globalThis.authRateLimitStore = rateLimitStore;
}

const trustedIpHeader = process.env.RATE_LIMIT_TRUSTED_IP_HEADER
  ?.trim()
  .toLowerCase();

export class RateLimitConfigurationError extends Error {
  constructor() {
    super("Rate limiting requires a valid server-provided client IP.");
    this.name = "RateLimitConfigurationError";
  }
}

function readHeader(headers, name) {
  if (typeof headers?.get === "function") {
    return headers.get(name);
  }

  const entry = Object.entries(headers ?? {}).find(
    ([headerName]) => headerName.toLowerCase() === name,
  );
  return entry?.[1];
}

function normalizeIp(value) {
  if (typeof value !== "string") {
    return null;
  }

  const ip = value.trim();
  const version = isIP(ip);
  if (!version) {
    return null;
  }

  return version === 6
    ? new URL(`http://[${ip}]/`).hostname.slice(1, -1)
    : ip;
}

export function getClientIp(request) {
  if (
    trustedIpHeader &&
    !/^[!#$%&'*+.^_`|~0-9a-z-]+$/.test(trustedIpHeader)
  ) {
    throw new RateLimitConfigurationError();
  }

  const trustedHeaderIp = trustedIpHeader
    ? readHeader(request?.headers, trustedIpHeader)
    : null;
  if (trustedHeaderIp != null) {
    const clientIp = normalizeIp(trustedHeaderIp);
    if (!clientIp) {
      throw new RateLimitConfigurationError();
    }
    return clientIp;
  }

  const clientIp = normalizeIp(request?.ip);
  if (clientIp) {
    return clientIp;
  }

  if (process.env.NODE_ENV === "development" && !trustedIpHeader) {
    return "127.0.0.1";
  }

  throw new RateLimitConfigurationError();
}

export function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();

  for (const [storedKey, entry] of rateLimitStore) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(storedKey);
    }
  }

  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (current.count >= limit) {
    return { allowed: false };
  }

  current.count += 1;
  return { allowed: true };
}
