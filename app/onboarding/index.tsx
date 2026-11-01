import { useQuery } from '@tanstack/react-query';
import { type Href, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Screen } from '@/components/ui/header';
import { FillBar } from '@/components/ui/motion';
import { Button, ChoiceTile, Field, Note, Stepper } from '@/components/ui/primitives';
import { T } from '@/components/ui/text';
import { REGIONS } from '@/data/content';
import { estimateBaseline } from '@/lib/carbon';
import { errorMessage, isUnavailable } from '@/lib/errors';
import { api } from '@/lib/fetcher';
import { formatKg } from '@/lib/format';
import { unwrapList } from '@/lib/normalizers';
import { qk } from '@/lib/query-keys';
import { useAuth } from '@/providers/auth-provider';
import type {
  Baseline,
  City,
  OnboardingAnswers,
  OnboardingCompleteResult,
  OnboardingState,
} from '@/types/domain';

type Step = 1 | 2 | 3 | 4 | 5;

type Question =
  | {
      id: string;
      step: Step;
      kind: 'count';
      title: string;
      subtitle: string;
      field: 'householdSize' | 'flightsPerYear';
      min: number;
      max: number;
      suffix: string;
    }
  | {
      id: string;
      step: Step;
      kind: 'choice';
      title: string;
      subtitle: string;
      field: keyof OnboardingAnswers;
      options: { value: string; label: string; hint?: string }[];
    }
  | { id: string; step: 1; kind: 'place'; title: string; subtitle: string }
  | { id: string; step: 3; kind: 'distance'; title: string; subtitle: string }
  | { id: string; step: 4; kind: 'power'; title: string; subtitle: string }
  | { id: string; step: 4; kind: 'yesno'; title: string; subtitle: string };

const MOTOR = new Set(['car', 'two_wheeler', 'cab', 'auto_rickshaw']);

