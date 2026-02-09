import { IconName } from '@ccms/components/icon/icon';

export interface CalloutConfig {
  id: string;
  label: string;
  info?: string;
  suffix?: string;
  icon?: IconName;
  compact?: boolean;
  compactThreshold?: number;
}
