import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'ccms-report-section',
  templateUrl: './report-section.html',
  styleUrl: './report-section.css',
  imports: [NgTemplateOutlet],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.loading]': 'loading()',
  },
})
export class ReportSectionComponent {
  title = input<string>();
  titleTemplate = input<TemplateRef<void>>();
  summaryText = input<string>();
  icon = input<string>();
  loading = input<boolean>(false);

  protected hasHeader = computed(() => {
    const title = this.title();
    const titleTpl = this.titleTemplate();
    return (title !== undefined && title.length > 0) || titleTpl !== undefined;
  });
}
