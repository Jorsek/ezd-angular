import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { XPathPreviewPanelComponent } from './xpath-preview-panel.component';

describe('XPathPreviewPanelComponent', () => {
  let fixture: ComponentFixture<XPathPreviewPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XPathPreviewPanelComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(XPathPreviewPanelComponent);
    fixture.detectChanges();
  });

  it('should have folder picker', () => {
    const picker = fixture.nativeElement.querySelector('ccms-folder-picker');
    expect(picker).toBeTruthy();
  });

  it('should show empty state prompting for xpaths and folder', () => {
    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Enter XPath expressions and select a folder');
  });
});
