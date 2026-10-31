import { useEffect } from 'react';
import { AccessibilityInfo, Modal, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { kg, percent, points, trend } from '@/components/ui/format';
import type { LogResult } from '@/hooks/use-track';

const REASON_LABELS: Record<string, string> = {
  daily_log: 'Logging today',
  reduction: 'Beating your baseline',
  streak: 'Keeping your streak',
  goal: 'Goal progress',
};

/**
 * Built entirely from the mutation response — the new number, the delta, the reward and the
 * streak all come back from `POST /track/logs`, so this never refetches (PRD-v2 §6.3).
 */
export function ResultSheet({ result, onClose }: { result: LogResult; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  const delta = trend(result.deltaKg, {
    down: 'below your baseline',
    up: 'above your baseline',
    flat: 'level with your baseline',
  });

  const announcement = [
    `Logged. Today: ${kg(result.breakdown.totalKg)} kilograms CO2 equivalent,`,
    delta.tone === 'flat'
      ? 'level with your baseline.'
      : `${kg(delta.magnitude)} kilograms ${delta.word}.`,
    `You earned ${points(result.reward.pointsDelta)} points and ${points(result.reward.coinsDelta)} coins.`,
    `Streak: ${result.streak.current} days.`,
  ].join(' ');

  // A modal appearing is not an announcement on its own — TalkBack and VoiceOver need telling.
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(announcement);
  }, [announcement]);

  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View className="flex-1 justify-end bg-eco-950/40">
        <View
          accessibilityViewIsModal
          className="rounded-t-3xl border-t border-border bg-card"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text
              accessibilityRole="header"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Logged
            </Text>

            <Text
              accessibilityLabel={`Today: ${kg(result.breakdown.totalKg)} kilograms of CO2 equivalent`}
              className="mt-2 text-4xl font-bold text-foreground"
            >
              {kg(result.breakdown.totalKg)}
              <Text className="text-lg font-semibold text-muted-foreground"> kg CO₂e</Text>
            </Text>

            <Text
              accessibilityLabel={
                delta.tone === 'flat'
                  ? 'Level with your baseline'
                  : `${kg(delta.magnitude)} kilograms ${delta.word}, a ${percent(Math.abs(result.reductionPct))} change`
              }
              className={`mt-1 text-base font-semibold ${
                delta.tone === 'good'
                  ? 'text-eco-700'
                  : delta.tone === 'bad'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
              }`}
            >
              {delta.tone === 'flat'
                ? `= ${delta.word}`
                : `${delta.arrow} ${kg(delta.magnitude)} kg ${delta.word} · ${percent(Math.abs(result.reductionPct))}`}
            </Text>

            <View className="mt-5 rounded-2xl bg-secondary p-4">
              <Text
                accessibilityLabel={`You earned ${points(result.reward.pointsDelta)} points and ${points(result.reward.coinsDelta)} coins`}
                className="text-base font-semibold text-eco-900"
              >
                +{points(result.reward.pointsDelta)} points · +{points(result.reward.coinsDelta)}{' '}
                coins
              </Text>
              {result.reward.reasons.length > 0 ? (
                <View className="mt-2 gap-1">
                  {result.reward.reasons.map((reason) => (
                    <Text
                      key={reason.source}
                      accessibilityLabel={`${REASON_LABELS[reason.source] ?? reason.source}: ${points(reason.points)} points, ${points(reason.coins)} coins`}
                      className="text-sm text-eco-800"
                    >
                      {REASON_LABELS[reason.source] ?? reason.source} · +{points(reason.points)} pts
                      · +{points(reason.coins)} coins
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>

            <Text
              accessibilityLabel={`Your streak is now ${result.streak.current} days. Your longest is ${result.streak.longest}.`}
              className="mt-4 text-base font-semibold text-foreground"
            >
              🔥 {result.streak.current}-day streak
              <Text className="text-sm font-normal text-muted-foreground">
                {'  '}Best {result.streak.longest}
              </Text>
            </Text>

            {result.clamped ? (
              <Text className="mt-4 text-sm text-muted-foreground">
                ⚠ We floored today at the lowest plausible figure — a real day is never quite zero.
              </Text>
            ) : null}

            <Button label="Done" onPress={onClose} className="mt-6" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
