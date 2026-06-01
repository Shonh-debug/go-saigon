import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { checkDiscoveryLimit, RATE_LIMIT_NOT_CONFIGURED } from "./rateLimit";

function request() {
  return new Request("https://go-saigon.test/api/discovery/search", {
    headers: { "x-forwarded-for": "203.0.113.10" }
  }) as NextRequest;
}

describe("discovery rate limiting", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows local development when Upstash is not configured", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    await expect(checkDiscoveryLimit(request())).resolves.toEqual({ success: true });
  });

  it("fails closed in production when Upstash is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    await expect(checkDiscoveryLimit(request())).resolves.toEqual({
      success: false,
      reason: RATE_LIMIT_NOT_CONFIGURED
    });
  });
});
