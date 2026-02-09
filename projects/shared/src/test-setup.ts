/**
 * Test setup file for vitest
 * Provides mocks for browser APIs not available in Node.js
 *
 * IMPORTANT: Mocks must be defined before any Angular imports
 * to ensure they're available when Angular code loads.
 */

// Mock ResizeObserver (must be before imports)
class MockResizeObserver implements ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}

  observe(_target: Element, _options?: ResizeObserverOptions): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = MockResizeObserver;

// Mock IntersectionObserver (must be before imports)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}

  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver = MockIntersectionObserver;

// Mock matchMedia (must be before imports)
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock canvas getContext for echarts
HTMLCanvasElement.prototype.getContext = (() => {
  return {
    fillRect: () => {},
    clearRect: () => {},
    getImageData: (x: number, y: number, w: number, h: number) => ({
      data: new Array(w * h * 4),
    }),
    putImageData: () => {},
    createImageData: () => [],
    setTransform: () => {},
    drawImage: () => {},
    save: () => {},
    fillText: () => {},
    restore: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    stroke: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    arc: () => {},
    fill: () => {},
    measureText: () => ({ width: 0 }),
    transform: () => {},
    rect: () => {},
    clip: () => {},
  };
}) as unknown as typeof HTMLCanvasElement.prototype.getContext;
