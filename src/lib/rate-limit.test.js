import assert from "node:assert/strict";
import test from "node:test";

async function loadRateLimiter(nodeEnv, trustedIpHeader) {
  if (nodeEnv) {
    process.env.NODE_ENV = nodeEnv;
  } else {
    delete process.env.NODE_ENV;
  }

  if (trustedIpHeader === undefined) {
    delete process.env.RATE_LIMIT_TRUSTED_IP_HEADER;
  } else {
    process.env.RATE_LIMIT_TRUSTED_IP_HEADER = trustedIpHeader;
  }

  return import(`./rate-limit.js?test=${Math.random()}`);
}

function restoreEnvironment(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

test("development uses a loopback bucket without trusting forwarded headers", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousTrustedHeader = process.env.RATE_LIMIT_TRUSTED_IP_HEADER;

  try {
    const { getClientIp } = await loadRateLimiter("development");
    assert.equal(
      getClientIp({
        headers: new Headers({ "x-forwarded-for": "198.51.100.4" }),
      }),
      "127.0.0.1",
    );
  } finally {
    restoreEnvironment("NODE_ENV", previousNodeEnv);
    restoreEnvironment("RATE_LIMIT_TRUSTED_IP_HEADER", previousTrustedHeader);
  }
});

test("production fails closed without server-provided IP configuration", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousTrustedHeader = process.env.RATE_LIMIT_TRUSTED_IP_HEADER;

  try {
    const { getClientIp, RateLimitConfigurationError } =
      await loadRateLimiter("production");
    assert.throws(
        () => {
        getClientIp({
          headers: new Headers({ "x-forwarded-for": "198.51.100.4" }),
          });
        },
        RateLimitConfigurationError,
    );
  } finally {
    restoreEnvironment("NODE_ENV", previousNodeEnv);
    restoreEnvironment("RATE_LIMIT_TRUSTED_IP_HEADER", previousTrustedHeader);
  }
});

test("production accepts only the configured trusted header", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousTrustedHeader = process.env.RATE_LIMIT_TRUSTED_IP_HEADER;

  try {
    const { getClientIp } = await loadRateLimiter(
      "production",
      "x-ingress-client-ip",
    );
    assert.equal(
      getClientIp({
        headers: new Headers({
          "x-forwarded-for": "198.51.100.4",
          "x-ingress-client-ip": "203.0.113.7",
        }),
      }),
      "203.0.113.7",
    );
  } finally {
    restoreEnvironment("NODE_ENV", previousNodeEnv);
    restoreEnvironment("RATE_LIMIT_TRUSTED_IP_HEADER", previousTrustedHeader);
  }
});
