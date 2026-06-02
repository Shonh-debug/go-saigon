import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

export const RATE_LIMIT_NOT_CONFIGURED = "RATE_LIMIT_NOT_CONFIGURED";
export const RATE_LIMITS = {
  discovery: { requests: 20, window: "5 m", prefix: "maps-pulse:discovery" },
  photo: { requests: 200, window: "5 m", prefix: "maps-pulse:photo" }
} as const;

let discoveryLimiter: Ratelimit | undefined;
let photoLimiter: Ratelimit | undefined;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return undefined;
  return new Redis({ url, token });
}

function getLimiter(kind: keyof typeof RATE_LIMITS) {
  const redis = getRedis();
  if (!redis) return undefined;

  if (kind === "discovery") {
    if (!discoveryLimiter) {
      discoveryLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(RATE_LIMITS.discovery.requests, RATE_LIMITS.discovery.window),
        analytics: true,
        prefix: RATE_LIMITS.discovery.prefix
      });
    }
    return discoveryLimiter;
  }

  if (!photoLimiter) {
    photoLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.photo.requests, RATE_LIMITS.photo.window),
      analytics: true,
      prefix: RATE_LIMITS.photo.prefix
    });
  }
  return photoLimiter;
}

async function checkLimit(request: NextRequest, kind: keyof typeof RATE_LIMITS) {
  const activeLimiter = getLimiter(kind);
  if (!activeLimiter) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, reason: RATE_LIMIT_NOT_CONFIGURED };
    }
    return { success: true };
  }
  const identifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
  return activeLimiter.limit(identifier);
}

export async function checkDiscoveryLimit(request: NextRequest) {
  return checkLimit(request, "discovery");
}

export async function checkPhotoLimit(request: NextRequest) {
  return checkLimit(request, "photo");
}
