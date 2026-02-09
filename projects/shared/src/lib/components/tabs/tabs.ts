import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  input,
  output,
  QueryList,
  signal,
} from '@angular/core';

@Component({
  selector: 'ccms-tabs-header',
  template: `<ng-content></ng-content>`,
  styles: [
    `
      :host {
        display: flex;
        background-color: #ececf0;
        padding: 0.25rem;
        border-radius: 1rem;
        margin: 16px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsHeaderComponent {}

@Component({
  selector: 'ccms-tab-button',
  template: `
    <button type="button" [class.active]="active()" (click)="selected.emit()">
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      :host {
        flex-grow: 1;
      }
      button {
        padding: 0.5rem 1rem;
        width: 100%;
        border-radius: 1rem;
        background-color: transparent;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
      }
      .active {
        background-color: white;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabButtonComponent {
  id = input.required<string>();
  selected = output<void>();

  readonly active = signal(false);

  setActive(value: boolean) {
    this.active.set(value);
  }
}

@Component({
  selector: 'ccms-tab-content',
  template: `
    @if (active()) {
      <ng-content></ng-content>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabContentComponent {
  id = input.required<string>();

  readonly active = signal(false);

  setActive(value: boolean) {
    this.active.set(value);
  }
}

@Component({
  selector: 'ccms-tabs',
  template: `
    <ng-content select="tabs-header"></ng-content>

    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent implements AfterContentInit {
  readonly activeId = signal<string | null>(null);

  @ContentChildren(TabButtonComponent, { descendants: true })
  buttons!: QueryList<TabButtonComponent>;

  @ContentChildren(TabContentComponent)
  contents!: QueryList<TabContentComponent>;

  ngAfterContentInit() {
    console.log('ngAfterContentInit');
    // Default active tab
    const first = this.buttons.first;
    if (first) {
      this.select(first.id());
    }

    this.buttons.forEach((btn) => {
      console.log('subbing');
      btn.selected.subscribe(() => this.select(btn.id()));
    });
  }

  select(id: string) {
    this.activeId.set(id);

    this.buttons.forEach((b) => b.setActive(b.id() === id));
    this.contents.forEach((c) => c.setActive(c.id() === id));
  }
}
