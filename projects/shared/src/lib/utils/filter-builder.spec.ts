import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FilterBuilder, injectFilterBuilder } from './filter-builder';
import { MetadataConfigurationService } from '../services/metadata/metadata-configuration.service';
import { Field } from '../models/filter-field.interface';
import { FilterCategory } from '../models/filter.interface';

/** Helper to create a minimal Field for testing */
function createField(
  overrides: Partial<Field> & { name: string; displayName: string; type: Field['type'] },
): Field {
  return {
    multiSelect: false,
    metadata: false,
    ...overrides,
  };
}

describe('FilterBuilder', () => {
  let builder: FilterBuilder;
  let mockMetadataService: {
    getFileStatuses: ReturnType<typeof vi.fn>;
    getTaxonomyFields: ReturnType<typeof vi.fn>;
    getEnabledMetadataFields: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockMetadataService = {
      getFileStatuses: vi.fn().mockReturnValue(
        of([
          { name: 'DRAFT', displayName: 'Draft' },
          { name: 'PUBLISHED', displayName: 'Published' },
        ]),
      ),
      getTaxonomyFields: vi.fn().mockReturnValue(
        of({
          category: [
            { id: '1', label: 'Books', children: [{ id: '1.1', label: 'Fiction' }] },
            { id: '2', label: 'Movies' },
          ],
        }),
      ),
      getEnabledMetadataFields: vi.fn().mockReturnValue(of([])),
    };

    builder = new FilterBuilder(mockMetadataService as unknown as MetadataConfigurationService);
  });

  describe('build()', () => {
    it('should return empty array initially', () => {
      expect(builder.build()).toEqual([]);
    });

    it('should return added filters', () => {
      const filter: FilterCategory = {
        id: 'test',
        label: 'Test',
        type: 'text',
        default: false,
        removable: true,
      };
      builder.add(filter);
      expect(builder.build()).toEqual([filter]);
    });
  });

  describe('add()', () => {
    it('should add a raw filter', () => {
      const filter: FilterCategory = {
        id: 'search',
        label: 'Search',
        type: 'search',
        default: true,
        removable: false,
      };

      builder.add(filter);

      expect(builder.build()).toHaveLength(1);
      expect(builder.build()[0]).toEqual(filter);
    });

    it('should support chaining', () => {
      const result = builder
        .add({ id: 'a', label: 'A', type: 'text', default: false, removable: true })
        .add({ id: 'b', label: 'B', type: 'text', default: false, removable: true });

      expect(result).toBe(builder);
      expect(builder.build()).toHaveLength(2);
    });
  });

  describe('addField()', () => {
    it('should skip boolean fields', () => {
      const field = createField({ name: 'isActive', displayName: 'Active', type: 'boolean' });

      builder.addField(field);

      expect(builder.build()).toHaveLength(0);
    });

    it('should create text filter for text fields', () => {
      const field = createField({ name: 'title', displayName: 'Title', type: 'text' });

      builder.addField(field);

      const filters = builder.build();
      expect(filters).toHaveLength(1);
      expect(filters[0]).toMatchObject({
        id: 'title',
        label: 'Title',
        type: 'text',
        default: false,
        removable: true,
      });
    });

    it('should create number filter for number fields', () => {
      const field = createField({ name: 'count', displayName: 'Count', type: 'number' });

      builder.addField(field);

      const filters = builder.build();
      expect(filters[0].type).toBe('number');
    });

    it('should create date filter for datetime fields', () => {
      const field = createField({ name: 'createdAt', displayName: 'Created', type: 'datetime' });

      builder.addField(field);

      const filters = builder.build();
      expect(filters[0].type).toBe('date');
    });

    it('should create taxonomy filter for taxonomy fields', () => {
      const field = createField({
        name: 'metadata:category',
        displayName: 'Category',
        type: 'taxonomy',
        metadata: true,
      });

      builder.addField(field);

      const filters = builder.build();
      expect(filters[0].type).toBe('taxonomy');
      expect(filters[0].searchable).toBe(true);
      expect(filters[0].selectionMode).toBe('single');
      expect(filters[0].options).toBeDefined();
    });

    it('should use multi selection for taxonomy fields with multiSelect', () => {
      const field = createField({
        name: 'metadata:tags',
        displayName: 'Tags',
        type: 'taxonomy',
        multiSelect: true,
      });

      builder.addField(field);

      const filters = builder.build();
      expect(filters[0].selectionMode).toBe('multi');
    });

    it('should create list filter when options are provided for text field', () => {
      const field = createField({ name: 'status', displayName: 'Status', type: 'text' });
      const options = () => of([{ value: 'a', label: 'A' }]);

      builder.addField(field, { options });

      const filters = builder.build();
      expect(filters[0].type).toBe('list');
      expect(filters[0].options).toBe(options);
    });

    it('should set default and removable based on field.default', () => {
      const defaultField = createField({
        name: 'search',
        displayName: 'Search',
        type: 'text',
        default: true,
      });
      const nonDefaultField = createField({ name: 'other', displayName: 'Other', type: 'text' });

      builder.addField(defaultField).addField(nonDefaultField);

      const filters = builder.build();
      expect(filters[0].default).toBe(true);
      expect(filters[0].removable).toBe(false);
      expect(filters[1].default).toBe(false);
      expect(filters[1].removable).toBe(true);
    });

    it('should preserve metadata flag', () => {
      const field = createField({
        name: 'metadata:custom',
        displayName: 'Custom',
        type: 'text',
        metadata: true,
      });

      builder.addField(field);

      expect(builder.build()[0].metadata).toBe(true);
    });

    describe('with config override', () => {
      it('should override type when specified', () => {
        const field = createField({ name: 'title', displayName: 'Title', type: 'text' });

        builder.addField(field, { type: 'list' });

        expect(builder.build()[0].type).toBe('list');
      });

      it('should set selectionMode when specified', () => {
        const field = createField({ name: 'items', displayName: 'Items', type: 'text' });

        builder.addField(field, { type: 'list', selectionMode: 'multi' });

        expect(builder.build()[0].selectionMode).toBe('multi');
      });

      it('should set searchable when specified', () => {
        const field = createField({ name: 'items', displayName: 'Items', type: 'text' });

        builder.addField(field, { type: 'list', searchable: false });

        expect(builder.build()[0].searchable).toBe(false);
      });

      it('should use custom options when specified', () => {
        const field = createField({ name: 'custom', displayName: 'Custom', type: 'taxonomy' });
        const customOptions = () => of([{ value: 'x', label: 'X' }]);

        builder.addField(field, { options: customOptions });

        expect(builder.build()[0].options).toBe(customOptions);
      });
    });
  });

  describe('addFields()', () => {
    it('should add multiple fields', () => {
      const fields: Field[] = [
        createField({ name: 'a', displayName: 'A', type: 'text' }),
        createField({ name: 'b', displayName: 'B', type: 'number' }),
        createField({ name: 'c', displayName: 'C', type: 'datetime' }),
      ];

      builder.addFields(fields);

      const filters = builder.build();
      expect(filters).toHaveLength(3);
      expect(filters[0].id).toBe('a');
      expect(filters[1].id).toBe('b');
      expect(filters[2].id).toBe('c');
    });

    it('should skip boolean fields in array', () => {
      const fields: Field[] = [
        createField({ name: 'a', displayName: 'A', type: 'text' }),
        createField({ name: 'b', displayName: 'B', type: 'boolean' }),
        createField({ name: 'c', displayName: 'C', type: 'text' }),
      ];

      builder.addFields(fields);

      expect(builder.build()).toHaveLength(2);
    });
  });

  describe('addFileStatusFilter()', () => {
    it('should add file status filter with defaults', () => {
      builder.addFileStatusFilter();

      const filters = builder.build();
      expect(filters).toHaveLength(1);
      expect(filters[0]).toMatchObject({
        id: 'fileStatus',
        label: 'File Status',
        type: 'list',
        default: true,
        removable: false,
        selectionMode: 'multi',
        searchable: false,
      });
    });

    it('should add file status filter with custom settings', () => {
      builder.addFileStatusFilter(false, true);

      const filters = builder.build();
      expect(filters[0].default).toBe(false);
      expect(filters[0].removable).toBe(true);
    });

    it('should provide options from metadata service', async () => {
      builder.addFileStatusFilter();

      const options = builder.build()[0].options!;
      const result = await new Promise((resolve) => options().subscribe(resolve));

      expect(result).toEqual([
        { value: 'DRAFT', label: 'Draft' },
        { value: 'PUBLISHED', label: 'Published' },
      ]);
      expect(mockMetadataService.getFileStatuses).toHaveBeenCalled();
    });
  });

  describe('taxonomy options', () => {
    it('should fetch and map taxonomy options for taxonomy fields', async () => {
      const field = createField({
        name: 'metadata:category',
        displayName: 'Category',
        type: 'taxonomy',
      });

      builder.addField(field);

      const options = builder.build()[0].options!;
      const result = await new Promise((resolve) => options().subscribe(resolve));

      expect(mockMetadataService.getTaxonomyFields).toHaveBeenCalled();
      expect(result).toEqual([
        {
          value: '1',
          label: 'Books',
          children: [{ value: '1.1', label: 'Fiction' }],
        },
        { value: '2', label: 'Movies' },
      ]);
    });

    it('should return empty array for unknown taxonomy field', async () => {
      const field = createField({
        name: 'metadata:unknown',
        displayName: 'Unknown',
        type: 'taxonomy',
      });

      builder.addField(field);

      const options = builder.build()[0].options!;
      const result = await new Promise((resolve) => options().subscribe(resolve));

      expect(result).toEqual([]);
    });

    it('should strip metadata: prefix when fetching taxonomy options', async () => {
      mockMetadataService.getTaxonomyFields.mockReturnValue(
        of({ myField: [{ id: 'test', label: 'Test' }] }),
      );

      const field = createField({
        name: 'metadata:myField',
        displayName: 'My Field',
        type: 'taxonomy',
      });

      builder.addField(field);

      const options = builder.build()[0].options!;
      const result = await new Promise((resolve) => options().subscribe(resolve));

      expect(result).toEqual([{ value: 'test', label: 'Test' }]);
    });
  });

  describe('chaining', () => {
    it('should support full chaining workflow', () => {
      const result = builder
        .add({ id: 'search', label: 'Search', type: 'search', default: true, removable: false })
        .addFileStatusFilter()
        .addField(createField({ name: 'title', displayName: 'Title', type: 'text' }))
        .addFields([
          createField({ name: 'count', displayName: 'Count', type: 'number' }),
          createField({ name: 'date', displayName: 'Date', type: 'datetime' }),
        ])
        .build();

      expect(result).toHaveLength(5);
      expect(result.map((f) => f.id)).toEqual(['search', 'fileStatus', 'title', 'count', 'date']);
    });
  });
});

describe('injectFilterBuilder', () => {
  it('should create FilterBuilder factory with injected services', () => {
    const mockMetadataService = {
      getFileStatuses: vi.fn().mockReturnValue(of([])),
      getTaxonomyFields: vi.fn().mockReturnValue(of({})),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: MetadataConfigurationService, useValue: mockMetadataService }],
    });

    const factory = TestBed.runInInjectionContext(() => injectFilterBuilder());

    expect(typeof factory).toBe('function');

    const builder = factory();
    expect(builder).toBeInstanceOf(FilterBuilder);
  });
});