function questionsFor(answers: OnboardingAnswers): Question[] {
  const list: Question[] = [
    {
      id: 'household',
      step: 1,
      kind: 'count',
      field: 'householdSize',
      min: 1,
      max: 15,
      suffix: 'people',
      title: 'How many people share your home?',
      subtitle: 'This splits electricity, water and waste across the household.',
    },
    {
      id: 'place',
      step: 1,
      kind: 'place',
      title: 'Where do you live?',
      subtitle: 'The city picks a regional grid factor for your baseline.',
    },
    {
      id: 'cooling',
      step: 1,
      kind: 'choice',
      field: 'coolingUsage',
      title: 'How do you cool your home?',
      subtitle: 'A typical summer day is enough.',
      options: [
        { value: 'none', label: 'No cooling' },
        { value: 'fan_only', label: 'Fans' },
        { value: 'ac_occasional', label: 'AC sometimes' },
        { value: 'ac_daily', label: 'AC most days' },
      ],
    },
    {
      id: 'diet',
      step: 2,
      kind: 'choice',
      field: 'dietType',
      title: 'What does a normal day of food look like?',
      subtitle: 'Diet is usually the largest slice of a personal footprint.',
      options: [
        { value: 'vegan', label: 'Vegan' },
        { value: 'vegetarian', label: 'Vegetarian' },
        { value: 'eggetarian', label: 'Eggetarian' },
        { value: 'non_veg_weekly', label: 'Meat a few times a week' },
        { value: 'non_veg_daily', label: 'Meat most days' },
      ],
    },
    {
      id: 'wasteFood',
      step: 2,
      kind: 'choice',
      field: 'foodWasteLevel',
      title: 'How much food gets thrown away?',
      subtitle: 'Scraps, leftovers and spoiled groceries.',
      options: [
        { value: 'low', label: 'Very little' },
        { value: 'medium', label: 'Some' },
        { value: 'high', label: 'Quite a lot' },
      ],
    },
    {
      id: 'packaged',
      step: 2,
      kind: 'choice',
      field: 'packagedFoodFreq',
      title: 'How often is a meal packaged?',
      subtitle: 'Takeaway, ready meals and bottled drinks.',
      options: [
        { value: 'rarely', label: 'Rarely' },
        { value: 'sometimes', label: 'Sometimes' },
        { value: 'often', label: 'Often' },
      ],
    },
    {
      id: 'mode',
      step: 3,
      kind: 'choice',
      field: 'primaryCommuteMode',
      title: 'How do you usually get to work or college?',
      subtitle: 'Pick the mode you use most weekdays.',
      options: [
        { value: 'walk', label: 'Walk' },
        { value: 'cycle', label: 'Cycle' },
        { value: 'bus', label: 'Bus' },
        { value: 'metro_train', label: 'Metro or train' },
        { value: 'two_wheeler', label: 'Two-wheeler' },
        { value: 'car', label: 'Car' },
        { value: 'cab', label: 'Cab' },
        { value: 'auto_rickshaw', label: 'Auto' },
        { value: 'work_from_home', label: 'I stay home' },
      ],
    },
  ];
  if (MOTOR.has(answers.primaryCommuteMode ?? '')) {
    list.push({
      id: 'fuel',
      step: 3,
      kind: 'choice',
      field: 'vehicleFuel',
      title: 'What fuel does that vehicle use?',
      subtitle: 'Electric and CNG change the transport line a lot.',
      options: [
        { value: 'petrol', label: 'Petrol' },
        { value: 'diesel', label: 'Diesel' },
        { value: 'cng', label: 'CNG' },
        { value: 'electric', label: 'Electric' },
      ],
    });
  }
  if (answers.primaryCommuteMode && answers.primaryCommuteMode !== 'work_from_home') {
    list.push({
      id: 'distance',
      step: 3,
      kind: 'distance',
      title: 'How far is one way?',
      subtitle: 'A rough kilometre count is enough.',
    });
  }
  list.push(
    {
      id: 'flights',
      step: 3,
      kind: 'count',
      field: 'flightsPerYear',
      min: 0,
      max: 50,
      suffix: 'flights / year',
      title: 'How many flights do you take in a year?',
      subtitle: 'Count each single flight, including returns.',
    },
    {
      id: 'power',
      step: 4,
      kind: 'power',
      title: 'How much electricity do you use?',
      subtitle: 'Exact units, a bill, or an estimate — all three are valid.',
    },
    {
      id: 'cooking',
      step: 4,
      kind: 'choice',
      field: 'cookingFuel',
      title: 'What do you cook with?',
      subtitle: 'The main stove, not the kettle.',
      options: [
        { value: 'lpg', label: 'LPG' },
        { value: 'png', label: 'Piped gas' },
        { value: 'electric_induction', label: 'Induction' },
        { value: 'firewood', label: 'Firewood' },
      ],
    },
    {
      id: 'solar',
      step: 4,
      kind: 'yesno',
      title: 'Do you have rooftop solar?',
      subtitle: 'Even a partial system counts.',
    },
    {
      id: 'water',
      step: 5,
      kind: 'choice',
      field: 'waterUsageLevel',
      title: 'How heavy is water use at home?',
      subtitle: 'Showers, laundry and garden together.',
      options: [
        { value: 'low', label: 'Light' },
        { value: 'medium', label: 'Typical' },
        { value: 'high', label: 'Heavy' },
      ],
    },
    {
      id: 'waste',
      step: 5,
      kind: 'choice',
      field: 'wasteHabit',
      title: 'What happens to household waste?',
      subtitle: 'This closes your baseline.',
      options: [
        { value: 'segregate_and_compost', label: 'Segregate and compost' },
        { value: 'segregate_only', label: 'Segregate only' },
        { value: 'none', label: 'Neither' },
      ],
    },
  );
  return list;
}

function answered(question: Question, answers: OnboardingAnswers): boolean {
  if (question.kind === 'count') return typeof answers[question.field] === 'number';
  if (question.kind === 'choice') return Boolean(answers[question.field]);
  if (question.kind === 'place') return Boolean(answers.city && answers.regionCode);
  if (question.kind === 'distance') return typeof answers.commuteDistanceKm === 'number';
  if (question.kind === 'yesno') return typeof answers.hasSolar === 'boolean';
  if (question.kind === 'power') {
    if (answers.kwhSource === 'estimated') return true;
    if (answers.kwhSource === 'reported') return (answers.electricityKwhMonth ?? 0) > 0;
    if (answers.kwhSource === 'from_bill') return (answers.electricityBillInr ?? 0) > 0;
  }
  return false;
}

