import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

let limiter: Ratelimit | undefined;
export const RATE_LIMIT_NOT_CONFIGURED = "RATE_LIMIT_NOT_CONFIGURED";

function getLimiter() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return undefined;
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(20, "10 m"),
      analytics: true,
      prefix: "maps-pulse:discovery"
    });
  }
  return limiter;
}

export async function checkDiscoveryLimit(request: NextRequest) {
  const activeLimiter = getLimiter();
  if (!activeLimiter) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, reason: RATE_LIMIT_NOT_CONFIGURED };
    }
    return { success: true };
  }
  const identifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  return activeLimiter.limit(identifier);
}
