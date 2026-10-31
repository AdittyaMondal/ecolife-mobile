import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BathingQuestion } from '@/components/blocks/track/bathing-question';
import { CoolingQuestion } from '@/components/blocks/track/cooling-question';
import { type Meals, MealsQuestion } from '@/components/blocks/track/meals-question';
import { ResultSheet } from '@/components/blocks/track/result-sheet';
import { TrackSkeleton } from '@/components/blocks/track/track-skeleton';
import {
  TravelQuestion,
  type TripRow,
  toTripRow,
  tripRowsToTrips,
} from '@/components/blocks/track/travel-question';
import { WasteQuestion } from '@/components/blocks/track/waste-question';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import {
  type AcHoursBucket,
  type BathChoice,
  type DailyAnswers,
  type TrackToday,
  useSubmitLog,
  useTrackToday,
  type WasteAction,
} from '@/hooks/use-track';

/**
 * "edits are open until 2 AM" — `editableUntil` is an ISO instant; the device localises it.
 * Null when it will not parse, so the caller drops the clause instead of rendering "until .".
 */
function editWindowLabel(editableUntil: string): string | null {
  const date = new Date(editableUntil);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Mounted only once `trackToday` has loaded, so every `useState` initialiser runs exactly once
 * with real data — no effect syncing props into state.
 */
function TrackForm({ today }: { today: TrackToday }) {
  // An existing log is the truth for prefill; `defaults` is only what "Same as usual" fills.
  const prefill: DailyAnswers = today.existingLog?.answers ?? today.defaults;

  const [rows, setRows] = useState<TripRow[]>(() => (prefill.trips ?? []).map(toTripRow));
  const [meals, setMeals] = useState<Meals>(() => ({
    vegMeals: prefill.vegMeals ?? 0,
    nonVegMeals: prefill.nonVegMeals ?? 0,
    veganMeals: prefill.veganMeals ?? 0,
  }));
  const [acHoursBucket, setAcHoursBucket] = useState<AcHoursBucket | undefined>(
    prefill.acHoursBucket,
  );
  const [bathChoice, setBathChoice] = useState<BathChoice | undefined>(prefill.bathChoice);
  const [wasteActions, setWasteActions] = useState<WasteAction[]>(() => prefill.wasteActions ?? []);

  const submit = useSubmitLog();

  const handleSubmit = () => {
    const answers: DailyAnswers = {
      // Omitted, not empty: a skipped category falls back to the baseline (PRD-v2 §3.5),
      // whereas `trips: []` would claim the user travelled nowhere.
      ...(rows.length > 0 ? { trips: tripRowsToTrips(rows) } : {}),
      vegMeals: meals.vegMeals,
      nonVegMeals: meals.nonVegMeals,
      veganMeals: meals.veganMeals,
      ...(today.askCooling && acHoursBucket !== undefined ? { acHoursBucket } : {}),
      ...(bathChoice !== undefined ? { bathChoice } : {}),
      ...(wasteActions.length > 0 ? { wasteActions } : {}),
    };

    submit.mutate({
      logDate: today.date,
      answers,
      existingLogId: today.existingLog?.id,
    });
  };

  const existingLog = today.existingLog;

  return (
    <>
      <Text accessibilityRole="header" className="text-2xl font-bold text-foreground">
        Today
      </Text>
      <Text className="text-sm text-muted-foreground">Five questions, about thirty seconds.</Text>

      {existingLog !== null ? (
        <View
          accessibilityRole="alert"
          className="rounded-2xl border border-border bg-secondary p-4"
        >
          <Text className="text-sm font-semibold text-eco-900">✓ Today is already logged</Text>
          <Text className="mt-1 text-sm text-eco-800">
            {editWindowLabel(existingLog.editableUntil) === null
              ? 'You can still change your answers today.'
              : `You can change your answers until ${editWindowLabel(existingLog.editableUntil)}.`}
          </Text>
        </View>
      ) : null}

      <TravelQuestion rows={rows} onChange={setRows} usualTrips={today.defaults.trips ?? []} />
      <MealsQuestion meals={meals} onChange={setMeals} />
      {/* Never asked when the profile reports no cooling (PRD-v2 §3.4). */}
      {today.askCooling ? (
        <CoolingQuestion value={acHoursBucket} onChange={setAcHoursBucket} />
      ) : null}
      <BathingQuestion value={bathChoice} onChange={setBathChoice} />
      <WasteQuestion value={wasteActions} onChange={setWasteActions} />

      {submit.isError ? <ErrorState error={submit.error} onRetry={handleSubmit} /> : null}

      <Button
        label={
          submit.isPending
            ? 'Saving…'
            : existingLog !== null
              ? "Update today's log"
              : "Save today's log"
        }
        onPress={handleSubmit}
        disabled={submit.isPending}
        accessibilityHint="Sends today's answers and shows what you earned"
      />

      {submit.data !== undefined ? (
        <ResultSheet result={submit.data} onClose={() => submit.reset()} />
      ) : null}
    </>
  );
}

/**
 * Track — PRD-v2 §3.4 and §6.3. The offline queue is MOB-10/MOB-11; this wires the mutation
 * straight through.
 */
export default function Track() {
  const insets = useSafeAreaInsets();
  const today = useTrackToday();

  return (
    <ScrollView
      className="flex-1 bg-background"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
    >
      <View className="gap-4 px-5">
        {today.isPending ? (
          <TrackSkeleton />
        ) : today.isError ? (
          <ErrorState error={today.error} onRetry={() => today.refetch()} />
        ) : (
          <TrackForm
            // A new day is a new form: remount rather than reconcile yesterday's answers.
            key={today.data.date}
            today={today.data}
          />
        )}
      </View>
    </ScrollView>
  );
}
