import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => localStorage.clear());

  it('returns the initial value when storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('reads existing value from localStorage on mount', () => {
    localStorage.setItem('test-key', JSON.stringify({ hello: 'world' }));
    const { result } = renderHook(() => useLocalStorage('test-key', null));
    expect(result.current[0]).toEqual({ hello: 'world' });
  });

  it('persists a new value to localStorage when set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    act(() => result.current[1](42));
    expect(result.current[0]).toBe(42);
    expect(JSON.parse(localStorage.getItem('test-key'))).toBe(42);
  });

  it('supports functional updates (prev => next)', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    act(() => result.current[1]((prev) => prev + 1));
    act(() => result.current[1]((prev) => prev + 1));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(3);
    expect(JSON.parse(localStorage.getItem('counter'))).toBe(3);
  });

  it('falls back to initial value if stored JSON is corrupted', () => {
    localStorage.setItem('broken', 'not json {{{');
    const { result } = renderHook(() => useLocalStorage('broken', 'safe-default'));
    expect(result.current[0]).toBe('safe-default');
  });

  it('does not crash when localStorage.setItem throws (quota / private mode)', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => useLocalStorage('q', 'a'));
    expect(() => act(() => result.current[1]('b'))).not.toThrow();
    expect(result.current[0]).toBe('b'); // state still updates even though write failed
    setItemSpy.mockRestore();
  });

  it('handles complex objects correctly', () => {
    const { result } = renderHook(() => useLocalStorage('user', {}));
    act(() => result.current[1]({ name: 'Alice', items: [1, 2, 3], nested: { ok: true } }));
    expect(result.current[0]).toEqual({ name: 'Alice', items: [1, 2, 3], nested: { ok: true } });
  });

  it('handles arrays correctly', () => {
    const { result } = renderHook(() => useLocalStorage('list', []));
    act(() => result.current[1]([1, 2, 3]));
    expect(result.current[0]).toEqual([1, 2, 3]);
  });
});
