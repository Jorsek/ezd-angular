import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportSectionComponent } from './report-section';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-report-section
      [title]="title"
      [summaryText]="summaryText"
      [icon]="icon"
      [loading]="loading"
    >
      <div class="test-content">Test Content</div>
    </ccms-report-section>
  `,
  imports: [ReportSectionComponent],
})
class TestHostComponent {
  title?: string;
  summaryText?: string;
  icon?: string;
  loading = false;
}

describe('ReportSectionComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  describe('header rendering', () => {
    it('should not render header when title is not provided', () => {
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector('.header');
      expect(header).toBeNull();
    });

    it('should not render header when title is empty string', () => {
      host.title = '';
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector('.header');
      expect(header).toBeNull();
    });

    it('should render header when title is provided', () => {
      host.title = 'Test Title';
      fixture.detectChanges();
      const header = fixture.nativeElement.querySelector('.header');
      expect(header).not.toBeNull();
    });

    it('should render title text in header', () => {
      host.title = 'Topic Reuse';
      fixture.detectChanges();
      const titleEl = fixture.nativeElement.querySelector('.header-title');
      expect(titleEl.textContent).toBe('Topic Reuse');
    });
  });

  describe('icon rendering', () => {
    it('should not render icon when not provided', () => {
      host.title = 'Test Title';
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.header-icon');
      expect(icon).toBeNull();
    });

    it('should render icon when provided', () => {
      host.title = 'Test Title';
      host.icon = '📊';
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('.header-icon');
      expect(icon).not.toBeNull();
      expect(icon.textContent).toBe('📊');
    });
  });

  describe('summary text rendering', () => {
    it('should not render summary when not provided', () => {
      host.title = 'Test Title';
      fixture.detectChanges();
      const summary = fixture.nativeElement.querySelector('.header-summary');
      expect(summary).toBeNull();
    });

    it('should render summary when provided', () => {
      host.title = 'Test Title';
      host.summaryText = 'This is a summary';
      fixture.detectChanges();
      const summary = fixture.nativeElement.querySelector('.header-summary');
      expect(summary).not.toBeNull();
      expect(summary.textContent).toBe('This is a summary');
    });
  });

  describe('content projection', () => {
    it('should project content via ng-content', () => {
      fixture.detectChanges();
      const content = fixture.nativeElement.querySelector('.test-content');
      expect(content).not.toBeNull();
      expect(content.textContent).toBe('Test Content');
    });

    it('should render projected content even without header', () => {
      fixture.detectChanges();
      const content = fixture.nativeElement.querySelector('.test-content');
      const header = fixture.nativeElement.querySelector('.header');
      expect(header).toBeNull();
      expect(content).not.toBeNull();
    });

    it('should render projected content with header', () => {
      host.title = 'Test Title';
      fixture.detectChanges();
      const content = fixture.nativeElement.querySelector('.test-content');
      const header = fixture.nativeElement.querySelector('.header');
      expect(header).not.toBeNull();
      expect(content).not.toBeNull();
    });
  });

  describe('complete header', () => {
    it('should render all header elements when all inputs provided', () => {
      host.title = 'Reuse Metrics';
      host.summaryText = 'Key metrics for analysis';
      host.icon = '📈';
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.header-icon');
      const title = fixture.nativeElement.querySelector('.header-title');
      const summary = fixture.nativeElement.querySelector('.header-summary');

      expect(icon.textContent).toBe('📈');
      expect(title.textContent).toBe('Reuse Metrics');
      expect(summary.textContent).toBe('Key metrics for analysis');
    });
  });

  describe('loading state', () => {
    it('should add loading class to host when loading is true', () => {
      host.loading = true;
      fixture.detectChanges();
      const reportSection = fixture.nativeElement.querySelector('ccms-report-section');
      expect(reportSection.classList.contains('loading')).toBe(true);
    });

    it('should not have loading class when loading is false', () => {
      host.loading = false;
      fixture.detectChanges();
      const reportSection = fixture.nativeElement.querySelector('ccms-report-section');
      expect(reportSection.classList.contains('loading')).toBe(false);
    });
  });
});
