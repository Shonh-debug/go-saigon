import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

export const RATE_LIMIT_NOT_CONFIGURED = "RATE_LIMIT_NOT_CONFIGURED";
export const RATE_LIMITS = {
  discovery: { requests: 20, window: "5 m", prefix: "maps-pulse:discovery" },
  photoIp: { requests: 100, window: "1 d", prefix: "maps-pulse:photo-ip" },
  photoMonthly: { requests: 940, prefix: "maps-pulse:photo-monthly" }
} as const;

let discoveryLimiter: Ratelimit | undefined;
let photoIpLimiter: Ratelimit | undefined;
let redisClient: Redis | undefined;

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return undefined;
  if (!redisClient) redisClient = new Redis({ url, token });
  return redisClient;
}

function getLimiter(kind: "discovery" | "photoIp") {
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

  if (!photoIpLimiter) {
    photoIpLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(RATE_LIMITS.photoIp.requests, RATE_LIMITS.photoIp.window),
      analytics: true,
      prefix: RATE_LIMITS.photoIp.prefix
    });
  }
  return photoIpLimiter;
}

function getIdentifier(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
}

export function getPhotoBudgetMonth(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getNextUtcMonthStartEpochSeconds(date = new Date()) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1) / 1000;
}

async function checkLimit(request: NextRequest, kind: "discovery" | "photoIp") {
  const activeLimiter = getLimiter(kind);
  if (!activeLimiter) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, reason: RATE_LIMIT_NOT_CONFIGURED };
    }
    return { success: true };
  }
  return activeLimiter.limit(getIdentifier(request));
}

async function checkMonthlyPhotoBudget(redis: Redis) {
  const key = `${RATE_LIMITS.photoMonthly.prefix}:${getPhotoBudgetMonth()}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expireat(key, getNextUtcMonthStartEpochSeconds());
  }
  return {
    success: count <= RATE_LIMITS.photoMonthly.requests,
    limit: RATE_LIMITS.photoMonthly.requests,
    remaining: Math.max(0, RATE_LIMITS.photoMonthly.requests - count),
    reset: getNextUtcMonthStartEpochSeconds() * 1000
  };
}

export async function checkDiscoveryLimit(request: NextRequest) {
  return checkLimit(request, "discovery");
}

export async function checkPhotoLimit(request: NextRequest) {
  const redis = getRedis();
  if (!redis) {
    if (process.env.NODE_ENV === "production") {
      return { success: false, reason: RATE_LIMIT_NOT_CONFIGURED };
    }
    return { success: true };
  }

  const ipLimit = await checkLimit(request, "photoIp");
  if (!ipLimit.success) return ipLimit;

  return checkMonthlyPhotoBudget(redis);
}