function stepPayload(step: Step, answers: OnboardingAnswers) {
  if (step === 1) {
    return {
      householdSize: answers.householdSize ?? 1,
      city: answers.city ?? '',
      regionCode: answers.regionCode ?? '',
      coolingUsage: answers.coolingUsage ?? 'fan_only',
    };
  }
  if (step === 2) {
    return {
      dietType: answers.dietType,
      foodWasteLevel: answers.foodWasteLevel,
      packagedFoodFreq: answers.packagedFoodFreq,
    };
  }
  if (step === 3) {
    const remote = answers.primaryCommuteMode === 'work_from_home';
    return {
      primaryCommuteMode: answers.primaryCommuteMode,
      vehicleFuel: MOTOR.has(answers.primaryCommuteMode ?? '')
        ? answers.vehicleFuel
        : 'not_applicable',
      commuteDistanceKm: remote ? 0 : (answers.commuteDistanceKm ?? 0),
      flightsPerYear: answers.flightsPerYear ?? 0,
    };
  }
  if (step === 4) {
    return {
      electricityKwhMonth:
        answers.kwhSource === 'reported' ? (answers.electricityKwhMonth ?? null) : null,
      electricityBillInr:
        answers.kwhSource === 'from_bill' ? (answers.electricityBillInr ?? null) : null,
      kwhSource: answers.kwhSource ?? 'estimated',
      cookingFuel: answers.cookingFuel,
      hasSolar: answers.hasSolar ?? false,
    };
  }
  return { waterUsageLevel: answers.waterUsageLevel, wasteHabit: answers.wasteHabit };
}

