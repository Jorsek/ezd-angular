import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should have primary variant by default', () => {
    expect(component.variant()).toBe('primary');
  });

  it('should not be disabled by default', () => {
    expect(component.disabled()).toBe(false);
  });

  it('should emit click event when clicked', () => {
    let emittedEvent: MouseEvent | undefined;
    component.buttonClick.subscribe((event: MouseEvent) => {
      emittedEvent = event;
    });

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(emittedEvent).toBeDefined();
  });

  it('should not emit click event when disabled', async () => {
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();

    let clicked = false;
    component.buttonClick.subscribe(() => {
      clicked = true;
    });

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(clicked).toBe(false);
  });

  it('should have proper ARIA attributes', async () => {
    fixture.componentRef.setInput('label', 'Test Button');
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.getAttribute('aria-label')).toBe('Test Button');
    expect(button.getAttribute('aria-disabled')).toBe('true');
  });

  it('should handle keyboard events', () => {
    let emittedEvent: MouseEvent | undefined;
    component.buttonClick.subscribe((event: MouseEvent) => {
      emittedEvent = event;
    });

    const button = fixture.nativeElement.querySelector('button');
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    button.dispatchEvent(enterEvent);

    expect(emittedEvent).toBeDefined();
  });
});
