import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '@/lib/theme';
import { T } from './text';

export function Gauge({
  progress,
  size = 220,
  stroke = 12,
  track = 'rgba(244,246,238,0.2)',
  color = colors.lime,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  track?: string;
  color?: string;
}) {
  const shown = Math.min(1, Math.max(0, progress));
  const radius = (size - stroke) / 2;
  const cy = radius + stroke / 2;
  const arc = `M ${stroke / 2} ${cy} A ${radius} ${radius} 0 0 1 ${size - stroke / 2} ${cy}`;
  const length = Math.PI * radius;
  return (
    <Svg width={size} height={cy + stroke / 2} viewBox={`0 0 ${size} ${cy + stroke / 2}`}>
      <Path d={arc} stroke={track} strokeWidth={stroke} fill="none" strokeLinecap="round" />
      {shown > 0 ? (
        <Path
          d={arc}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${length * shown} ${length}`}
        />
      ) : null}
    </Svg>
  );
}

export function Stat({
  label,
  value,
  tone = 'dark',
}: {
  label: string;
  value: string;
  tone?: 'dark' | 'light';
}) {
  const labelColor = tone === 'dark' ? 'text-eco-100' : 'text-muted-foreground';
  const valueColor = tone === 'dark' ? 'text-cream' : 'text-ink';
  return (
    <View className="flex-1">
      <T weight="semibold" className={`text-[11px] uppercase tracking-wide ${labelColor}`}>
        {label}
      </T>
      <T weight="extrabold" className={`mt-1 text-base ${valueColor}`}>
        {value}
      </T>
    </View>
  );
}
