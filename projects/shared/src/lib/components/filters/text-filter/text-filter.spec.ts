import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TextFilterComponent } from './text-filter';

describe('TextFilterComponent', () => {
  describe('standalone', () => {
    let component: TextFilterComponent;
    let fixture: ComponentFixture<TextFilterComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TextFilterComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(TextFilterComponent);
      component = fixture.componentInstance;
      fixture.componentRef.setInput('label', 'Author');
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should display the label', () => {
      const labelEl = fixture.nativeElement.querySelector('.filter-label');
      expect(labelEl.textContent).toContain('Author');
    });

    it('should have an input field', () => {
      const input = fixture.nativeElement.querySelector('.filter-input');
      expect(input).toBeTruthy();
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

    it('should show current value in input', async () => {
      host.value.set('John Doe');
      fixture.detectChanges();
      await fixture.whenStable();

      const input = fixture.nativeElement.querySelector('.filter-input') as HTMLInputElement;
      expect(input.value).toBe('John Doe');
    });

    it('should show placeholder when empty', () => {
      const input = fixture.nativeElement.querySelector('.filter-input') as HTMLInputElement;
      expect(input.placeholder).toBe('Enter author...');
    });

    it('should emit valueChange with debounce on input', async () => {
      vi.useFakeTimers();

      const valueChangeSpy = vi.fn();
      host.filterComponent().valueChange.subscribe(valueChangeSpy);

      const input = fixture.nativeElement.querySelector('.filter-input') as HTMLInputElement;
      input.value = 'Jane';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Should not emit immediately
      expect(valueChangeSpy).not.toHaveBeenCalled();

      // Wait for debounce (400ms)
      await vi.advanceTimersByTimeAsync(400);

      expect(valueChangeSpy).toHaveBeenCalledWith('Jane');

      vi.useRealTimers();
    });

    it('should emit removed when remove button clicked', () => {
      const removedSpy = vi.fn();
      host.filterComponent().removed.subscribe(removedSpy);

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      removeBtn.click();

      expect(removedSpy).toHaveBeenCalled();
    });

    it('should hide remove button when removable is false', async () => {
      host.removable.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      const removeBtn = fixture.nativeElement.querySelector('.filter-remove');
      expect(removeBtn).toBeNull();
    });
  });
});

@Component({
  selector: 'app-test-host',
  imports: [TextFilterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-text-filter
      [label]="'Author'"
      [value]="value()"
      [placeholder]="'Enter author...'"
      [removable]="removable()"
      (valueChange)="onValueChange($event)"
      (removed)="onRemoved()"
    />
  `,
})
class TestHostComponent {
  value = signal('');
  removable = signal(true);

  filterComponent = viewChild.required(TextFilterComponent);

  onValueChange(newValue: string): void {
    this.value.set(newValue);
  }

  onRemoved(): void {}
}
