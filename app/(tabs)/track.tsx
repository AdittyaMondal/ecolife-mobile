import { useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Screen, TopBar } from '@/components/ui/header';
import { Grow } from '@/components/ui/motion';
import { Button, ChoiceTile, Note, SliderField, SoftCard } from '@/components/ui/primitives';
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
import { estimateDaily } from '@/lib/carbon';
import { errorMessage } from '@/lib/errors';
import { categoryShare, formatKg, formatShortDate, signedKg, weekdayLabel } from '@/lib/format';
import type { DailyAnswers, TripMode } from '@/types/domain';

type StepId = 'mode' | 'distance' | 'food' | 'home' | 'waste' | 'org';

export default function Track() {
  const model = useTrackModel();
  const [editing, setEditing] = useState(false);
  if (model.logged && !editing) return <Summary model={model} onEdit={() => setEditing(true)} />;
  return <Wizard model={model} onDone={() => setEditing(false)} />;
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
              <Grow
                className={`w-full rounded-t-xl ${point.logged ? 'bg-primary' : 'bg-muted'}`}
                height={Math.max(8, (point.totalKg / max) * 110)}
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
  onDone,
}: {
  model: ReturnType<typeof useTrackModel>;
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
  const [mode, setMode] = useState<TripMode>('metro_train');
  const [km, setKm] = useState(12);
  const [food, setFood] = useState('vegetarian');
  const [ac, setAc] = useState<'0' | '1_3' | '4_8' | '8_plus'>('1_3');
  const [bath, setBath] = useState<'bucket' | 'short_shower' | 'long_shower'>('short_shower');
  const [waste, setWaste] = useState<string[]>(['segregated']);
  const [org, setOrg] = useState<Record<string, string>>(model.savedOrg);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const advancing = useRef(false);
  const [done, setDone] = useState<{
    source: 'api' | 'device';
    credited: 'api' | 'device';
    total: number;
    delta: number;
    points: number;
  } | null>(null);

  function pickAndAdvance(apply: () => void) {
    apply();
    if (advancing.current || index >= steps.length - 1) return;
    advancing.current = true;
    setTimeout(() => {
      advancing.current = false;
      setIndex((value) => value + 1);
    }, 160);
  }

  const step = steps[index] ?? 'mode';
  const answers = currentAnswers(mode, km, food, ac, bath, waste);
  const preview = estimateDaily(answers, null);

  function toggleWaste(value: string) {
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
              disabled={index === 0}
              onPress={() => setIndex((value) => Math.max(0, value - 1))}
            />
          </View>
          <View className="flex-[1.4]">
            <Button
              label={index === steps.length - 1 ? 'Complete check-in' : 'Continue'}
              loading={pending}
              onPress={() => {
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
      <Animated.View
        key={step}
        entering={FadeInRight.duration(240)}
        exiting={FadeOutLeft.duration(160)}
      >
        {step === 'mode' ? (
          <>
            <Prompt title="How did you travel today?" subtitle="Your main mode." />
            <View className="mt-4 flex-row flex-wrap justify-between gap-y-3">
              {COMMUTE_OPTIONS.map((option) => (
                <View key={option.value} className="w-[31%]">
                  <ChoiceTile
                    compact
                    label={option.label}
                    selected={mode === option.value}
                    onPress={() => pickAndAdvance(() => setMode(option.value as TripMode))}
                  />
                </View>
              ))}
            </View>
          </>
        ) : null}
        {step === 'distance' ? (
          <>
            <Prompt
              title={mode === 'work_from_home' ? 'No commute today' : 'How far was it?'}
              subtitle="Total kilometres for that mode."
            />
            {mode === 'work_from_home' ? (
              <View className="mt-4">
                <Note>Home days count as zero travel kilometres.</Note>
              </View>
            ) : (
              <View className="mt-6">
                <View className="mb-2 flex-row items-end justify-between">
                  <T weight="extrabold" className="text-4xl text-ink">
                    {km}
                  </T>
                  <T className="text-muted-foreground">km</T>
                </View>
                <SliderField value={km} min={1} max={80} onChange={setKm} />
              </View>
            )}
          </>
        ) : null}
        {step === 'food' ? (
          <>
            <Prompt title="What did you eat?" subtitle="The shape of today’s meals." />
            <View className="mt-4 gap-3">
              {FOOD_OPTIONS.map((option) => (
                <ChoiceTile
                  key={option.value}
                  label={option.label}
                  hint={option.hint}
                  selected={food === option.value}
                  onPress={() => pickAndAdvance(() => setFood(option.value))}
                />
              ))}
            </View>
          </>
        ) : null}
        {step === 'home' ? (
          <>
            <Prompt title="Energy and water" subtitle="Cooling hours and how you bathed." />
            {model.askCooling ? (
              <View className="mt-4 flex-row flex-wrap gap-2">
                {AC_OPTIONS.map((option) => (
                  <View key={option.value} className="w-[47%]">
                    <ChoiceTile
                      compact
                      label={option.label}
                      selected={ac === option.value}
                      onPress={() => setAc(option.value as typeof ac)}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View className="mt-4">
                <Note>Your profile has no active cooling, so this stays off.</Note>
              </View>
            )}
            <T weight="bold" className="mb-2 mt-5 text-ink">
              Bath
            </T>
            <View className="gap-2">
              {BATH_OPTIONS.map((option) => (
                <ChoiceTile
                  key={option.value}
                  label={option.label}
                  selected={bath === option.value}
                  onPress={() => pickAndAdvance(() => setBath(option.value as typeof bath))}
                />
              ))}
            </View>
          </>
        ) : null}
        {step === 'waste' ? (
          <>
            <Prompt
              title="Waste actions"
              subtitle="Choose every one that fits. “None” clears the rest."
            />
            <View className="mt-4 gap-3">
              {WASTE_OPTIONS.map((option) => (
                <ChoiceTile
                  key={option.value}
                  label={option.label}
                  selected={waste.includes(option.value)}
                  onPress={() => toggleWaste(option.value)}
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
      <SoftCard className="mt-5">
        <T className="text-xs uppercase tracking-wide text-muted-foreground">Estimated impact</T>
        <T weight="extrabold" className="text-2xl text-ink">
          {formatKg(preview.totalKg)} kg CO₂e
        </T>
      </SoftCard>
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

function currentAnswers(
  mode: TripMode,
  km: number,
  food: string,
  ac: DailyAnswers['acHoursBucket'],
  bath: DailyAnswers['bathChoice'],
  waste: string[],
): DailyAnswers {
  const meals = mealsFromChoice(food);
  return {
    trips: [{ mode, km: mode === 'work_from_home' ? 0 : km }],
    ...meals,
    acHoursBucket: ac,
    bathChoice: bath,
    wasteActions: (waste.length ? waste : ['none_of_these']) as DailyAnswers['wasteActions'],
  };
}
