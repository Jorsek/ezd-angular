import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RangeFilterComponent } from './range-filter';
import { ViewFilter } from '../../insights-views';

describe('RangeFilterComponent', () => {
  describe('number mode', () => {
    let fixture: ComponentFixture<NumberHostComponent>;
    let host: NumberHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [NumberHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(NumberHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should display the label', () => {
      const labelEl = fixture.nativeElement.querySelector('.filter-label');
      expect(labelEl.textContent).toContain('Word Count');
    });

    it('should render two number inputs', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input[type="number"]');
      expect(inputs.length).toBe(2);
    });

    it('should show min/max placeholders', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input[type="number"]');
      expect(inputs[0].placeholder).toBe('Min');
      expect(inputs[1].placeholder).toBe('Max');
    });

    it('should display pre-filled range values', async () => {
      host.range.set({ min: 100, max: 5000 });
      fixture.detectChanges();
      await fixture.whenStable();

      const inputs = fixture.nativeElement.querySelectorAll('input[type="number"]');
      expect(inputs[0].value).toBe('100');
      expect(inputs[1].value).toBe('5000');
    });

    it('should emit valueChange with range on min input after debounce', async () => {
      vi.useFakeTimers();

      const spy = vi.fn();
      host.filterComponent().valueChange.subscribe(spy);

      const inputs = fixture.nativeElement.querySelectorAll('input[type="number"]');
      inputs[0].value = '50';
      inputs[0].dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(spy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(400);

      expect(spy).toHaveBeenCalledWith({ range: { min: 50, max: undefined } });

      vi.useRealTimers();
    });

    it('should emit valueChange with range on max input after debounce', async () => {
      vi.useFakeTimers();

      const spy = vi.fn();
      host.filterComponent().valueChange.subscribe(spy);

      const inputs = fixture.nativeElement.querySelectorAll('input[type="number"]');
      inputs[1].value = '1000';
      inputs[1].dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await vi.advanceTimersByTimeAsync(400);

      expect(spy).toHaveBeenCalledWith({ range: { min: undefined, max: 1000 } });

      vi.useRealTimers();
    });

    it('should batch min and max changes within debounce window', async () => {
      vi.useFakeTimers();

      const spy = vi.fn();
      host.filterComponent().valueChange.subscribe(spy);

      const inputs = fixture.nativeElement.querySelectorAll('input[type="number"]');
      inputs[0].value = '10';
      inputs[0].dispatchEvent(new Event('input'));
      inputs[1].value = '200';
      inputs[1].dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await vi.advanceTimersByTimeAsync(400);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ range: { min: 10, max: 200 } });

      vi.useRealTimers();
    });

    it('should emit removed when remove button clicked', () => {
      const spy = vi.fn();
      host.filterComponent().removed.subscribe(spy);

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      removeBtn.click();

      expect(spy).toHaveBeenCalled();
    });

    it('should hide remove button when removable is false', async () => {
      host.removable.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      expect(removeBtn).toBeNull();
    });

    it('should emit undefined for cleared inputs', async () => {
      vi.useFakeTimers();

      host.range.set({ min: 100, max: 500 });
      fixture.detectChanges();
      await fixture.whenStable();

      const spy = vi.fn();
      host.filterComponent().valueChange.subscribe(spy);

      const inputs = fixture.nativeElement.querySelectorAll('input[type="number"]');
      inputs[0].value = '';
      inputs[0].dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await vi.advanceTimersByTimeAsync(400);

      expect(spy).toHaveBeenCalledWith({ range: { min: undefined, max: 500 } });

      vi.useRealTimers();
    });
  });

  describe('date mode', () => {
    let fixture: ComponentFixture<DateHostComponent>;
    let host: DateHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DateHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(DateHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should render two date inputs', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input[type="date"]');
      expect(inputs.length).toBe(2);
    });

    it('should not render number inputs', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input[type="number"]');
      expect(inputs.length).toBe(0);
    });

    it('should display pre-filled interval values', async () => {
      host.interval.set({ start: '2024-01-01', end: '2024-12-31' });
      fixture.detectChanges();
      await fixture.whenStable();

      const inputs = fixture.nativeElement.querySelectorAll('input[type="date"]');
      expect(inputs[0].value).toBe('2024-01-01');
      expect(inputs[1].value).toBe('2024-12-31');
    });

    it('should emit valueChange with interval on start input after debounce', async () => {
      vi.useFakeTimers();

      const spy = vi.fn();
      host.filterComponent().valueChange.subscribe(spy);

      const inputs = fixture.nativeElement.querySelectorAll('input[type="date"]');
      inputs[0].value = '2024-06-01';
      inputs[0].dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await vi.advanceTimersByTimeAsync(400);

      expect(spy).toHaveBeenCalledWith({ interval: { start: '2024-06-01', end: undefined } });

      vi.useRealTimers();
    });

    it('should emit valueChange with interval on end input after debounce', async () => {
      vi.useFakeTimers();

      const spy = vi.fn();
      host.filterComponent().valueChange.subscribe(spy);

      const inputs = fixture.nativeElement.querySelectorAll('input[type="date"]');
      inputs[1].value = '2024-12-31';
      inputs[1].dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await vi.advanceTimersByTimeAsync(400);

      expect(spy).toHaveBeenCalledWith({ interval: { start: undefined, end: '2024-12-31' } });

      vi.useRealTimers();
    });

    it('should batch start and end changes within debounce window', async () => {
      vi.useFakeTimers();

      const spy = vi.fn();
      host.filterComponent().valueChange.subscribe(spy);

      const inputs = fixture.nativeElement.querySelectorAll('input[type="date"]');
      inputs[0].value = '2024-01-01';
      inputs[0].dispatchEvent(new Event('input'));
      inputs[1].value = '2024-06-30';
      inputs[1].dispatchEvent(new Event('input'));
      fixture.detectChanges();

      await vi.advanceTimersByTimeAsync(400);

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ interval: { start: '2024-01-01', end: '2024-06-30' } });

      vi.useRealTimers();
    });

    it('should have proper aria labels on date inputs', () => {
      const inputs = fixture.nativeElement.querySelectorAll('input[type="date"]');
      expect(inputs[0].getAttribute('aria-label')).toBe('Start date');
      expect(inputs[1].getAttribute('aria-label')).toBe('End date');
    });
  });

  describe('separator', () => {
    it('should show a range separator between inputs', async () => {
      await TestBed.configureTestingModule({
        imports: [NumberHostComponent],
      }).compileComponents();

      const fixture = TestBed.createComponent(NumberHostComponent);
      fixture.detectChanges();

      const separator = fixture.nativeElement.querySelector('.filter-range-separator');
      expect(separator).toBeTruthy();
      expect(separator.textContent).toBe('–');
    });
  });
});

@Component({
  selector: 'app-number-host',
  imports: [RangeFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-range-filter
      [label]="'Word Count'"
      [type]="'number'"
      [range]="range()"
      [removable]="removable()"
      (valueChange)="onValueChange($event)"
      (removed)="onRemoved()"
    />
  `,
})
class NumberHostComponent {
  range = signal<{ min?: number; max?: number }>({});
  removable = signal(true);
  filterComponent = viewChild.required(RangeFilterComponent);
  onValueChange(_value: Pick<ViewFilter, 'range' | 'interval'>): void {}
  onRemoved(): void {}
}

@Component({
  selector: 'app-date-host',
  imports: [RangeFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-range-filter
      [label]="'Created'"
      [type]="'date'"
      [interval]="interval()"
      [removable]="removable()"
      (valueChange)="onValueChange($event)"
      (removed)="onRemoved()"
    />
  `,
})
class DateHostComponent {
  interval = signal<{ start?: string; end?: string }>({});
  removable = signal(true);
  filterComponent = viewChild.required(RangeFilterComponent);
  onValueChange(_value: Pick<ViewFilter, 'range' | 'interval'>): void {}
  onRemoved(): void {}
}
