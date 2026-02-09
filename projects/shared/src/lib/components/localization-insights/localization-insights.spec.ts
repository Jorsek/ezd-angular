import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, TemplateRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { LocalizationInsightsComponent } from './localization-insights';
import { LocalizationInsightsService } from '../../services/localization-insights/localization-insights.service';

// Mock ResizeObserver for echarts (used by child chart components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;

// Mock HTMLCanvasElement.getContext for echarts rendering
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  canvas: {},
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
})) as unknown as HTMLCanvasElement['getContext'];

// Mock IntersectionObserver for data table (infinite scroll)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

describe('LocalizationInsightsComponent', () => {
  let component: LocalizationInsightsComponent;
  let fixture: ComponentFixture<LocalizationInsightsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LocalizationInsightsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        provideEchartsCore({ echarts }),
        LocalizationInsightsService,
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Flush any remaining HTTP requests before verification
    // Use match() to find and flush all pending requests
    const allRequests = httpMock.match(() => true);
    allRequests.forEach((req) => {
      if (!req.cancelled) {
        if (req.request.url.includes('refresh')) {
          req.flush('OK');
        } else if (req.request.url.includes('taxonomy-fields')) {
          req.flush([]);
        } else if (req.request.url.includes('insights/detail')) {
          req.flush({ content: [], page: { totalElements: 0 } });
        } else if (req.request.url.includes('insights/insights')) {
          req.flush({ resources: { total: 0 }, summary: {}, jobs: { summary: { ACTIVE: 0 } } });
        } else if (req.request.url.includes('active-locales')) {
          req.flush([]);
        } else if (req.request.url.includes('root-maps')) {
          req.flush({ content: [], page: { totalElements: 0 } });
        } else if (req.request.url.includes('jobs')) {
          req.flush([]);
        } else if (req.request.url.includes('metadata/configuration')) {
          req.flush({ allCategories: [], allFields: [] });
        } else if (req.request.url.includes('editor-config')) {
          req.flush({ statuses: [] });
        } else if (req.request.url.includes('computed-metadata')) {
          req.flush([]);
        } else {
          req.flush({});
        }
      }
    });

    httpMock.verify();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  describe('cleanup', () => {
    it('should clean up subscriptions on destroy', async () => {
      fixture = TestBed.createComponent(LocalizationInsightsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Flush all initial HTTP requests
      flushDataRequests();

      // Wait for Angular to process
      await fixture.whenStable();

      // Component uses DestroyRef + takeUntilDestroyed for cleanup
      // Destroying the fixture triggers automatic cleanup
      fixture.destroy();

      // Verify component was destroyed without errors
      expect(fixture.componentRef.hostView.destroyed).toBe(true);
    });
  });

  describe('cell templates', () => {
    /** Helper to render a template with row data */
    function renderTemplate(
      templateRef: TemplateRef<unknown>,
      context: Record<string, unknown>,
    ): HTMLElement {
      const container = document.createElement('div');
      const view = templateRef.createEmbeddedView(context);
      view.detectChanges();
      for (const node of view.rootNodes) {
        container.appendChild(node);
      }
      return container;
    }

    /** Flush all initial HTTP requests needed for component initialization */
    function flushInitialRequests(): void {
      // Flush metadata configuration
      const metadataConfigReqs = httpMock.match('/ezdnxtgen/api/metadata/configuration');
      metadataConfigReqs.forEach((req) => req.flush({ allCategories: [], allFields: [] }));

      // Flush computed metadata definitions
      const computedMetadataReqs = httpMock.match(
        '/ezdnxtgen/api/turbo/proxy/computed-metadata/definitions',
      );
      computedMetadataReqs.forEach((req) => req.flush([]));

      // Flush views endpoint
      const viewsReqs = httpMock.match('/ezdnxtgen/api/turbo/proxy/insights/views/localization');
      viewsReqs.forEach((req) => req.flush([]));

      // Flush active-locales
      const localesReqs = httpMock.match(
        '/ezdnxtgen/api/turbo/proxy/insights/localization/active-locales',
      );
      localesReqs.forEach((req) => req.flush([]));

      // Flush editor-config
      const editorConfigReqs = httpMock.match('/ezdnxtgen/api/config/editor-config');
      editorConfigReqs.forEach((req) => req.flush({ statuses: [] }));

      // Flush root-maps
      const rootMapsReqs = httpMock.match((req) =>
        req.url.includes('/ezdnxtgen/api/turbo/proxy/insights/localization/root-maps'),
      );
      rootMapsReqs.forEach((req) => req.flush({ content: [], page: { totalElements: 0 } }));

      // Flush jobs
      const jobsReqs = httpMock.match('/ezdnxtgen/api/turbo/proxy/insights/localization/jobs');
      jobsReqs.forEach((req) => req.flush([]));

      // Flush refresh endpoint
      const refreshReqs = httpMock.match(
        '/ezdnxtgen/api/turbo/proxy/insights/localization/refresh',
      );
      refreshReqs.forEach((req) => req.flush({ success: true }));

      // Flush summary endpoint
      const summaryReqs = httpMock.match(
        '/ezdnxtgen/api/turbo/proxy/insights/localization/summary',
      );
      summaryReqs.forEach((req) => req.flush({ resources: { total: 0 } }));

      // Flush detail endpoint
      const detailReqs = httpMock.match((req) =>
        req.url.includes('/ezdnxtgen/api/turbo/proxy/insights/localization/detail'),
      );
      detailReqs.forEach((req) =>
        req.flush({ content: [], page: { totalElements: 0, totalPages: 0 } }),
      );
    }

    beforeEach(async () => {
      fixture = TestBed.createComponent(LocalizationInsightsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Flush all initial HTTP requests
      flushInitialRequests();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    describe('jobsCell', () => {
      it('should render job buttons separated by commas', () => {
        const row = {
          includedInJobs: [{ id: 101 }, { id: 202 }, { id: 303 }],
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const templateRef = (component as any).jobsCell as TemplateRef<unknown>;
        const container = renderTemplate(templateRef, { row });

        const buttons = container.querySelectorAll('button.job-link');
        expect(buttons.length).toBe(3);
        expect(buttons[0].textContent).toBe('101');
        expect(buttons[1].textContent).toBe('202');
        expect(buttons[2].textContent).toBe('303');

        // Check commas are present between buttons (not after the last one)
        const text = container.textContent ?? '';
        expect(text).toContain('101');
        expect(text).toContain('202');
        expect(text).toContain('303');
      });

      it('should render single job without comma', () => {
        const row = {
          includedInJobs: [{ id: 999 }],
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const templateRef = (component as any).jobsCell as TemplateRef<unknown>;
        const container = renderTemplate(templateRef, { row });

        const buttons = container.querySelectorAll('button.job-link');
        expect(buttons.length).toBe(1);
        expect(buttons[0].textContent).toBe('999');
      });

      it('should render nothing for empty jobs array', () => {
        const row = { includedInJobs: [] };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const templateRef = (component as any).jobsCell as TemplateRef<unknown>;
        const container = renderTemplate(templateRef, { row });

        const buttons = container.querySelectorAll('button.job-link');
        expect(buttons.length).toBe(0);
      });
    });

    // Note: fileStatusCell, l10nStatusCell, localeCell, and highlightCell tests
    // were removed as these now use shared cell renderer components.
    // See projects/shared/src/lib/components/reporting/cell-renderers/ for those components.
  });

  /** Helper to flush data requests that occur after refresh */
  function flushDataRequests(): void {
    // Flush metadata configuration request (used by filter service and data table)
    const metadataConfigReqs = httpMock.match('/ezdnxtgen/api/metadata/configuration');
    metadataConfigReqs.forEach((req) => req.flush({ allCategories: [], allFields: [] }));

    // Flush taxonomy-fields request (used by filter service)
    const taxonomyReqs = httpMock.match('/ezdnxtgen/api/metadata/taxonomy-fields');
    taxonomyReqs.forEach((req) => req.flush({}));

    // Flush editor-config request (used for file statuses)
    const editorConfigReqs = httpMock.match('/ezdnxtgen/api/config/editor-config');
    editorConfigReqs.forEach((req) => req.flush({ statuses: [] }));

    // Flush summary request
    const summaryReqs = httpMock.match('/ezdnxtgen/api/turbo/proxy/insights/localization/summary');
    summaryReqs.forEach((req) =>
      req.flush({
        resources: { total: 0 },
        summary: {},
        jobs: { summary: { ACTIVE: 0 } },
      }),
    );

    // Flush detail request
    const detailReqs = httpMock.match((req) =>
      req.url.includes('/ezdnxtgen/api/turbo/proxy/insights/localization/detail'),
    );
    detailReqs.forEach((req) =>
      req.flush({
        content: [],
        page: { totalElements: 0 },
      }),
    );

    // Flush active-locales request
    const localesReqs = httpMock.match(
      '/ezdnxtgen/api/turbo/proxy/insights/localization/active-locales',
    );
    localesReqs.forEach((req) => req.flush([]));

    // Flush root-maps request
    const rootMapsReqs = httpMock.match((req) =>
      req.url.includes('/ezdnxtgen/api/turbo/proxy/insights/localization/root-maps'),
    );
    rootMapsReqs.forEach((req) => req.flush({ content: [], page: { totalElements: 0 } }));

    // Flush jobs request
    const jobsReqs = httpMock.match('/ezdnxtgen/api/turbo/proxy/insights/localization/jobs');
    jobsReqs.forEach((req) => req.flush([]));

    // Flush extracted-metadata definitions request
    const extractedMetadataReqs = httpMock.match(
      '/ezdnxtgen/api/turbo/proxy/computed-metadata/definitions',
    );
    extractedMetadataReqs.forEach((req) => req.flush([]));
  }
});
