import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createInitialLoadTracker } from './initial-load-tracker';

describe('createInitialLoadTracker', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'table').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with isLoading true and isComplete false', () => {
    const tracker = createInitialLoadTracker('Test', 'a', 'b');

    expect(tracker.isLoading()).toBe(true);
    expect(tracker.isComplete()).toBe(false);
  });

  it('should remain loading until all keys are marked loaded', () => {
    const tracker = createInitialLoadTracker('Test', 'a', 'b', 'c');

    tracker.markLoaded('a');
    expect(tracker.isLoading()).toBe(true);
    expect(tracker.isComplete()).toBe(false);

    tracker.markLoaded('b');
    expect(tracker.isLoading()).toBe(true);
    expect(tracker.isComplete()).toBe(false);

    tracker.markLoaded('c');
    expect(tracker.isLoading()).toBe(false);
    expect(tracker.isComplete()).toBe(true);
  });

  it('should handle marking the same key multiple times', () => {
    const tracker = createInitialLoadTracker('Test', 'a', 'b');

    tracker.markLoaded('a');
    tracker.markLoaded('a'); // Should not cause issues
    tracker.markLoaded('b');

    expect(tracker.isComplete()).toBe(true);
  });

  it('should log summary when all keys complete', () => {
    const tracker = createInitialLoadTracker('My Report', 'summary', 'details');

    tracker.markLoaded('summary');
    expect(console.log).not.toHaveBeenCalled();

    tracker.markLoaded('details');
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[Initial Load] My Report'));
    expect(console.table).toHaveBeenCalled();
  });

  it('should only log summary once even if markLoaded called again', () => {
    const tracker = createInitialLoadTracker('Test', 'a');

    tracker.markLoaded('a');
    tracker.markLoaded('a');

    expect(console.log).toHaveBeenCalledTimes(1);
  });

  it('should reset all state and allow re-completion', () => {
    const tracker = createInitialLoadTracker('Test', 'a', 'b');

    tracker.markLoaded('a');
    tracker.markLoaded('b');
    expect(tracker.isComplete()).toBe(true);
    expect(console.log).toHaveBeenCalledTimes(1);

    tracker.reset();
    expect(tracker.isLoading()).toBe(true);
    expect(tracker.isComplete()).toBe(false);

    // Can complete again after reset
    tracker.markLoaded('a');
    tracker.markLoaded('b');
    expect(tracker.isComplete()).toBe(true);
    expect(console.log).toHaveBeenCalledTimes(2); // Logged again after reset
  });

  it('should work with a single key', () => {
    const tracker = createInitialLoadTracker('Single', 'only');

    expect(tracker.isLoading()).toBe(true);
    tracker.markLoaded('only');
    expect(tracker.isComplete()).toBe(true);
  });

  it('should sort console output by completion time with total row', () => {
    vi.useFakeTimers();
    const tracker = createInitialLoadTracker('Test', 'slow', 'fast');

    // Fast completes at T+100ms
    vi.advanceTimersByTime(100);
    tracker.markLoaded('fast');

    // Slow completes at T+500ms
    vi.advanceTimersByTime(400);
    tracker.markLoaded('slow');

    expect(console.table).toHaveBeenCalledWith([
      { key: 'fast', 'time(ms)': 100 },
      { key: 'slow', 'time(ms)': 500 },
      { key: 'Test', 'time(ms)': 500 }, // Total row with report name
    ]);

    vi.useRealTimers();
  });
});
