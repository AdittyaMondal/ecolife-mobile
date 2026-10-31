import { View } from 'react-native';

type Props = {
  /** 0–100. Values outside the range are clamped rather than overflowing the track. */
  percent: number;
  /** Required: a bare bar tells a screen reader nothing. */
  label: string;
  tone?: 'primary' | 'warning';
};

export function ProgressBar({ percent, label, tone = 'primary' }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      className="h-3 w-full overflow-hidden rounded-full bg-muted"
    >
      <View
        className={`h-3 rounded-full ${tone === 'warning' ? 'bg-destructive' : 'bg-primary'}`}
        style={{ width: `${clamped}%` }}
      />
    </View>
  );
}
