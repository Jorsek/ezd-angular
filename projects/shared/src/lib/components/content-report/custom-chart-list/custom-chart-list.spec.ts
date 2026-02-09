import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import { CustomChartListComponent, Chart } from './custom-chart-list';
import {
  ChartConfig,
  ChartType,
  ChartWidth,
  Measure,
  GroupBy,
} from '../configure-chart/configure-chart';
import { Field } from '../../../models/filter-field.interface';

// Mock ResizeObserver for echarts
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;

// Mock HTMLCanvasElement.getContext for echarts rendering
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  canvas: {},
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
})) as unknown as HTMLCanvasElement['getContext'];

/** Creates a chart config with specified width */
function createChartConfig(width: ChartWidth, chartType = ChartType.Bar): ChartConfig {
  return {
    title: `Chart Width ${width}`,
    description: '',
    chartType,
    measure: Measure.Objects,
    groupBy: GroupBy.ContentType,
    width,
  };
}

/** Creates a chart with specified id and width */
function createChart(id: string, width: ChartWidth, chartType = ChartType.Bar): Chart {
  return {
    id,
    config: createChartConfig(width, chartType),
    data: [{ name: 'Test', value: 10 }],
  };
}

describe('CustomChartListComponent', () => {
  describe('width classes', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideEchartsCore({ echarts })],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    it('should apply chart-card-width-1 class for width 1', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.One)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const chartCard = fixture.nativeElement.querySelector('.chart-card');
      expect(chartCard.classList.contains('chart-card-width-1')).toBe(true);
      expect(chartCard.classList.contains('chart-card-width-2')).toBe(false);
      expect(chartCard.classList.contains('chart-card-width-3')).toBe(false);
      expect(chartCard.classList.contains('chart-card-width-4')).toBe(false);
    });

    it('should apply chart-card-width-2 class for width 2', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Two)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const chartCard = fixture.nativeElement.querySelector('.chart-card');
      expect(chartCard.classList.contains('chart-card-width-2')).toBe(true);
    });

    it('should apply chart-card-width-3 class for width 3', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Three)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const chartCard = fixture.nativeElement.querySelector('.chart-card');
      expect(chartCard.classList.contains('chart-card-width-3')).toBe(true);
    });

    it('should apply chart-card-width-4 class for width 4', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Four)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const chartCard = fixture.nativeElement.querySelector('.chart-card');
      expect(chartCard.classList.contains('chart-card-width-4')).toBe(true);
    });
  });

  describe('width change triggers DOM recreation', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideEchartsCore({ echarts })],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    it('should recreate DOM element when width changes from 4 to 1', async () => {
      // Start with width 4
      host.charts.set([createChart('chart-1', ChartWidth.Four)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const initialCard = fixture.nativeElement.querySelector('.chart-card');
      expect(initialCard.classList.contains('chart-card-width-4')).toBe(true);

      // Change to width 1 (same chart ID, different width)
      host.charts.set([createChart('chart-1', ChartWidth.One)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const updatedCard = fixture.nativeElement.querySelector('.chart-card');
      expect(updatedCard.classList.contains('chart-card-width-1')).toBe(true);
      expect(updatedCard.classList.contains('chart-card-width-4')).toBe(false);
    });

    it('should recreate DOM element when width changes from 3 to 1', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Three)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const initialCard = fixture.nativeElement.querySelector('.chart-card');
      expect(initialCard.classList.contains('chart-card-width-3')).toBe(true);

      host.charts.set([createChart('chart-1', ChartWidth.One)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const updatedCard = fixture.nativeElement.querySelector('.chart-card');
      expect(updatedCard.classList.contains('chart-card-width-1')).toBe(true);
      expect(updatedCard.classList.contains('chart-card-width-3')).toBe(false);
    });

    it('should recreate DOM element when width changes from 1 to 4', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.One)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const initialCard = fixture.nativeElement.querySelector('.chart-card');
      expect(initialCard.classList.contains('chart-card-width-1')).toBe(true);

      host.charts.set([createChart('chart-1', ChartWidth.Four)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const updatedCard = fixture.nativeElement.querySelector('.chart-card');
      expect(updatedCard.classList.contains('chart-card-width-4')).toBe(true);
      expect(updatedCard.classList.contains('chart-card-width-1')).toBe(false);
    });
  });

  describe('empty slots calculation', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideEchartsCore({ echarts })],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    it('should show 4 empty slots when no charts exist', async () => {
      host.charts.set([]);
      fixture.detectChanges();
      await fixture.whenStable();

      const emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(4);
    });

    it('should show 3 empty slots when one width-1 chart exists', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.One)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(3);
    });

    it('should show 2 empty slots when one width-2 chart exists', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Two)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(2);
    });

    it('should show 1 empty slot when one width-3 chart exists', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Three)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(1);
    });

    it('should show 0 empty slots when one width-4 chart exists (full row)', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Four)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(0);
    });

    it('should show 0 empty slots when four width-1 charts fill the row', async () => {
      host.charts.set([
        createChart('chart-1', ChartWidth.One),
        createChart('chart-2', ChartWidth.One),
        createChart('chart-3', ChartWidth.One),
        createChart('chart-4', ChartWidth.One),
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(0);
    });

    it('should show 1 empty slot when charts use 3 columns total', async () => {
      host.charts.set([
        createChart('chart-1', ChartWidth.Two),
        createChart('chart-2', ChartWidth.One),
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(1);
    });
  });

  describe('full-width add button', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideEchartsCore({ echarts })],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    it('should not show full-width button when no charts exist', async () => {
      host.charts.set([]);
      fixture.detectChanges();
      await fixture.whenStable();

      const fullWidthBtn = fixture.nativeElement.querySelector('.empty-slot-full-width');
      expect(fullWidthBtn).toBeNull();
    });

    it('should show full-width button when row is complete (4 columns used)', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Four)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const fullWidthBtn = fixture.nativeElement.querySelector('.empty-slot-full-width');
      expect(fullWidthBtn).not.toBeNull();
    });

    it('should show full-width button when multiple charts fill a row', async () => {
      host.charts.set([
        createChart('chart-1', ChartWidth.Two),
        createChart('chart-2', ChartWidth.Two),
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const fullWidthBtn = fixture.nativeElement.querySelector('.empty-slot-full-width');
      expect(fullWidthBtn).not.toBeNull();
    });

    it('should not show full-width button when row is incomplete', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Three)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const fullWidthBtn = fixture.nativeElement.querySelector('.empty-slot-full-width');
      expect(fullWidthBtn).toBeNull();
    });
  });

  describe('chart removal', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideEchartsCore({ echarts })],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    it('should emit removeChart when delete button is clicked and confirmed', async () => {
      const chart = createChart('chart-1', ChartWidth.Two);
      host.charts.set([chart]);
      fixture.detectChanges();
      await fixture.whenStable();

      const removeChartSpy = vi.fn();
      host.onRemoveChart = removeChartSpy;

      // Click the delete button on the chart
      const deleteBtn = fixture.nativeElement.querySelector('.chart-action-btn-danger');
      deleteBtn.click();
      fixture.detectChanges();
      await fixture.whenStable();

      // Confirmation dialog should now be open - click the Delete button to confirm
      const confirmDeleteBtn = fixture.nativeElement.querySelector(
        '.ccms-dialog__button--danger-action',
      );
      expect(confirmDeleteBtn).not.toBeNull();
      confirmDeleteBtn.click();
      fixture.detectChanges();

      expect(removeChartSpy).toHaveBeenCalledWith(chart);
    });

    it('should not emit removeChart when delete is cancelled', async () => {
      const chart = createChart('chart-1', ChartWidth.Two);
      host.charts.set([chart]);
      fixture.detectChanges();
      await fixture.whenStable();

      const removeChartSpy = vi.fn();
      host.onRemoveChart = removeChartSpy;

      // Click the delete button on the chart
      const deleteBtn = fixture.nativeElement.querySelector('.chart-action-btn-danger');
      deleteBtn.click();
      fixture.detectChanges();
      await fixture.whenStable();

      // Confirmation dialog should now be open - click the Cancel button (first button without danger class)
      const cancelBtn = fixture.nativeElement.querySelector(
        '.ccms-dialog__actions-right .ccms-dialog__button:not(.ccms-dialog__button--danger-action)',
      );
      expect(cancelBtn).not.toBeNull();
      cancelBtn.click();
      fixture.detectChanges();

      expect(removeChartSpy).not.toHaveBeenCalled();
    });

    it('should show generic message in confirmation dialog when chart has no title', async () => {
      // Create a chart without a title
      const chart: Chart = {
        id: 'chart-no-title',
        config: {
          title: '',
          description: '',
          chartType: ChartType.Bar,
          measure: Measure.Objects,
          groupBy: GroupBy.ContentType,
          width: ChartWidth.Two,
        },
        data: [{ name: 'Test', value: 10 }],
      };
      host.charts.set([chart]);
      fixture.detectChanges();
      await fixture.whenStable();

      // Click the delete button on the chart
      const deleteBtn = fixture.nativeElement.querySelector('.chart-action-btn-danger');
      deleteBtn.click();
      fixture.detectChanges();
      await fixture.whenStable();

      // Check the dialog description shows generic message
      const dialogDescription = fixture.nativeElement.querySelector('.ccms-dialog__description');
      expect(dialogDescription).not.toBeNull();
      expect(dialogDescription.textContent).toContain(
        'Are you sure you want to delete this chart?',
      );
    });

    it('should update empty slots when chart is removed', async () => {
      host.charts.set([
        createChart('chart-1', ChartWidth.Two),
        createChart('chart-2', ChartWidth.One),
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      let emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(1); // 3 columns used, 1 empty

      // Remove second chart
      host.charts.set([createChart('chart-1', ChartWidth.Two)]);
      fixture.detectChanges();
      await fixture.whenStable();

      emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(2); // 2 columns used, 2 empty
    });
  });

  describe('keyboard reordering', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideEchartsCore({ echarts })],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    it('should emit reorder when ArrowRight is pressed on drag handle', async () => {
      const chart1 = createChart('chart-1', ChartWidth.One);
      const chart2 = createChart('chart-2', ChartWidth.One);
      host.charts.set([chart1, chart2]);
      fixture.detectChanges();
      await fixture.whenStable();

      const reorderSpy = vi.fn();
      host.onReorder = reorderSpy;

      const dragHandles = fixture.nativeElement.querySelectorAll('.drag-handle');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      dragHandles[0].dispatchEvent(event);
      fixture.detectChanges();

      expect(reorderSpy).toHaveBeenCalledWith([chart2, chart1]);
    });

    it('should emit reorder when ArrowLeft is pressed on drag handle', async () => {
      const chart1 = createChart('chart-1', ChartWidth.One);
      const chart2 = createChart('chart-2', ChartWidth.One);
      host.charts.set([chart1, chart2]);
      fixture.detectChanges();
      await fixture.whenStable();

      const reorderSpy = vi.fn();
      host.onReorder = reorderSpy;

      const dragHandles = fixture.nativeElement.querySelectorAll('.drag-handle');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      dragHandles[1].dispatchEvent(event);
      fixture.detectChanges();

      expect(reorderSpy).toHaveBeenCalledWith([chart2, chart1]);
    });

    it('should not emit reorder when moving first chart left', async () => {
      const chart1 = createChart('chart-1', ChartWidth.One);
      const chart2 = createChart('chart-2', ChartWidth.One);
      host.charts.set([chart1, chart2]);
      fixture.detectChanges();
      await fixture.whenStable();

      const reorderSpy = vi.fn();
      host.onReorder = reorderSpy;

      const dragHandles = fixture.nativeElement.querySelectorAll('.drag-handle');
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      dragHandles[0].dispatchEvent(event);
      fixture.detectChanges();

      expect(reorderSpy).not.toHaveBeenCalled();
    });

    it('should not emit reorder when moving last chart right', async () => {
      const chart1 = createChart('chart-1', ChartWidth.One);
      const chart2 = createChart('chart-2', ChartWidth.One);
      host.charts.set([chart1, chart2]);
      fixture.detectChanges();
      await fixture.whenStable();

      const reorderSpy = vi.fn();
      host.onReorder = reorderSpy;

      const dragHandles = fixture.nativeElement.querySelectorAll('.drag-handle');
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      dragHandles[1].dispatchEvent(event);
      fixture.detectChanges();

      expect(reorderSpy).not.toHaveBeenCalled();
    });
  });

  describe('chart type display', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideEchartsCore({ echarts })],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    it('should render bar chart component for bar chart type', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Two, ChartType.Bar)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const barChart = fixture.nativeElement.querySelector('ccms-bar-chart');
      const pieChart = fixture.nativeElement.querySelector('ccms-pie-chart');
      expect(barChart).not.toBeNull();
      expect(pieChart).toBeNull();
    });

    it('should render pie chart component for pie chart type', async () => {
      host.charts.set([createChart('chart-1', ChartWidth.Two, ChartType.Pie)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const barChart = fixture.nativeElement.querySelector('ccms-bar-chart');
      const pieChart = fixture.nativeElement.querySelector('ccms-pie-chart');
      expect(barChart).toBeNull();
      expect(pieChart).not.toBeNull();
    });
  });

  describe('multiple chart layout', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideEchartsCore({ echarts })],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    it('should render correct number of chart cards', async () => {
      host.charts.set([
        createChart('chart-1', ChartWidth.One),
        createChart('chart-2', ChartWidth.Two),
        createChart('chart-3', ChartWidth.One),
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const chartCards = fixture.nativeElement.querySelectorAll('.chart-card');
      expect(chartCards.length).toBe(3);
    });

    it('should apply correct width classes to multiple charts', async () => {
      host.charts.set([
        createChart('chart-1', ChartWidth.One),
        createChart('chart-2', ChartWidth.Two),
        createChart('chart-3', ChartWidth.Three),
        createChart('chart-4', ChartWidth.Four),
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const chartCards = fixture.nativeElement.querySelectorAll('.chart-card');
      expect(chartCards[0].classList.contains('chart-card-width-1')).toBe(true);
      expect(chartCards[1].classList.contains('chart-card-width-2')).toBe(true);
      expect(chartCards[2].classList.contains('chart-card-width-3')).toBe(true);
      expect(chartCards[3].classList.contains('chart-card-width-4')).toBe(true);
    });

    it('should update layout when chart width changes in middle of list', async () => {
      const chart1 = createChart('chart-1', ChartWidth.One);
      const chart2 = createChart('chart-2', ChartWidth.One);
      const chart3 = createChart('chart-3', ChartWidth.One);
      host.charts.set([chart1, chart2, chart3]);
      fixture.detectChanges();
      await fixture.whenStable();

      // 3 width-1 charts = 3 columns, 1 empty slot
      let emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(1);

      // Change middle chart to width 2
      host.charts.set([chart1, createChart('chart-2', ChartWidth.Two), chart3]);
      fixture.detectChanges();
      await fixture.whenStable();

      // 1 + 2 + 1 = 4 columns, 0 empty slots, full-width button shown
      emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(0);

      const fullWidthBtn = fixture.nativeElement.querySelector('.empty-slot-full-width');
      expect(fullWidthBtn).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let host: TestHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideEchartsCore({ echarts })],
      }).compileComponents();

      fixture = TestBed.createComponent(TestHostComponent);
      host = fixture.componentInstance;
    });

    it('should handle chart with missing width by defaulting to width 1', async () => {
      // Create a chart with config missing width property
      const chartWithoutWidth: Chart = {
        id: 'chart-no-width',
        config: {
          title: 'No Width Chart',
          description: '',
          chartType: ChartType.Bar,
          measure: Measure.Objects,
          groupBy: GroupBy.ContentType,
        } as ChartConfig, // Cast to bypass TypeScript check
        data: [{ name: 'Test', value: 10 }],
      };

      host.charts.set([chartWithoutWidth]);
      fixture.detectChanges();
      await fixture.whenStable();

      // Chart should render (not crash)
      const chartCards = fixture.nativeElement.querySelectorAll('.chart-card');
      expect(chartCards.length).toBe(1);

      // Should have 3 empty slots (defaulting to width 1)
      const emptySlots = fixture.nativeElement.querySelectorAll(
        '.empty-slot:not(.empty-slot-full-width)',
      );
      expect(emptySlots.length).toBe(3);
    });

    it('should use different track keys for same chart ID with different widths', async () => {
      // This test verifies that changing width creates a new DOM element
      // by checking that the element is recreated (not just updated)
      const chartId = 'test-chart';

      // Start with width 4
      host.charts.set([createChart(chartId, ChartWidth.Four)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const initialCard = fixture.nativeElement.querySelector('.chart-card');

      // Add a marker to track the element
      initialCard.setAttribute('data-test-marker', 'original');

      // Change to width 1 (same chart ID)
      host.charts.set([createChart(chartId, ChartWidth.One)]);
      fixture.detectChanges();
      await fixture.whenStable();

      const updatedCard = fixture.nativeElement.querySelector('.chart-card');

      // The marker should be gone because it's a new DOM element
      expect(updatedCard.getAttribute('data-test-marker')).toBeNull();
    });

    it('should preserve chart order when one chart changes width', async () => {
      host.charts.set([
        createChart('chart-1', ChartWidth.One),
        createChart('chart-2', ChartWidth.Two),
        createChart('chart-3', ChartWidth.One),
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      // Change middle chart width
      host.charts.set([
        createChart('chart-1', ChartWidth.One),
        createChart('chart-2', ChartWidth.Four), // Changed from 2 to 4
        createChart('chart-3', ChartWidth.One),
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      const chartCards = fixture.nativeElement.querySelectorAll('.chart-card');
      expect(chartCards.length).toBe(3);

      // Verify the middle chart now has width-4 class
      expect(chartCards[1].classList.contains('chart-card-width-4')).toBe(true);
    });
  });
});

@Component({
  selector: 'app-test-host',
  imports: [CustomChartListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ccms-custom-chart-list
      [charts]="charts()"
      [fields]="fields()"
      (addChart)="onAddChart($event)"
      (updateChart)="onUpdateChart($event)"
      (removeChart)="onRemoveChart($event)"
      (reorder)="onReorder($event)"
    />
  `,
})
class TestHostComponent {
  charts = signal<Chart[]>([]);
  fields = signal<Field[]>([
    {
      name: 'contentType',
      displayName: 'Content Type',
      type: 'text',
      multiSelect: true,
      metadata: false,
    },
    {
      name: 'fileStatus',
      displayName: 'File Status',
      type: 'text',
      multiSelect: true,
      metadata: false,
    },
  ]);

  onAddChart = vi.fn();
  onUpdateChart = vi.fn();
  onRemoveChart = vi.fn();
  onReorder = vi.fn();
}
