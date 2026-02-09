import { StackedBarChartData } from '../charts/bar-chart-options';
import { LineChartData } from '../charts/line-chart-options';
import { enumToFriendly } from '../../utils/text.util';
import { QualityReportSummary } from './quality-report.service';

export function objectToSeries(obj: Record<string, number>): { name: string; value: number }[] {
  return Object.entries(obj).map(([key, value]) => ({
    name: key,
    value: value,
  }));
}

export function summariesToCategoryTrendData(data: QualityReportSummary[]): LineChartData[] {
  const reversed = [...data].reverse();

  const categories = Array.from(
    new Set(reversed.flatMap((d) => Object.keys(d.issuesByCategory))),
  ).filter((s) => s !== 'UNKNOWN');

  return reversed.flatMap((summary) => {
    const category = new Date(parseInt(summary.scanTimestamp) * 1000).toLocaleString();
    return categories.map((cat) => ({
      category,
      series: enumToFriendly(cat),
      value: summary.issuesByCategory[cat] ?? 0,
    }));
  });
}

export function summariesToSeverityTrendData(data: QualityReportSummary[]): LineChartData[] {
  const reversed = [...data].reverse();

  const severities = Array.from(new Set(reversed.flatMap((d) => Object.keys(d.issuesBySeverity))));

  return reversed.flatMap((summary) => {
    const category = new Date(parseInt(summary.scanTimestamp) * 1000).toLocaleString();
    return severities.map((sev) => ({
      category,
      series: enumToFriendly(sev),
      value: summary.issuesBySeverity[sev] ?? 0,
    }));
  });
}

export function summariesToIssuesOverTimeData(data: QualityReportSummary[]): StackedBarChartData[] {
  const reversed = [...data].reverse();

  const severities: { key: keyof QualityReportSummary; label: string }[] = [
    { key: 'topicsWithCritical', label: 'Critical' },
    { key: 'topicsWithError', label: 'Error' },
    { key: 'topicsWithWarning', label: 'Warning' },
    { key: 'topicsWithInfo', label: 'Info' },
  ];

  return reversed.flatMap((summary) => {
    const category = new Date(parseInt(summary.scanTimestamp) * 1000).toLocaleString();
    return severities.map(({ key, label }) => ({
      category,
      stack: label,
      value: summary[key] as number,
    }));
  });
}
