import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { StatCardComponent } from './stat-card';

describe('StatCardComponent', () => {
  let component: StatCardComponent;
  let fixture: ComponentFixture<StatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;

    // Set required inputs
    fixture.componentRef.setInput('label', 'Test Label');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('icon', 'file-text');

    await fixture.whenStable();
  });

  it('should display the label', () => {
    fixture.componentRef.setInput('label', 'Localized Files');
    fixture.detectChanges();
    expect(component.label()).toBe('Localized Files');
  });

  it('should display the value', () => {
    fixture.componentRef.setInput('value', 100);
    fixture.detectChanges();
    expect(component.value()).toBe(100);
  });

  it('should accept string values', () => {
    fixture.componentRef.setInput('value', '150');
    fixture.detectChanges();
    expect(component.value()).toBe('150');
  });

  it('should display the icon', () => {
    fixture.componentRef.setInput('icon', 'globe');
    fixture.detectChanges();
    expect(component.icon()).toBe('globe');
  });
});
