import { NextRequest, NextResponse } from "next/server";

/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
};

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Try to get wallet address first (for authenticated users)
  const walletAddress = request.headers.get("x-wallet-address");
  if (walletAddress) {
    return walletAddress;
  }
  
  // Fall back to IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
  return ip;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(
  config: Partial<RateLimitConfig> = {}
): (request: NextRequest) => NextResponse | null {
  const finalConfig = { ...defaultConfig, ...config };
  
  return (request: NextRequest): NextResponse | null => {
    const clientId = getClientId(request);
    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = store[clientId];
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + finalConfig.windowMs,
      };
      store[clientId] = entry;
      return null; // Allow request
    }
    
    // Increment count
    entry.count++;
    
    if (entry.count > finalConfig.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": finalConfig.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(entry.resetTime).toISOString(),
          },
        }
      );
    }
    
    // Allow request
    return null;
  };
}

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Stricter limits for write operations
  write: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  // Standard limits for read operations
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Very strict limits for authentication
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 requests per 15 minutes
  },
};


