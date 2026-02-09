import { signal, computed, Signal } from '@angular/core';

export interface InitialLoadTracker<T extends string> {
  isLoading: Signal<boolean>;
  isComplete: Signal<boolean>;
  markLoaded: (key: T) => void;
  reset: () => void;
}

export function createInitialLoadTracker<T extends string>(
  name: string,
  ...keys: T[]
): InitialLoadTracker<T> {
  // Timing: T=0 is creation time
  let startTime = performance.now();
  const loadTimes = new Map<T, number>();
  let hasLoggedCompletion = false;

  // Internal state: Record<key, loaded>
  const state = signal<Record<T, boolean>>(
    Object.fromEntries(keys.map((k) => [k, false])) as Record<T, boolean>,
  );

  const isComplete = computed(() => Object.values(state()).every(Boolean));

  const isLoading = computed(() => !isComplete());

  const markLoaded = (key: T): void => {
    // Record load time if not already recorded
    if (!loadTimes.has(key)) {
      loadTimes.set(key, performance.now() - startTime);
    }

    state.update((s) => ({ ...s, [key]: true }));

    // Check if all complete and log summary
    if (!hasLoggedCompletion && Object.values(state()).every(Boolean)) {
      hasLoggedCompletion = true;
      logLoadSummary(name, keys, loadTimes);
    }
  };

  const reset = (): void => {
    startTime = performance.now();
    loadTimes.clear();
    hasLoggedCompletion = false;
    state.set(Object.fromEntries(keys.map((k) => [k, false])) as Record<T, boolean>);
  };

  return { isLoading, isComplete, markLoaded, reset };
}

function logLoadSummary<T extends string>(
  name: string,
  keys: T[],
  loadTimes: Map<T, number>,
): void {
  const maxTime = Math.max(...loadTimes.values());

  // Sort by completion time (order they finished), then add total row
  const sortedEntries = keys
    .map((key) => ({
      key,
      'time(ms)': Math.round(loadTimes.get(key) ?? 0),
    }))
    .sort((a, b) => a['time(ms)'] - b['time(ms)']);

  // Add total row at the end with the report name
  sortedEntries.push({
    key: name as T,
    'time(ms)': Math.round(maxTime),
  });

  console.log(`[Initial Load] ${name}`);
  console.table(sortedEntries);
}
