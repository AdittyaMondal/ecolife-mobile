import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Screen, TopBar } from '@/components/ui/header';
import { Button, ChoiceTile, Note, SoftCard } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import {
  AC_OPTIONS,
  BATH_OPTIONS,
  COMMUTE_OPTIONS,
  FOOD_OPTIONS,
  mealsFromChoice,
  WASTE_OPTIONS,
} from '@/data/content';
import { useTrackModel } from '@/hooks/resources';
import { useMeasuredCommute } from '@/hooks/use-commute';
import { estimateDaily } from '@/lib/carbon';
import { errorMessage } from '@/lib/errors';
import { categoryShare, formatKg, formatShortDate, signedKg, weekdayLabel } from '@/lib/format';
import type { DailyAnswers, TripMode } from '@/types/domain';

type StepId = 'mode' | 'distance' | 'food' | 'home' | 'waste' | 'org';

export default function Track() {
  const model = useTrackModel();
  const [editing, setEditing] = useState(false);
  if (model.logged && !editing) return <Summary model={model} onEdit={() => setEditing(true)} />;
  return (
    <Wizard
      model={model}
      initial={editing ? model.savedAnswers : null}
      onDone={() => setEditing(false)}
    />
  );
}

function Summary({
  model,
  onEdit,
}: {
  model: ReturnType<typeof useTrackModel>;
  onEdit: () => void;
}) {
  const breakdown = model.breakdown;
  const max = Math.max(1, ...model.history.map((point) => point.totalKg));
  return (
    <Screen dock>
      <TopBar eyebrow={model.today} title="Today is logged" avatar />
      {!model.synced ? (
        <View className="mb-4">
          <Note>
            {`Saved on this phone${model.pointsToday ? ` with ${model.pointsToday} points` : ''}. EcoLife has not confirmed the log yet.`}
          </Note>
        </View>
      ) : null}
      <View className="rounded-[32px] bg-secondary p-5">
        <T className="text-xs uppercase tracking-widest text-eco-100">Today</T>
        <T weight="extrabold" className="mt-1 text-5xl text-cream">
          {breakdown ? formatKg(breakdown.totalKg) : '—'}
        </T>
        <T className="text-eco-100">kg CO₂e</T>
        <View className="mt-4 flex-row justify-between">
          <View>
            <T className="text-xs text-eco-100">Baseline</T>
            <T weight="bold" className="text-cream">
              {formatKg(model.baselineKg)} kg
            </T>
          </View>
          <View>
            <T className="text-xs text-eco-100">Difference</T>
            <T weight="bold" className="text-cream">
              {model.deltaKg === null ? '—' : signedKg(model.deltaKg)}
            </T>
          </View>
          <View>
            <T className="text-xs text-eco-100">Streak</T>
            <T weight="bold" className="text-cream">
              {model.streak} days
            </T>
          </View>
        </View>
      </View>
      {breakdown ? (
        <View className="mt-4 gap-2">
          {model.categories.map((category) => (
            <View
              key={category.key}
              className="flex-row items-center justify-between rounded-[20px] bg-card px-4 py-3"
            >
              <T weight="semibold">{category.label}</T>
              <T weight="bold" className="text-forest">
                {formatKg(breakdown[category.key])} kg ·{' '}
                {categoryShare(breakdown[category.key], breakdown.totalKg)}%
              </T>
            </View>
          ))}
        </View>
      ) : null}
      <T weight="extrabold" className="mb-3 mt-6 text-xl text-ink">
        Last two weeks
      </T>
      <SoftCard>
        <View className="h-36 flex-row items-end justify-between gap-1">
          {model.history.slice(-7).map((point) => (
            <View key={point.date} className="flex-1 items-center">
              <View
                className={`w-full rounded-t-xl ${point.logged ? 'bg-primary' : 'bg-muted'}`}
                style={{ height: Math.max(8, (point.totalKg / max) * 110) }}
              />
              <T className="mt-1 text-[10px] text-muted-foreground">
                {weekdayLabel(point.date).slice(0, 1)}
              </T>
            </View>
          ))}
        </View>
        <T className="mt-3 text-xs text-muted-foreground">
          {model.history.filter((point) => point.logged).length} logged days · latest{' '}
          {formatShortDate(model.today)}
        </T>
      </SoftCard>
      <View className="mt-4">
        <Button label="Update today’s answers" variant="outline" onPress={onEdit} />
      </View>
    </Screen>
  );
}

