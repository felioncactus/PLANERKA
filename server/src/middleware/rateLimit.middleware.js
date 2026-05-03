const buckets = new Map();

function keyFor(req) {
  return req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
}

export function rateLimit({ windowMs = 60_000, max = 60, message = "Too many requests. Please try again later." } = {}) {
  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const key = `${req.method}:${req.baseUrl}:${req.path}:${keyFor(req)}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ error: { code: "RATE_LIMITED", message } });
    }

    return next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000).unref?.();
