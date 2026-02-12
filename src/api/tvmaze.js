class RateLimiter {
  constructor(maxTokens = 18, refillRate = 2) {
    this.tokens = maxTokens;
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
    this.queue = [];
  }

  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  async acquire() {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }
    const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    this.refill();
    this.tokens -= 1;
  }
}

const limiter = new RateLimiter();
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function fetchApi(url, options = {}) {
  const { signal, skipCache = false } = options;

  if (!skipCache) {
    const cached = cache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
  }

  await limiter.acquire();

  const response = await fetch(url, { signal });

  if (!response.ok) {
    if (response.status === 429) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return fetchApi(url, options);
    }
    throw new ApiError(response.status, `API error: ${response.status}`);
  }

  const data = await response.json();

  cache.set(url, { data, timestamp: Date.now() });

  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  return data;
}

export function clearCache() {
  cache.clear();
}
