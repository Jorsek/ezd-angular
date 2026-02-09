import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FilterActionsComponent } from './filter-actions';

describe('FilterActionsComponent', () => {
  let component: FilterActionsComponent;
  let fixture: ComponentFixture<FilterActionsComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [FilterActionsComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterActionsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have Clear button', () => {
    const clearButton = fixture.nativeElement.querySelector('.filter-actions__clear');
    expect(clearButton).toBeTruthy();
    expect(clearButton.textContent.trim()).toBe('Clear Filters');
  });

  it('should disable Clear button when hasFilters is false', async () => {
    fixture.componentRef.setInput('hasFilters', false);
    await fixture.whenStable();

    const clearButton = fixture.nativeElement.querySelector('.filter-actions__clear');
    expect(clearButton.disabled).toBe(true);
  });

  it('should enable Clear button when hasFilters is true', async () => {
    fixture.componentRef.setInput('hasFilters', true);
    await fixture.whenStable();

    const clearButton = fixture.nativeElement.querySelector('.filter-actions__clear');
    expect(clearButton.disabled).toBe(false);
  });

  it('should emit clearClick when Clear button is clicked', async () => {
    fixture.componentRef.setInput('hasFilters', true);
    await fixture.whenStable();

    let clearClicked = false;
    component.clearClick.subscribe(() => {
      clearClicked = true;
    });

    const clearButton = fixture.nativeElement.querySelector('.filter-actions__clear');
    clearButton.click();

    expect(clearClicked).toBe(true);
  });

  it('should emit clearClick on Enter key', async () => {
    fixture.componentRef.setInput('hasFilters', true);
    await fixture.whenStable();

    let clearClicked = false;
    component.clearClick.subscribe(() => {
      clearClicked = true;
    });

    const clearButton = fixture.nativeElement.querySelector('.filter-actions__clear');
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    clearButton.dispatchEvent(enterEvent);

    expect(clearClicked).toBe(true);
  });

  it('should emit clearClick on Space key', async () => {
    fixture.componentRef.setInput('hasFilters', true);
    await fixture.whenStable();

    let clearClicked = false;
    component.clearClick.subscribe(() => {
      clearClicked = true;
    });

    const clearButton = fixture.nativeElement.querySelector('.filter-actions__clear');
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    clearButton.dispatchEvent(spaceEvent);

    expect(clearClicked).toBe(true);
  });
});
