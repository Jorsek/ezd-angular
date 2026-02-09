import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { LocalizationInsightsService } from './localization-insights.service';

describe('LocalizationInsightsService', () => {
  let service: LocalizationInsightsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        LocalizationInsightsService,
      ],
    });
    service = TestBed.inject(LocalizationInsightsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('refreshInsightsData', () => {
    const refreshUrl = '/ezdnxtgen/api/turbo/proxy/insights/localization/refresh';

    it('should return success: true when refresh completes successfully', async () => {
      service.refreshInsightsData().subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
        },
      });

      const req = httpMock.expectOne(refreshUrl);
      expect(req.request.method).toBe('GET');
      req.flush('OK');
    });

    it('should return success: false and log warning when refresh fails with HTTP error', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');

      service.refreshInsightsData().subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to refresh insights data. Continuing with potentially stale data.',
            expect.any(Object),
          );
        },
      });

      const req = httpMock.expectOne(refreshUrl);
      expect(req.request.method).toBe('GET');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should return success: false and log warning when network error occurs', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');

      service.refreshInsightsData().subscribe({
        next: (result) => {
          expect(result.success).toBe(false);
          expect(consoleSpy).toHaveBeenCalledWith(
            'Failed to refresh insights data. Continuing with potentially stale data.',
            expect.any(Object),
          );
        },
      });

      const req = httpMock.expectOne(refreshUrl);
      expect(req.request.method).toBe('GET');
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('getJobs', () => {
    const jobsUrl = '/ezdnxtgen/api/turbo/proxy/insights/localization/jobs';

    it('should fetch jobs from API', () => {
      const mockJobs = [
        {
          id: 123,
          uri: '/job/123',
          locale: 'de-DE',
          filename: 'map.ditamap',
          ditaType: 'map',
          status: 'ACTIVE',
        },
        {
          id: 456,
          uri: '/job/456',
          locale: 'fr-FR',
          filename: 'topic.dita',
          ditaType: 'topic',
          status: 'COMPLETED',
        },
      ];

      service.getJobs().subscribe((jobs) => {
        expect(jobs.length).toBe(2);
        expect(jobs[0].id).toBe(123);
      });

      const req = httpMock.expectOne(jobsUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockJobs);
    });
  });
});
