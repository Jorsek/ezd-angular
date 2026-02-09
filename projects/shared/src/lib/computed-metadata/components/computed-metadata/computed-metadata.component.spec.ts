import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of } from 'rxjs';
import { ComputedMetadataComponent } from './computed-metadata.component';
import { ComputedMetadataService } from '../../services';
import { ComputedMetadataDefinition } from '../../models';

describe('ComputedMetadataComponent', () => {
  let fixture: ComponentFixture<ComputedMetadataComponent>;
  let mockService: {
    listDefinitions: ReturnType<typeof vi.fn>;
    createDefinition: ReturnType<typeof vi.fn>;
    updateDefinition: ReturnType<typeof vi.fn>;
    deleteDefinition: ReturnType<typeof vi.fn>;
    preview: ReturnType<typeof vi.fn>;
    recompute: ReturnType<typeof vi.fn>;
  };

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

  beforeEach(async () => {
    mockService = {
      listDefinitions: vi.fn().mockReturnValue(of(mockDefinitions)),
      createDefinition: vi.fn(),
      updateDefinition: vi.fn(),
      deleteDefinition: vi.fn(),
      preview: vi.fn(),
      recompute: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ComputedMetadataComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ComputedMetadataService, useValue: mockService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComputedMetadataComponent);
    fixture.detectChanges();
  });

  it('should load definitions on init', () => {
    expect(mockService.listDefinitions).toHaveBeenCalled();
  });

  it('should display definitions list', () => {
    const list = fixture.nativeElement.querySelector('ccms-definition-list');
    expect(list).toBeTruthy();
  });

  it('should show create button in header', () => {
    const btn = fixture.nativeElement.querySelector('.btn-primary');
    expect(btn.textContent).toContain('Add Field');
  });
});
