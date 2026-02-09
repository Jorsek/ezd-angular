import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SearchFilterComponent } from './search-filter';

describe('SearchFilterComponent', () => {
  describe('standalone', () => {
    let component: SearchFilterComponent;
    let fixture: ComponentFixture<SearchFilterComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SearchFilterComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(SearchFilterComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have a search input', () => {
      const input = fixture.nativeElement.querySelector('.filter-search__input');
      expect(input).toBeTruthy();
      expect(input.type).toBe('search');
    });

    it('should have a search icon', () => {
      const icon = fixture.nativeElement.querySelector('.filter-search__icon');
      expect(icon).toBeTruthy();
    });

    it('should show default placeholder', () => {
      const input = fixture.nativeElement.querySelector(
        '.filter-search__input',
      ) as HTMLInputElement;
      expect(input.placeholder).toBe('Search...');
    });
  });

  describe('with host component', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should show current value', async () => {
      host.value.set('test query');
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector(
        '.filter-search__input',
      ) as HTMLInputElement;
      expect(input.value).toBe('test query');
    });

    it('should show custom placeholder', () => {
      const input = fixture.nativeElement.querySelector(
        '.filter-search__input',
      ) as HTMLInputElement;
      expect(input.placeholder).toBe('Search resources...');
    });

    it('should emit valueChange with debounce on input', async () => {
      vi.useFakeTimers();

      const valueChangeSpy = vi.fn();
      host.filterComponent().valueChange.subscribe(valueChangeSpy);

      const input = fixture.nativeElement.querySelector(
        '.filter-search__input',
      ) as HTMLInputElement;
      input.value = 'hello';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Should not emit immediately
      expect(valueChangeSpy).not.toHaveBeenCalled();

      // Wait for debounce (400ms)
      await vi.advanceTimersByTimeAsync(400);

      expect(valueChangeSpy).toHaveBeenCalledWith('hello');

      vi.useRealTimers();
    });

    it('should emit immediately on native search event (Enter key)', () => {
      const valueChangeSpy = vi.fn();
      host.filterComponent().valueChange.subscribe(valueChangeSpy);

      const input = fixture.nativeElement.querySelector(
        '.filter-search__input',
      ) as HTMLInputElement;
      input.value = 'immediate search';
      input.dispatchEvent(new Event('search'));
      fixture.detectChanges();

      // Should emit immediately without waiting for debounce
      expect(valueChangeSpy).toHaveBeenCalledWith('immediate search');
    });

    it('should show clear button when value present and clearable', async () => {
      host.value.set('some text');
      fixture.detectChanges();
      await fixture.whenStable();

      const clearBtn = fixture.nativeElement.querySelector('.filter-search__clear--visible');
      expect(clearBtn).toBeTruthy();
    });

    it('should hide clear button when value is empty', () => {
      host.value.set('');
      fixture.detectChanges();

      const clearBtn = fixture.nativeElement.querySelector('.filter-search__clear--visible');
      expect(clearBtn).toBeNull();
    });

    it('should hide clear button when clearable is false', async () => {
      host.value.set('some text');
      host.clearable.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      const clearBtn = fixture.nativeElement.querySelector('.filter-search__clear--visible');
      expect(clearBtn).toBeNull();
    });

    it('should emit empty string when clear button clicked', async () => {
      vi.useFakeTimers();

      host.value.set('some text');
      fixture.detectChanges();

      const valueChangeSpy = vi.fn();
      host.filterComponent().valueChange.subscribe(valueChangeSpy);

      const clearBtn = fixture.nativeElement.querySelector('.filter-search__clear');
      clearBtn.click();
      fixture.detectChanges();

      // Wait for debounce
      await vi.advanceTimersByTimeAsync(400);

      expect(valueChangeSpy).toHaveBeenCalledWith('');

      vi.useRealTimers();
    });
  });
});

@Component({
  selector: 'app-test-host',
  imports: [SearchFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-search-filter
      [value]="value()"
      [placeholder]="'Search resources...'"
      [clearable]="clearable()"
      (valueChange)="onValueChange($event)"
    />
  `,
})
class TestHostComponent {
  value = signal('');
  clearable = signal(true);

  filterComponent = viewChild.required(SearchFilterComponent);

  onValueChange(newValue: string): void {
    this.value.set(newValue);
  }
}
