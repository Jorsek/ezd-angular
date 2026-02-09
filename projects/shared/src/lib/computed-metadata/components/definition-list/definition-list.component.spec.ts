import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DefinitionListComponent } from './definition-list.component';
import { ComputedMetadataDefinition } from '../../models';

describe('DefinitionListComponent', () => {
  let component: DefinitionListComponent;
  let fixture: ComponentFixture<DefinitionListComponent>;

  const mockDefinitions: ComputedMetadataDefinition[] = [
    {
      id: 1,
      name: 'author',
      key: 'author',
      dataType: 'TEXT',
      multiValue: false,
      defaultValue: 'Unknown',
      xpaths: ['//author/text()', '//creator/text()'],
      createdUtc: '2024-01-16T12:00:00Z',
      updatedUtc: '2024-01-16T12:00:00Z',
    },
    {
      id: 2,
      name: 'title',
      key: 'title',
      dataType: 'TEXT',
      multiValue: false,
      defaultValue: null,
      xpaths: ['//title/text()'],
      createdUtc: '2024-01-16T12:00:00Z',
      updatedUtc: '2024-01-16T12:00:00Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefinitionListComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(DefinitionListComponent);
    component = fixture.componentInstance;
  });

  it('should display empty state when no definitions', () => {
    fixture.componentRef.setInput('definitions', []);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('No definitions configured');
  });

  it('should display definitions table', () => {
    fixture.componentRef.setInput('definitions', mockDefinitions);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('should display definition name and xpath count', () => {
    fixture.componentRef.setInput('definitions', mockDefinitions);
    fixture.detectChanges();

    const firstRow = fixture.nativeElement.querySelector('tbody tr');
    expect(firstRow.textContent).toContain('author');
    expect(firstRow.textContent).toContain('2 XPaths');
  });

  it('should emit edit event when edit button clicked', () => {
    fixture.componentRef.setInput('definitions', mockDefinitions);
    fixture.detectChanges();

    const editSpy = vi.spyOn(component.edit, 'emit');
    const editBtn = fixture.nativeElement.querySelector('.edit-btn');
    editBtn.click();

    expect(editSpy).toHaveBeenCalledWith(mockDefinitions[0]);
  });

  it('should emit delete event when delete button clicked', () => {
    fixture.componentRef.setInput('definitions', mockDefinitions);
    fixture.detectChanges();

    const deleteSpy = vi.spyOn(component.deleteItem, 'emit');
    const deleteBtn = fixture.nativeElement.querySelector('.delete-btn');
    deleteBtn.click();

    expect(deleteSpy).toHaveBeenCalledWith(mockDefinitions[0]);
  });

  it('should emit reorder event when rows are reordered', () => {
    fixture.componentRef.setInput('definitions', mockDefinitions);
    fixture.detectChanges();

    const reorderSpy = vi.spyOn(component.reorder, 'emit');
    // Simulate a drag drop event
    component['onDrop']({
      previousIndex: 0,
      currentIndex: 1,
      item: {} as never,
      container: {} as never,
      previousContainer: {} as never,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
      event: {} as never,
    });

    expect(reorderSpy).toHaveBeenCalled();
    const emittedDefinitions = reorderSpy.mock.calls[0][0];
    expect(emittedDefinitions[0].name).toBe('title');
    expect(emittedDefinitions[1].name).toBe('author');
  });
});
