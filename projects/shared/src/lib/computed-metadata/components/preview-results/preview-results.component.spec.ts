import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PreviewResultsComponent } from './preview-results.component';
import { PreviewItem } from '../../models';

describe('PreviewResultsComponent', () => {
  let component: PreviewResultsComponent;
  let fixture: ComponentFixture<PreviewResultsComponent>;

  const mockItems: PreviewItem[] = [
    {
      filename: 'topic-123.dita',
      ditaType: 'TOPIC',
      value: 'John Doe',
      matchedXpath: '//prolog/author/text()',
    },
    {
      filename: 'user-guide.ditamap',
      ditaType: 'MAP',
      value: 'Jane Smith',
      matchedXpath: '//topicmeta/author/text()',
    },
    {
      filename: 'topic-no-author.dita',
      ditaType: 'TOPIC',
      value: 'Unknown',
      matchedXpath: null,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewResultsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewResultsComponent);
    component = fixture.componentInstance;
  });

  it('should display empty state when no items', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should display items in table', () => {
    fixture.componentRef.setInput('items', mockItems);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('should display stats correctly', () => {
    fixture.componentRef.setInput('items', mockItems);
    fixture.detectChanges();

    const statsBar = fixture.nativeElement.querySelector('.stats-bar');
    expect(statsBar.textContent).toContain('3 items');
    expect(statsBar.textContent).toContain('2 matched');
    expect(statsBar.textContent).toContain('1 default');
    expect(statsBar.textContent).toContain('2 topics');
    expect(statsBar.textContent).toContain('1 maps');
  });

  it('should show loading state', () => {
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('.loading-state');
    expect(loading).toBeTruthy();
  });

  it('should display error message', () => {
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('error', 'Something went wrong');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.error-message');
    expect(error.textContent).toContain('Something went wrong');
  });

  it('should emit close when close button clicked', () => {
    fixture.componentRef.setInput('items', mockItems);
    fixture.detectChanges();

    const closeSpy = vi.spyOn(component.closePanel, 'emit');
    const closeBtn = fixture.nativeElement.querySelector('.close-btn');
    closeBtn.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should display recompute progress', () => {
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('recomputeProgress', {
      type: 'progress',
      current: 50,
      total: 100,
      failed: null,
    });
    fixture.detectChanges();

    const progressText = fixture.nativeElement.querySelector('.progress-text');
    expect(progressText.textContent).toContain('50 / 100');
  });
});
