import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalloutSectionComponent } from './callout-section';
import { CalloutConfig } from './callout-config.interface';

describe('CalloutSectionComponent', () => {
  let component: CalloutSectionComponent;
  let fixture: ComponentFixture<CalloutSectionComponent>;

  const mockCallouts: Record<string, number> = {
    METRIC_A: 100,
    METRIC_B: 200,
    METRIC_C: 300,
  };

  const mockHighlighted: CalloutConfig = {
    id: 'METRIC_A',
    label: 'Metric A',
    suffix: '%',
    info: 'Description for Metric A',
  };

  const mockItems: CalloutConfig[] = [
    { id: 'METRIC_B', label: 'Metric B' },
    { id: 'METRIC_C', label: 'Metric C', info: 'Description for Metric C' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalloutSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CalloutSectionComponent);
    component = fixture.componentInstance;
  });

  describe('Callouts', () => {
    it('should render highlighted stat-card with highlight=true', () => {
      fixture.componentRef.setInput('callouts', mockCallouts);
      fixture.componentRef.setInput('highlighted', mockHighlighted);
      fixture.detectChanges();
      const highlighted = fixture.nativeElement.querySelector('.highlighted ccms-stat-card');
      expect(highlighted).not.toBeNull();
      expect(highlighted.classList.contains('highlight')).toBe(true);
    });

    it('should render items in grid', () => {
      fixture.componentRef.setInput('callouts', mockCallouts);
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const gridCards = fixture.nativeElement.querySelectorAll('.grid ccms-stat-card');
      expect(gridCards.length).toBe(2);
    });

    it('should lookup values from callouts map by id', () => {
      fixture.componentRef.setInput('callouts', mockCallouts);
      fixture.componentRef.setInput('highlighted', mockHighlighted);
      fixture.detectChanges();
      const value = component['getValue']('METRIC_A');
      expect(value).toBe(100);
    });

    it('should return null when callout id not found in map', () => {
      fixture.componentRef.setInput('callouts', mockCallouts);
      fixture.detectChanges();
      const value = component['getValue']('NON_EXISTENT');
      expect(value).toBeNull();
    });
  });

  describe('Loading', () => {
    it('should render skeletons when loading is true', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const skeletons = fixture.nativeElement.querySelectorAll('ccms-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render skeleton for highlighted when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('highlighted', mockHighlighted);
      fixture.detectChanges();
      const highlightedSkeleton = fixture.nativeElement.querySelector('.highlighted ccms-skeleton');
      expect(highlightedSkeleton).not.toBeNull();
    });

    it('should render skeleton for each item when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const gridSkeletons = fixture.nativeElement.querySelectorAll('.grid ccms-skeleton');
      expect(gridSkeletons.length).toBe(mockItems.length);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty items array', () => {
      fixture.componentRef.setInput('callouts', mockCallouts);
      fixture.componentRef.setInput('items', []);
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector('.grid');
      expect(grid).toBeNull();
    });

    it('should handle missing highlighted', () => {
      fixture.componentRef.setInput('callouts', mockCallouts);
      fixture.componentRef.setInput('items', mockItems);
      fixture.componentRef.setInput('highlighted', null);
      fixture.detectChanges();
      const highlighted = fixture.nativeElement.querySelector('.highlighted');
      expect(highlighted).toBeNull();
    });
  });

  describe('No data state', () => {
    it('should show no data message when callouts map is empty', () => {
      fixture.componentRef.setInput('callouts', {});
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const noData = fixture.nativeElement.querySelector('.no-data');
      expect(noData).not.toBeNull();
      expect(noData.textContent).toContain('No data available');
    });

    it('should not show no data message when callouts has values', () => {
      fixture.componentRef.setInput('callouts', mockCallouts);
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const noData = fixture.nativeElement.querySelector('.no-data');
      expect(noData).toBeNull();
    });

    it('should not show no data message when loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('callouts', {});
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const noData = fixture.nativeElement.querySelector('.no-data');
      expect(noData).toBeNull();
    });

    it('should show no data when callouts has values but none match configured items', () => {
      fixture.componentRef.setInput('callouts', { UNRELATED_METRIC: 999 });
      fixture.componentRef.setInput('highlighted', mockHighlighted);
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const noData = fixture.nativeElement.querySelector('.no-data');
      expect(noData).not.toBeNull();
    });
  });

  describe('Filtering by response data', () => {
    it('should not render highlighted when its ID is not in callouts response', () => {
      fixture.componentRef.setInput('callouts', { METRIC_B: 200, METRIC_C: 300 });
      fixture.componentRef.setInput('highlighted', mockHighlighted); // METRIC_A not in response
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const highlighted = fixture.nativeElement.querySelector('.highlighted');
      expect(highlighted).toBeNull();
    });

    it('should render highlighted when its ID is in callouts response', () => {
      fixture.componentRef.setInput('callouts', mockCallouts);
      fixture.componentRef.setInput('highlighted', mockHighlighted);
      fixture.detectChanges();
      const highlighted = fixture.nativeElement.querySelector('.highlighted');
      expect(highlighted).not.toBeNull();
    });

    it('should only render items that have values in callouts response', () => {
      fixture.componentRef.setInput('callouts', { METRIC_B: 200 }); // Only METRIC_B, not METRIC_C
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const gridCards = fixture.nativeElement.querySelectorAll('.grid ccms-stat-card');
      expect(gridCards.length).toBe(1);
    });

    it('should not render grid when no items have values in response', () => {
      fixture.componentRef.setInput('callouts', { UNRELATED: 999 });
      fixture.componentRef.setInput('highlighted', null);
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const grid = fixture.nativeElement.querySelector('.grid');
      expect(grid).toBeNull();
    });

    it('should show data when only highlighted has value (no items match)', () => {
      fixture.componentRef.setInput('callouts', { METRIC_A: 100 });
      fixture.componentRef.setInput('highlighted', mockHighlighted);
      fixture.componentRef.setInput('items', mockItems); // METRIC_B, METRIC_C not in response
      fixture.detectChanges();
      const noData = fixture.nativeElement.querySelector('.no-data');
      const highlighted = fixture.nativeElement.querySelector('.highlighted');
      expect(noData).toBeNull();
      expect(highlighted).not.toBeNull();
    });

    it('should show data when only items have values (highlighted does not match)', () => {
      fixture.componentRef.setInput('callouts', { METRIC_B: 200 });
      fixture.componentRef.setInput('highlighted', mockHighlighted); // METRIC_A not in response
      fixture.componentRef.setInput('items', mockItems);
      fixture.detectChanges();
      const noData = fixture.nativeElement.querySelector('.no-data');
      const grid = fixture.nativeElement.querySelector('.grid');
      expect(noData).toBeNull();
      expect(grid).not.toBeNull();
    });
  });
});
