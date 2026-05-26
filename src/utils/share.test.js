import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { shareContent } from './share';

describe('shareContent', () => {
  const originalShare = navigator.share;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    // Reset to a known baseline before each test
    delete navigator.share;
    delete navigator.clipboard;
  });

  afterAll(() => {
    if (originalShare) navigator.share = originalShare;
    if (originalClipboard) navigator.clipboard = originalClipboard;
  });

  it('uses the Web Share API when available', async () => {
    const shareSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });

    const result = await shareContent({ title: 'T', text: 'D', url: 'https://x.com' });
    expect(result).toBe('shared');
    expect(shareSpy).toHaveBeenCalledWith({ title: 'T', text: 'D', url: 'https://x.com' });
  });

  it('returns failed when the user cancels the native share sheet', async () => {
    const cancelErr = new Error('canceled');
    cancelErr.name = 'AbortError';
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(cancelErr),
      configurable: true,
    });

    const result = await shareContent({ title: 'T', text: 'D', url: 'u' });
    expect(result).toBe('failed');
  });

  it('falls back to the clipboard when navigator.share is missing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const result = await shareContent({ title: 'T', text: 'D', url: 'https://x.com' });
    expect(result).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('T\nD\nhttps://x.com');
  });

  it('returns failed when both share and clipboard are unavailable', async () => {
    const result = await shareContent({ title: 'T', text: 'D', url: 'u' });
    expect(result).toBe('failed');
  });

  it('falls back to clipboard when share throws a non-Abort error', async () => {
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(new Error('boom')),
      configurable: true,
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const result = await shareContent({ title: 'T', text: 'D', url: 'u' });
    expect(result).toBe('copied');
  });
});