export default function Onboarding() {
  const { user, local, updateLocal, refreshUser } = useAuth();
  const [answers, setAnswers] = useState<OnboardingAnswers>(local.answers);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    baseline: Baseline;
    source: 'api' | 'device';
    points: number;
    coins: number;
  } | null>(null);
  const questions = useMemo(() => questionsFor(answers), [answers]);
  const question = questions[Math.min(index, questions.length - 1)];
  const progress = questions.length === 0 ? 0 : (index + (result ? 1 : 0)) / questions.length;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api
      .get<OnboardingState>('/profile/onboarding')
      .then((state) => {
        if (cancelled || !state.answers) return;
        setAnswers((current) => ({ ...state.answers, ...current }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function finish(nextAnswers: OnboardingAnswers, serverStepsOk: boolean) {
    if (serverStepsOk) {
      try {
        const completed = await api.post<OnboardingCompleteResult>('/profile/onboarding/complete');
        await updateLocal((state) => ({
          ...state,
          answers: nextAnswers,
          baseline: completed.baseline,
        }));
        setResult({
          baseline: completed.baseline,
          source: 'api',
          points: completed.pointsAwarded,
          coins: completed.coinsAwarded,
        });
        return;
      } catch (err) {
        if (!isUnavailable(err)) {
          setError(errorMessage(err));
          return;
        }
      }
    }
    const baseline = estimateBaseline(nextAnswers);
    await updateLocal((state) => ({
      ...state,
      answers: nextAnswers,
      baseline,
    }));
    setResult({ baseline, source: 'device', points: 0, coins: 0 });
  }

  async function next() {
    if (!question || !answered(question, answers)) return;
    setError(null);
    const following = questions[index + 1];
    const stepEnds = !following || following.step !== question.step;
    const isLast = index >= questions.length - 1;
    if (!stepEnds) {
      setIndex((value) => value + 1);
      return;
    }
    setPending(true);
    let saved = false;
    try {
      await api.patch<OnboardingState>(
        `/profile/onboarding/step/${question.step}`,
        stepPayload(question.step, answers),
      );
      saved = true;
    } catch (err) {
      if (!isUnavailable(err)) {
        setError(errorMessage(err));
        setPending(false);
        return;
      }
    }
    await updateLocal((state) => ({ ...state, answers }));
    if (isLast) {
      await finish(answers, saved);
      setPending(false);
      return;
    }
    setPending(false);
    setIndex((value) => value + 1);
  }

  if (result) {
    return (
      <Screen
        footer={
          <Button
            label="Go to Home"
            onPress={() => {
              void updateLocal((state) => ({ ...state, onboardingComplete: true })).then(
                async () => {
                  try {
                    await refreshUser();
                  } catch {
                    // Home can load with the account we already have.
                  }
                  router.replace('/' as Href);
                },
              );
            }}
          />
        }
      >
        <T weight="semibold" className="text-xs uppercase tracking-wide text-forest">
          Baseline ready
        </T>
        <T weight="extrabold" className="mt-1 text-3xl text-ink">
          {result.source === 'api' ? 'Your starting point is set' : 'Estimate saved on this phone'}
        </T>
        <View className="mt-5 items-center rounded-[32px] bg-secondary px-4 py-6">
          <T weight="extrabold" className="text-5xl text-cream">
            {formatKg(result.baseline.totalKg)}
          </T>
          <T className="text-eco-100">kg CO₂e / day</T>
        </View>
        <View className="mt-4 gap-2">
          {(
            [
              ['Transport', result.baseline.transportKg],
              ['Food', result.baseline.foodKg],
              ['Energy', result.baseline.homeEnergyKg],
              ['Water', result.baseline.waterKg],
              ['Waste', result.baseline.wasteKg],
            ] as const
          ).map(([label, value]) => (
            <View
              key={label}
              className="flex-row items-center justify-between rounded-[18px] bg-card px-4 py-3"
            >
              <T weight="semibold" className="text-ink">
                {label}
              </T>
              <T weight="bold" className="text-forest">
                {formatKg(value)} kg
              </T>
            </View>
          ))}
        </View>
        {result.source === 'api' ? (
          <View className="mt-4">
            <Note>{`EcoLife added ${result.points} points and ${result.coins} coins for finishing.`}</Note>
          </View>
        ) : (
          <View className="mt-4">
            <Note>
              EcoLife could not compute this baseline. The numbers above are an on-device estimate,
              and your answers are kept here for a later sync.
            </Note>
          </View>
        )}
      </Screen>
    );
  }

  if (!question) return null;

  return (
    <Screen
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              label="Back"
              variant="outline"
              onPress={() => setIndex((value) => Math.max(0, value - 1))}
              disabled={index === 0 || pending}
            />
          </View>
          <View className="flex-[1.4]">
            <Button
              label={index === questions.length - 1 ? 'Finish' : 'Continue'}
              onPress={() => void next()}
              disabled={!answered(question, answers)}
              loading={pending}
            />
          </View>
        </View>
      }
    >
      <FillBar
        percent={Math.max(8, progress * 100)}
        trackClassName="mb-5 h-3 bg-muted"
        fillClassName="bg-primary"
      />
      <T weight="bold" className="text-sm text-forest">
        {index + 1} of {questions.length}
      </T>
      <Animated.View
        key={question.id}
        entering={FadeInRight.duration(240)}
        exiting={FadeOutLeft.duration(160)}
      >
        <T weight="extrabold" className="mt-2 text-3xl leading-9 text-ink">
          {question.title}
        </T>
        <T className="mt-2 text-base leading-6 text-muted-foreground">{question.subtitle}</T>
        <View className="mt-6">
          <QuestionBody question={question} answers={answers} onChange={setAnswers} />
        </View>
      </Animated.View>
      {error ? (
        <T weight="semibold" className="mt-4 text-sm text-destructive">
          {error}
        </T>
      ) : null}
    </Screen>
  );
}

function QuestionBody({
  question,
  answers,
  onChange,
}: {
  question: Question;
  answers: OnboardingAnswers;
  onChange: (value: OnboardingAnswers) => void;
}) {
  if (question.kind === 'count') {
    const value = Number(answers[question.field] ?? question.min);
    return (
      <Stepper
        value={value}
        min={question.min}
        max={question.max}
        suffix={question.suffix}
        onChange={(next) => onChange({ ...answers, [question.field]: next })}
      />
    );
  }
  if (question.kind === 'choice') {
    return (
      <View className="gap-3">
        {question.options.map((option) => (
          <ChoiceTile
            key={option.value}
            label={option.label}
            hint={option.hint}
            selected={answers[question.field] === option.value}
            onPress={() => onChange({ ...answers, [question.field]: option.value })}
          />
        ))}
      </View>
    );
  }
  if (question.kind === 'distance') {
    const value = answers.commuteDistanceKm ?? 8;
    return (
      <View>
        <Stepper
          value={value}
          min={1}
          max={80}
          suffix="km one way"
          onChange={(next) => onChange({ ...answers, commuteDistanceKm: next })}
        />
      </View>
    );
  }
  if (question.kind === 'yesno') {
    return (
      <View className="flex-row gap-3">
        <View className="flex-1">
          <ChoiceTile
            label="Yes"
            selected={answers.hasSolar === true}
            onPress={() => onChange({ ...answers, hasSolar: true })}
          />
        </View>
        <View className="flex-1">
          <ChoiceTile
            label="No"
            selected={answers.hasSolar === false}
            onPress={() => onChange({ ...answers, hasSolar: false })}
          />
        </View>
      </View>
    );
  }
  if (question.kind === 'place') return <PlaceFields answers={answers} onChange={onChange} />;
  return <PowerFields answers={answers} onChange={onChange} />;
}

function PlaceFields({
  answers,
  onChange,
}: {
  answers: OnboardingAnswers;
  onChange: (value: OnboardingAnswers) => void;
}) {
  const queryText = answers.city ?? '';
  const cities = useQuery({
    queryKey: qk.cities(queryText),
    enabled: queryText.trim().length >= 2,
    queryFn: () => api.get<unknown>(`/cities?q=${encodeURIComponent(queryText.trim())}`),
  });
  const matches = unwrapList(cities.data).filter((item): item is City => {
    return typeof item === 'object' && item !== null && 'name' in item && 'regionCode' in item;
  });
  return (
    <View className="gap-4">
      <Field
        label="City"
        value={answers.city ?? ''}
        onChangeText={(city) => onChange({ ...answers, city })}
        placeholder="Mumbai"
      />
      {matches.slice(0, 4).map((city) => (
        <ChoiceTile
          key={`${city.id}-${city.name}`}
          label={city.name}
          hint={city.regionCode}
          selected={answers.city === city.name && answers.regionCode === city.regionCode}
          onPress={() => onChange({ ...answers, city: city.name, regionCode: city.regionCode })}
        />
      ))}
      <T weight="semibold" className="text-sm text-ink">
        Region
      </T>
      <View className="flex-row flex-wrap gap-2">
        {REGIONS.map((region) => (
          <ChoiceTile
            key={region.code}
            compact
            label={region.name}
            selected={answers.regionCode === region.code}
            onPress={() =>
              onChange({ ...answers, regionCode: region.code, city: answers.city || region.name })
            }
          />
        ))}
      </View>
    </View>
  );
}

function PowerFields({
  answers,
  onChange,
}: {
  answers: OnboardingAnswers;
  onChange: (value: OnboardingAnswers) => void;
}) {
  return (
    <View className="gap-3">
      <ChoiceTile
        label="I know my units"
        selected={answers.kwhSource === 'reported'}
        onPress={() => onChange({ ...answers, kwhSource: 'reported' })}
      />
      {answers.kwhSource === 'reported' ? (
        <Field
          label="kWh this month"
          keyboardType="number-pad"
          value={answers.electricityKwhMonth ? String(answers.electricityKwhMonth) : ''}
          onChangeText={(text) =>
            onChange({ ...answers, electricityKwhMonth: Number(text.replace(/[^\d]/g, '')) || 0 })
          }
          placeholder="240"
        />
      ) : null}
      <ChoiceTile
        label="I have the bill"
        selected={answers.kwhSource === 'from_bill'}
        onPress={() => onChange({ ...answers, kwhSource: 'from_bill' })}
      />
      {answers.kwhSource === 'from_bill' ? (
        <Field
          label="Bill amount in rupees"
          keyboardType="number-pad"
          value={answers.electricityBillInr ? String(answers.electricityBillInr) : ''}
          onChangeText={(text) =>
            onChange({ ...answers, electricityBillInr: Number(text.replace(/[^\d]/g, '')) || 0 })
          }
          placeholder="1800"
        />
      ) : null}
      <ChoiceTile
        label="Estimate it for me"
        hint="We will use your cooling answer"
        selected={answers.kwhSource === 'estimated'}
        onPress={() =>
          onChange({
            ...answers,
            kwhSource: 'estimated',
            electricityKwhMonth: null,
            electricityBillInr: null,
          })
        }
      />
    </View>
  );
}
