import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComputedMetadataService } from './computed-metadata.service';
import { ComputedMetadataDefinition } from '../models';

describe('ComputedMetadataService', () => {
  let service: ComputedMetadataService;
  let httpMock: HttpTestingController;

  const baseUrl = '/ezdnxtgen/api/turbo/proxy/computed-metadata';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });

    service = TestBed.inject(ComputedMetadataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('listDefinitions', () => {
    it('should return list of definitions', () => {
      const mockDefinitions: ComputedMetadataDefinition[] = [
        {
          id: 1,
          name: 'author',
          key: 'author',
          dataType: 'TEXT',
          multiValue: false,
          defaultValue: 'Unknown',
          xpaths: ['//author/text()'],
          createdUtc: '2024-01-16T12:00:00Z',
          updatedUtc: '2024-01-16T12:00:00Z',
        },
      ];

      service.listDefinitions().subscribe((definitions) => {
        expect(definitions).toEqual(mockDefinitions);
      });

      const req = httpMock.expectOne(`${baseUrl}/definitions`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDefinitions);
    });
  });

  describe('getDefinition', () => {
    it('should return a single definition', () => {
      const mockDefinition: ComputedMetadataDefinition = {
        id: 1,
        name: 'author',
        key: 'author',
        dataType: 'TEXT',
        multiValue: false,
        defaultValue: 'Unknown',
        xpaths: ['//author/text()'],
        createdUtc: '2024-01-16T12:00:00Z',
        updatedUtc: '2024-01-16T12:00:00Z',
      };

      service.getDefinition(1).subscribe((definition) => {
        expect(definition).toEqual(mockDefinition);
      });

      const req = httpMock.expectOne(`${baseUrl}/definitions/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDefinition);
    });
  });

  describe('createDefinition', () => {
    it('should create a definition', () => {
      const request = {
        name: 'author',
        key: 'author',
        dataType: 'TEXT' as const,
        multiValue: false,
        defaultValue: 'Unknown',
        xpaths: ['//author/text()'],
      };

      const mockResponse: ComputedMetadataDefinition = {
        id: 1,
        name: 'author',
        key: 'author',
        dataType: 'TEXT',
        multiValue: false,
        defaultValue: 'Unknown',
        xpaths: ['//author/text()'],
        createdUtc: '2024-01-16T12:00:00Z',
        updatedUtc: '2024-01-16T12:00:00Z',
      };

      service.createDefinition(request).subscribe((definition) => {
        expect(definition).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/definitions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('updateDefinition', () => {
    it('should update a definition', () => {
      const request = {
        name: 'author',
        key: 'author',
        dataType: 'TEXT' as const,
        multiValue: false,
        defaultValue: 'Unknown Author',
        xpaths: ['//author/text()'],
      };

      const mockResponse: ComputedMetadataDefinition = {
        id: 1,
        name: 'author',
        key: 'author',
        dataType: 'TEXT',
        multiValue: false,
        defaultValue: 'Unknown Author',
        xpaths: ['//author/text()'],
        createdUtc: '2024-01-16T12:00:00Z',
        updatedUtc: '2024-01-16T13:00:00Z',
      };

      service.updateDefinition(1, request).subscribe((definition) => {
        expect(definition).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${baseUrl}/definitions/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('deleteDefinition', () => {
    it('should delete a definition', () => {
      service.deleteDefinition(1).subscribe();

      const req = httpMock.expectOne(`${baseUrl}/definitions/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