function Wizard({
  model,
  initial,
  onDone,
}: {
  model: ReturnType<typeof useTrackModel>;
  initial: DailyAnswers | null;
  onDone: () => void;
}) {
  const steps: StepId[] = [
    'mode',
    'distance',
    'food',
    'home',
    'waste',
    ...(model.orgQuestions.length ? (['org'] as const) : []),
  ];
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<TripMode | null>(initial?.trips?.[0]?.mode ?? null);
  const measured = useMeasuredCommute(mode);
  const [food, setFood] = useState<string | null>(foodFromAnswers(initial));
  const [ac, setAc] = useState<DailyAnswers['acHoursBucket'] | null>(
    initial?.acHoursBucket ?? null,
  );
  const [bath, setBath] = useState<DailyAnswers['bathChoice'] | null>(initial?.bathChoice ?? null);
  const [waste, setWaste] = useState<NonNullable<DailyAnswers['wasteActions']>>(
    initial?.wasteActions ?? [],
  );
  const [org, setOrg] = useState<Record<string, string>>(model.savedOrg);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<{
    source: 'api' | 'device';
    credited: 'api' | 'device';
    total: number;
    delta: number;
    points: number;
  } | null>(null);

  const step = steps[index] ?? 'mode';
  const km = mode === 'work_from_home' ? 0 : (measured ?? 0);
  const ready = stepReady(step, {
    mode,
    food,
    ac,
    bath,
    waste,
    org,
    askCooling: model.askCooling,
    orgQuestions: model.orgQuestions,
  });
  const cooling = model.askCooling ? ac : '0';
  const answers =
    mode && food && bath && cooling ? currentAnswers(mode, km, food, cooling, bath, waste) : null;
  const preview = answers && index === steps.length - 1 ? estimateDaily(answers, null) : null;

  function toggleWaste(value: WasteAction) {
    if (value === 'none_of_these') {
      setWaste(['none_of_these']);
      return;
    }
    setWaste((current) => {
      const without = current.filter((item) => item !== 'none_of_these' && item !== value);
      return current.includes(value) ? without : [...without, value];
    });
  }

  async function submit() {
    if (!answers) return;
    setPending(true);
    setError(null);
    try {
      const result = await model.submit(answers, org);
      setDone({
        source: result.source,
        credited: result.reward.source,
        total: result.breakdown.totalKg,
        delta: result.deltaKg,
        points: result.points,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <Screen dock footer={<Button label="Done" variant="forest" onPress={onDone} />}>
        <TopBar eyebrow="Check-in" title="Logged" />
        <T weight="extrabold" className="text-5xl text-ink">
          {formatKg(done.total)} kg
        </T>
        <T className="mt-1 text-base text-muted-foreground">
          {signedKg(done.delta)} versus your baseline
        </T>
        <View className="mt-4">
          {done.credited === 'api' ? (
            <Note>{`EcoLife recorded this log and added ${done.points} points.`}</Note>
          ) : (
            <Note>
              {`Today counts for ${done.points} points on this phone. EcoLife adds them to your account when it confirms the reward.`}
            </Note>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      dock
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Back"
              variant="outline"
              disabled={index === 0 || pending}
              onPress={() => setIndex((value) => Math.max(0, value - 1))}
            />
          </View>
          <View className="flex-[1.4]">
            <Button
              label={index === steps.length - 1 ? 'Finish' : 'Next'}
              disabled={!ready}
              loading={pending}
              onPress={() => {
                if (!ready) return;
                if (index === steps.length - 1) void submit();
                else setIndex((value) => value + 1);
              }}
            />
          </View>
        </View>
      }
    >
      <TopBar eyebrow={`Question ${index + 1} of ${steps.length}`} title="Daily check-in" />
      <View className="mb-4 h-2 flex-row gap-1">
        {steps.map((id, stepIndex) => (
          <View
            key={id}
            className={`h-2 flex-1 rounded-full ${stepIndex <= index ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </View>
      <Animated.View key={step} entering={FadeInRight.duration(220)}>
        {step === 'mode' ? (
          <>
            <Prompt title="How did you travel?" subtitle="Select one, then tap Next." />
            <View className="mt-5 flex-row flex-wrap justify-between gap-y-3">
              {COMMUTE_OPTIONS.map((option) => (
                <View key={option.value} className="w-[48%]">
                  <ChoiceTile
                    label={option.label}
                    selected={mode === option.value}
                    onPress={() => setMode(option.value as TripMode)}
                  />
                </View>
              ))}
            </View>
          </>
        ) : null}
        {step === 'distance' ? (
          <>
            <Prompt
              title={mode === 'work_from_home' ? 'No trip today' : 'Distance'}
              subtitle="This comes from the phone. Tap Next when it looks right."
            />
            {mode === 'work_from_home' ? (
              <View className="mt-5">
                <Note>Staying home counts as 0 km.</Note>
              </View>
            ) : (
              <View className="mt-6">
                <T weight="extrabold" className="text-5xl text-ink">
                  {measured == null ? '—' : `${km} km`}
                </T>
                <View className="mt-3">
                  <Note>
                    {measured == null
                      ? 'No trip recorded yet. You can still continue, and this stays at 0 km.'
                      : 'One-way distance from this morning to where the phone spent the day.'}
                  </Note>
                </View>
              </View>
            )}
          </>
        ) : null}
        {step === 'food' ? (
          <>
            <Prompt title="What did you eat?" subtitle="Select one, then tap Next." />
            <View className="mt-5 gap-3">
              {FOOD_OPTIONS.map((option) => (
                <ChoiceTile
                  key={option.value}
                  label={option.label}
                  hint={option.hint}
                  selected={food === option.value}
                  onPress={() => setFood(option.value)}
                />
              ))}
            </View>
          </>
        ) : null}
        {step === 'home' ? (
          <>
            <Prompt
              title="Home"
              subtitle={
                model.askCooling
                  ? 'Choose cooling and a bath, then tap Next.'
                  : 'Choose how you bathed, then tap Next.'
              }
            />
            {model.askCooling ? (
              <>
                <T weight="bold" className="mb-2 mt-5 text-ink">
                  Cooling
                </T>
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {AC_OPTIONS.map((option) => (
                    <View key={option.value} className="w-[48%]">
                      <ChoiceTile
                        label={option.label}
                        selected={ac === option.value}
                        onPress={() => setAc(option.value as DailyAnswers['acHoursBucket'])}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View className="mt-5">
                <Note>Cooling stays off for your profile.</Note>
              </View>
            )}
            <T weight="bold" className="mb-2 mt-5 text-ink">
              Bath
            </T>
            <View className="gap-3">
              {BATH_OPTIONS.map((option) => (
                <ChoiceTile
                  key={option.value}
                  label={option.label}
                  selected={bath === option.value}
                  onPress={() => setBath(option.value as DailyAnswers['bathChoice'])}
                />
              ))}
            </View>
          </>
        ) : null}
        {step === 'waste' ? (
          <>
            <Prompt
              title="Waste"
              subtitle="Select at least one. “None of these” clears the others. Then tap Next."
            />
            <View className="mt-5 gap-3">
              {WASTE_OPTIONS.map((option) => (
                <ChoiceTile
                  key={option.value}
                  label={option.label}
                  selected={waste.includes(option.value as WasteAction)}
                  onPress={() => toggleWaste(option.value as WasteAction)}
                />
              ))}
            </View>
          </>
        ) : null}
        {step === 'org'
          ? model.orgQuestions.map((question) => (
              <View key={question.id} className="mb-6">
                <Prompt title={question.prompt} subtitle={question.hint} />
                <View className="mt-3 gap-2">
                  {question.options.map((option) => (
                    <ChoiceTile
                      key={option.value}
                      label={option.label}
                      selected={org[question.id] === option.value}
                      onPress={() =>
                        setOrg((current) => ({ ...current, [question.id]: option.value }))
                      }
                    />
                  ))}
                </View>
              </View>
            ))
          : null}
      </Animated.View>
      {preview ? (
        <SoftCard className="mt-5">
          <T className="text-xs uppercase tracking-wide text-muted-foreground">Estimated impact</T>
          <T weight="extrabold" className="text-2xl text-ink">
            {formatKg(preview.totalKg)} kg CO₂e
          </T>
        </SoftCard>
      ) : null}
      {error ? (
        <T weight="semibold" className="mt-3 text-sm text-destructive">
          {error}
        </T>
      ) : null}
    </Screen>
  );
}

function Prompt({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View>
      <T weight="extrabold" className="text-3xl leading-9 text-ink">
        {title}
      </T>
      <T className="mt-1 text-base text-muted-foreground">{subtitle}</T>
    </View>
  );
}

type WasteAction = NonNullable<DailyAnswers['wasteActions']>[number];

function foodFromAnswers(answers: DailyAnswers | null): string | null {
  if (!answers) return null;
  const vegan = answers.veganMeals ?? 0;
  const veg = answers.vegMeals ?? 0;
  const meat = answers.nonVegMeals ?? 0;
  if (vegan > 0 && veg === 0 && meat === 0) return 'vegan';
  if (veg > 0 && vegan === 0 && meat === 0) return 'vegetarian';
  if (veg === 2 && meat === 1) return 'low';
  if (meat >= 3) return 'high';
  if (veg + meat + vegan > 0) return 'standard';
  return null;
}

function stepReady(
  step: StepId,
  value: {
    mode: TripMode | null;
    food: string | null;
    ac: DailyAnswers['acHoursBucket'] | null;
    bath: DailyAnswers['bathChoice'] | null;
    waste: WasteAction[];
    org: Record<string, string>;
    askCooling: boolean;
    orgQuestions: readonly { id: string }[];
  },
): boolean {
  if (step === 'mode') return value.mode !== null;
  if (step === 'distance') return value.mode !== null;
  if (step === 'food') return value.food !== null;
  if (step === 'home') return value.bath !== null && (!value.askCooling || value.ac !== null);
  if (step === 'waste') return value.waste.length > 0;
  return value.orgQuestions.every((question) => Boolean(value.org[question.id]));
}

function currentAnswers(
  mode: TripMode,
  km: number,
  food: string,
  ac: NonNullable<DailyAnswers['acHoursBucket']>,
  bath: NonNullable<DailyAnswers['bathChoice']>,
  waste: WasteAction[],
): DailyAnswers {
  return {
    trips: [{ mode, km: mode === 'work_from_home' ? 0 : km }],
    ...mealsFromChoice(food),
    acHoursBucket: ac,
    bathChoice: bath,
    wasteActions: waste,
  };
}
