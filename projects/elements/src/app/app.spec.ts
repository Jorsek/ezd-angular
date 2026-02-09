import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    await fixture.whenStable();
    expect(app).toBeTruthy();
  });

  it('should have minimal template (custom elements registered in main.ts)', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    // Template only contains comment - custom elements are registered in main.ts
    expect(compiled.textContent?.trim()).toBe('');
  });
});
