import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkDiscoveryLimit,
  checkPhotoLimit,
  getNextUtcMonthStartEpochSeconds,
  getPhotoBudgetMonth,
  RATE_LIMIT_NOT_CONFIGURED,
  RATE_LIMITS
} from "./rateLimit";

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

  it("uses separate search and signed-photo quotas", () => {
    expect(RATE_LIMITS.discovery).toEqual({
      requests: 20,
      window: "5 m",
      prefix: "maps-pulse:discovery"
    });
    expect(RATE_LIMITS.photoIp).toEqual({
      requests: 60,
      window: "1 d",
      prefix: "maps-pulse:photo-ip"
    });
    expect(RATE_LIMITS.photoMonthly).toEqual({
      requests: 940,
      prefix: "maps-pulse:photo-monthly"
    });
  });

  it("fails closed for signed photos in production when Upstash is not configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    await expect(checkPhotoLimit(request())).resolves.toEqual({
      success: false,
      reason: RATE_LIMIT_NOT_CONFIGURED
    });
  });

  it("keys the global photo budget by UTC month", () => {
    expect(getPhotoBudgetMonth(new Date("2026-06-03T15:30:00.000Z"))).toBe("2026-06");
    expect(getPhotoBudgetMonth(new Date("2026-12-31T23:59:59.000Z"))).toBe("2026-12");
  });

  it("resets the global photo budget at the next UTC month", () => {
    expect(getNextUtcMonthStartEpochSeconds(new Date("2026-06-03T15:30:00.000Z"))).toBe(1_782_864_000);
    expect(getNextUtcMonthStartEpochSeconds(new Date("2026-12-31T23:59:59.000Z"))).toBe(1_798_761_600);
  });
});
