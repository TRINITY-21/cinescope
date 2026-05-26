import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Stub framer-motion so AnimatePresence doesn't hold mount/unmount waiting on
// requestAnimationFrame (which fake timers don't fake by default). Without
// this, every test that relies on a toast unmounting hangs until the 5s
// vitest timeout. We don't care about motion behavior in these tests.
vi.mock('framer-motion', () => {
  const passthrough = ({ children }) => children;
  const motionProxy = new Proxy(
    {},
    {
      get: () => (props) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { initial, animate, exit, transition, layout, whileHover, whileTap, ...rest } = props;
        const Tag = props.as || 'div';
        return <Tag {...rest}>{props.children}</Tag>;
      },
    }
  );
  return { AnimatePresence: passthrough, motion: motionProxy };
});

import { ToastProvider, useToast } from './ToastContext';

describe('ToastProvider — hook behavior', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns a no-op when used outside provider', () => {
    const { result } = renderHook(() => useToast());
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
    expect(() => result.current.toast({ message: 'x' })).not.toThrow();
  });

  it('renders a toast and auto-dismisses after the default 3s', () => {
    function Trigger() {
      const { toast } = useToast();
      return <button onClick={() => toast({ message: 'Hello world' })}>fire</button>;
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );

    act(() => { screen.getByText('fire').click(); });
    expect(screen.getByText('Hello world')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2999); });
    expect(screen.queryByText('Hello world')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2); });
    expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
  });

  it('uses the longer 5s duration when an action is attached', () => {
    function Trigger() {
      const { toast } = useToast();
      return (
        <button
          onClick={() => toast({ message: 'Undoable', action: { label: 'Undo', onClick: () => {} } })}
        >
          fire
        </button>
      );
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );

    act(() => { screen.getByText('fire').click(); });
    act(() => { vi.advanceTimersByTime(3500); });
    // Would've been gone with default 3s but action duration is 5s
    expect(screen.queryByText('Undoable')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1600); });
    expect(screen.queryByText('Undoable')).not.toBeInTheDocument();
  });

  it('caps the visible queue at 3 toasts, dropping the oldest', () => {
    function Trigger() {
      const { toast } = useToast();
      return (
        <button
          onClick={() => {
            toast({ message: '1' });
            toast({ message: '2' });
            toast({ message: '3' });
            toast({ message: '4' });
          }}
        >
          fire-batch
        </button>
      );
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    act(() => { screen.getByText('fire-batch').click(); });
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('invokes the action callback and dismisses the toast when the button is clicked', () => {
    const onUndo = vi.fn();
    function Trigger() {
      const { toast } = useToast();
      return (
        <button onClick={() => toast({ message: 'Removed', action: { label: 'Undo', onClick: onUndo } })}>
          fire
        </button>
      );
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    act(() => { fireEvent.click(screen.getByText('fire')); });
    expect(screen.getByText('Removed')).toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByText('Undo')); });
    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.queryByText('Removed')).not.toBeInTheDocument();
  });

  it('respects an explicit custom duration override', () => {
    function Trigger() {
      const { toast } = useToast();
      return <button onClick={() => toast({ message: 'short', duration: 500 })}>fire</button>;
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    act(() => { screen.getByText('fire').click(); });
    act(() => { vi.advanceTimersByTime(499); });
    expect(screen.queryByText('short')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(2); });
    expect(screen.queryByText('short')).not.toBeInTheDocument();
  });

  it('dismiss(id) removes a toast immediately', () => {
    let toastId;
    function Trigger() {
      const { toast, dismiss } = useToast();
      return (
        <div>
          <button onClick={() => { toastId = toast({ message: 'manual' }); }}>fire</button>
          <button onClick={() => dismiss(toastId)}>dismiss</button>
        </div>
      );
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );
    act(() => { screen.getByText('fire').click(); });
    expect(screen.getByText('manual')).toBeInTheDocument();
    act(() => { screen.getByText('dismiss').click(); });
    expect(screen.queryByText('manual')).not.toBeInTheDocument();
  });
});
