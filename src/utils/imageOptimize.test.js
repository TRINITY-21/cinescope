import { beforeEach, describe, expect, it } from 'vitest';
import { avatar, blurred, markWsrvFailed, optimize, responsive } from './imageOptimize';

const WSRV_BREAKER_KEY = 'bynge-wsrv-failed';

describe('optimize', () => {
  beforeEach(() => sessionStorage.clear());

  it('returns the input unchanged for non-http URLs', () => {
    expect(optimize(null)).toBeNull();
    expect(optimize(undefined)).toBeUndefined();
    expect(optimize('')).toBe('');
    expect(optimize('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(optimize('blob:foo')).toBe('blob:foo');
  });

  it('does not re-wrap an already-proxied wsrv.nl URL', () => {
    const wrapped = 'https://wsrv.nl/?url=https%3A%2F%2Fexample.com%2Fimg.jpg&w=800';
    expect(optimize(wrapped)).toBe(wrapped);
  });

  it('wraps http(s) URLs through wsrv.nl with given params', () => {
    const out = optimize('https://example.com/a.jpg', { w: 200, q: 80 });
    expect(out).toContain('wsrv.nl');
    expect(out).toContain('url=https%3A%2F%2Fexample.com%2Fa.jpg');
    expect(out).toContain('w=200');
    expect(out).toContain('q=80');
  });

  it('skips null/undefined param values', () => {
    const out = optimize('https://example.com/a.jpg', { w: 200, q: null, h: undefined });
    expect(out).toContain('w=200');
    expect(out).not.toContain('q=');
    expect(out).not.toContain('h=');
  });
});

describe('wsrv circuit breaker', () => {
  beforeEach(() => sessionStorage.clear());

  it('returns the raw URL once markWsrvFailed has tripped the breaker', () => {
    expect(optimize('https://example.com/a.jpg')).toContain('wsrv.nl');
    markWsrvFailed();
    expect(optimize('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
  });

  it('persists the breaker across multiple optimize calls in a session', () => {
    markWsrvFailed();
    expect(sessionStorage.getItem(WSRV_BREAKER_KEY)).toBe('1');
    expect(optimize('https://x.com/1.jpg')).not.toContain('wsrv.nl');
    expect(optimize('https://y.com/2.jpg')).not.toContain('wsrv.nl');
  });
});

describe('blurred', () => {
  beforeEach(() => sessionStorage.clear());

  it('adds blur + brightness + webp params', () => {
    const out = blurred('https://example.com/a.jpg', { w: 1080, blur: 30 });
    expect(out).toContain('blur=30');
    expect(out).toContain('w=1080');
    expect(out).toContain('output=webp');
    expect(out).toContain('bri=-10');
  });

  it('uses sensible defaults when params omitted', () => {
    const out = blurred('https://example.com/a.jpg');
    expect(out).toContain('w=1080');
    expect(out).toContain('blur=40');
  });
});

describe('responsive', () => {
  beforeEach(() => sessionStorage.clear());

  it('produces a webp output with fit=inside (no upscaling)', () => {
    const out = responsive('https://example.com/a.jpg', { w: 1280 });
    expect(out).toContain('w=1280');
    expect(out).toContain('output=webp');
    expect(out).toContain('fit=inside');
  });
});

describe('avatar', () => {
  beforeEach(() => sessionStorage.clear());

  it('produces a square crop with attention-aware center', () => {
    const out = avatar('https://example.com/a.jpg', { size: 200 });
    expect(out).toContain('w=200');
    expect(out).toContain('h=200');
    expect(out).toContain('fit=cover');
    expect(out).toContain('a=attention');
  });
});
