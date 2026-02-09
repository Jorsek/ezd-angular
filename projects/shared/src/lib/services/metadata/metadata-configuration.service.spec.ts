import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MetadataConfigurationService } from './metadata-configuration.service';
import { MetadataConfiguration } from '../../models/metadata-configuration.interface';

describe('MetadataConfigurationService', () => {
  let service: MetadataConfigurationService;
  let httpMock: HttpTestingController;

  const mockMetadataConfig: MetadataConfiguration = {
    version: '1.0',
    allCategories: [
      {
        label: 'General',
        fieldRefs: [
          { fieldName: 'author', enabled: true, searchFacet: true },
          { fieldName: 'content-type', enabled: true, searchFacet: true },
          { fieldName: 'created-date', enabled: true, searchFacet: false },
        ],
        excludedContentTypes: [],
        associatedTags: [],
        includeForBinaryFiles: true,
      },
    ],
    allFields: [
      {
        name: 'author',
        displayName: 'Author',
        type: 'TEXT',
      },
      {
        name: 'content-type',
        displayName: 'Content Type',
        type: 'TAXONOMY',
        source: 'content-types',
      },
      {
        name: 'created-date',
        displayName: 'Created Date',
        type: 'DATE',
      },
    ],
    fieldByName: {
      author: { name: 'author', displayName: 'Author', type: 'TEXT' },
      'content-type': {
        name: 'content-type',
        displayName: 'Content Type',
        type: 'TAXONOMY',
        source: 'content-types',
      },
      'created-date': { name: 'created-date', displayName: 'Created Date', type: 'DATE' },
    },
    contentTypeToCategory: {},
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
        // Override the root-provided service to get a fresh instance each test
        { provide: MetadataConfigurationService, useClass: MetadataConfigurationService },
      ],
    });
    service = TestBed.inject(MetadataConfigurationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Discard any pending requests to avoid state leaks
    httpMock.match(() => true);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch metadata configuration from correct endpoint', async () => {
    const configPromise = firstValueFrom(service.getMetadataConfiguration());

    const req = httpMock.expectOne('/ezdnxtgen/api/metadata/configuration');
    expect(req.request.method).toBe('GET');
    req.flush(mockMetadataConfig);

    const config = await configPromise;
    expect(config).toEqual(mockMetadataConfig);
    expect(config.allFields.length).toBe(3);
    expect(config.version).toBe('1.0');
  });

  it('should cache the configuration (only one HTTP call for multiple subscriptions)', async () => {
    let callCount = 0;

    // First subscription
    service.getMetadataConfiguration().subscribe(() => {
      callCount++;
    });

    // Second subscription (should use cache)
    service.getMetadataConfiguration().subscribe(() => {
      callCount++;
    });

    // Third subscription (should use cache)
    const configPromise = firstValueFrom(service.getMetadataConfiguration());
    service.getMetadataConfiguration().subscribe(() => {
      callCount++;
    });

    // Only one HTTP request should be made
    const req = httpMock.expectOne('/ezdnxtgen/api/metadata/configuration');
    req.flush(mockMetadataConfig);

    const config = await configPromise;
    expect(config).toEqual(mockMetadataConfig);
    // All 4 subscriptions should have received data
    expect(callCount).toBe(3);
  });

  it('should return enabled fields correctly', async () => {
    const fieldsPromise = firstValueFrom(service.getEnabledMetadataFields());

    const req = httpMock.expectOne('/ezdnxtgen/api/metadata/configuration');
    req.flush(mockMetadataConfig);

    const fields = await fieldsPromise;
    expect(fields.length).toBe(3);
    expect(fields[0].name).toBe('author');
    expect(fields[0].displayName).toBe('Author');
    expect(fields[1].type).toBe('TAXONOMY');
    expect(fields[2].type).toBe('DATE');
  });

  it('should return only enabled fields', async () => {
    const configWithDisabled: MetadataConfiguration = {
      version: '1.0',
      allCategories: [
        {
          label: 'General',
          fieldRefs: [
            { fieldName: 'field1', enabled: true, searchFacet: true },
            { fieldName: 'field2', enabled: false, searchFacet: true },
            { fieldName: 'field3', enabled: true, searchFacet: false },
          ],
          excludedContentTypes: [],
          associatedTags: [],
          includeForBinaryFiles: true,
        },
      ],
      allFields: [
        { name: 'field1', displayName: 'Field 1', type: 'TEXT' },
        { name: 'field2', displayName: 'Field 2', type: 'TEXT' },
        { name: 'field3', displayName: 'Field 3', type: 'TEXT' },
      ],
      fieldByName: {},
      contentTypeToCategory: {},
    };

    const fieldsPromise = firstValueFrom(service.getEnabledMetadataFields());

    const req = httpMock.expectOne('/ezdnxtgen/api/metadata/configuration');
    req.flush(configWithDisabled);

    const fields = await fieldsPromise;
    expect(fields.length).toBe(2);
    expect(fields.map((f) => f.name)).toEqual(['field1', 'field3']);
  });

  it('should handle empty enabled fields', async () => {
    const emptyConfig: MetadataConfiguration = {
      version: '1.0',
      allCategories: [],
      allFields: [],
      fieldByName: {},
      contentTypeToCategory: {},
    };

    const fieldsPromise = firstValueFrom(service.getEnabledMetadataFields());

    const req = httpMock.expectOne('/ezdnxtgen/api/metadata/configuration');
    req.flush(emptyConfig);

    const fields = await fieldsPromise;
    expect(fields).toEqual([]);
    expect(fields.length).toBe(0);
  });

  it('should handle HTTP errors gracefully', async () => {
    const configPromise = firstValueFrom(service.getMetadataConfiguration());

    // CachedHttpRequest uses retry(3), so we need to handle 4 requests (1 original + 3 retries)
    for (let i = 0; i < 4; i++) {
      const req = httpMock.expectOne('/ezdnxtgen/api/metadata/configuration');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    }

    await expect(configPromise).rejects.toMatchObject({ status: 500 });
  });

  it('should handle 404 errors', async () => {
    const fieldsPromise = firstValueFrom(service.getEnabledMetadataFields());

    // CachedHttpRequest uses retry(3), so we need to handle 4 requests (1 original + 3 retries)
    for (let i = 0; i < 4; i++) {
      const req = httpMock.expectOne('/ezdnxtgen/api/metadata/configuration');
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    }

    await expect(fieldsPromise).rejects.toMatchObject({ status: 404 });
  });
});
