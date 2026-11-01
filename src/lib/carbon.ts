import type { Baseline, Breakdown, DailyAnswers, OnboardingAnswers } from '@/types/domain';

const MODE_KG_PER_KM: Record<string, number> = {
  walk: 0,
  cycle: 0,
  bus: 0.089,
  metro_train: 0.041,
  two_wheeler: 0.055,
  car: 0.171,
  cab: 0.15,
  auto_rickshaw: 0.09,
  work_from_home: 0,
};

const FUEL_FACTOR: Record<string, number> = {
  petrol: 1,
  diesel: 1.08,
  cng: 0.72,
  electric: 0.28,
  not_applicable: 1,
};

const DIET_KG: Record<string, number> = {
  vegan: 1.6,
  vegetarian: 2.2,
  eggetarian: 2.6,
  non_veg_weekly: 3.3,
  non_veg_daily: 4.6,
};

const COOLING_KWH: Record<string, number> = {
  none: 45,
  fan_only: 80,
  ac_occasional: 150,
  ac_daily: 260,
};

/**
 * On-device estimate used only when EcoLife cannot compute a baseline.
 * Factors are rounded public averages, not the server's factor table.
 */
export function estimateBaseline(answers: OnboardingAnswers): Baseline {
  const household = clamp(answers.householdSize ?? 1, 1, 15);
  const distance = answers.commuteDistanceKm ?? 0;
  const mode = answers.primaryCommuteMode ?? 'bus';
  const fuel = FUEL_FACTOR[answers.vehicleFuel ?? 'not_applicable'] ?? 1;
  const transport =
    distance * 2 * (5 / 7) * (MODE_KG_PER_KM[mode] ?? 0.1) * fuel +
    (answers.flightsPerYear ?? 0) * 0.55;

  const diet = DIET_KG[answers.dietType ?? 'vegetarian'] ?? 2.2;
  const wasteMul =
    answers.foodWasteLevel === 'high' ? 1.18 : answers.foodWasteLevel === 'medium' ? 1.08 : 1;
  const packMul =
    answers.packagedFoodFreq === 'often'
      ? 1.12
      : answers.packagedFoodFreq === 'sometimes'
        ? 1.05
        : 1;
  const food = diet * wasteMul * packMul;

  const grid = 0.71;
  const kwh =
    answers.kwhSource === 'reported' && answers.electricityKwhMonth
      ? answers.electricityKwhMonth
      : answers.kwhSource === 'from_bill' && answers.electricityBillInr
        ? answers.electricityBillInr / 9.5
        : (COOLING_KWH[answers.coolingUsage ?? 'fan_only'] ?? 80);
  const solar = answers.hasSolar ? 0.65 : 1;
  const cooking =
    answers.cookingFuel === 'firewood'
      ? 0.7
      : answers.cookingFuel === 'electric_induction'
        ? 0.15
        : answers.cookingFuel === 'png'
          ? 0.32
          : 0.42;
  const homeEnergy = ((kwh * grid) / 30 / household) * solar + cooking / household;

  const water =
    answers.waterUsageLevel === 'high' ? 0.16 : answers.waterUsageLevel === 'low' ? 0.04 : 0.08;
  const waste =
    answers.wasteHabit === 'segregate_and_compost'
      ? 0.06
      : answers.wasteHabit === 'segregate_only'
        ? 0.14
        : 0.28;

  return roundBreakdown({
    transportKg: transport,
    foodKg: food,
    homeEnergyKg: homeEnergy,
    waterKg: water,
    wasteKg: waste,
    totalKg: transport + food + homeEnergy + water + waste,
  });
}

export function estimateDaily(answers: DailyAnswers, baseline: Baseline | null): Breakdown {
  const trips = answers.trips ?? [];
  const transport = trips.reduce(
    (sum, trip) => sum + trip.km * (MODE_KG_PER_KM[trip.mode] ?? 0.1),
    0,
  );

  const mealsGiven =
    answers.vegMeals !== undefined ||
    answers.nonVegMeals !== undefined ||
    answers.veganMeals !== undefined;
  const food = mealsGiven
    ? (answers.veganMeals ?? 0) * 0.45 +
      (answers.vegMeals ?? 0) * 0.7 +
      (answers.nonVegMeals ?? 0) * 2.4
    : (baseline?.foodKg ?? 2.2);

  const acMap = { '0': 0.15, '1_3': 0.9, '4_8': 1.9, '8_plus': 3.2 } as const;
  const homeEnergy = answers.acHoursBucket
    ? (acMap[answers.acHoursBucket] ?? baseline?.homeEnergyKg ?? 1.2)
    : (baseline?.homeEnergyKg ?? 1.2);

  const bathMap = { bucket: 0.04, short_shower: 0.1, long_shower: 0.24 } as const;
  const water = answers.bathChoice ? bathMap[answers.bathChoice] : (baseline?.waterKg ?? 0.08);

  const actions = answers.wasteActions ?? [];
  let waste = baseline?.wasteKg ?? 0.18;
  if (actions.length > 0) {
    waste = actions.includes('none_of_these') ? 0.26 : 0.16;
    if (actions.includes('segregated')) waste -= 0.04;
    if (actions.includes('composted')) waste -= 0.06;
    if (actions.includes('refused_plastic')) waste -= 0.02;
    waste = Math.max(0.03, waste);
  }

  return roundBreakdown({
    transportKg: transport,
    foodKg: food,
    homeEnergyKg: homeEnergy,
    waterKg: water,
    wasteKg: waste,
    totalKg: transport + food + homeEnergy + water + waste,
  });
}

function roundBreakdown(value: Breakdown): Breakdown {
  const round = (n: number) => Math.round(n * 100) / 100;
  const parts = {
    transportKg: round(value.transportKg),
    foodKg: round(value.foodKg),
    homeEnergyKg: round(value.homeEnergyKg),
    waterKg: round(value.waterKg),
    wasteKg: round(value.wasteKg),
  };
  return {
    ...parts,
    totalKg: round(
      parts.transportKg + parts.foodKg + parts.homeEnergyKg + parts.waterKg + parts.wasteKg,
    ),
  };
}

/** Completion credit used when EcoLife returns no reward for the log. */
export function scoreCheckIn(totalKg: number, baselineKg: number) {
  const saved = Math.max(0, baselineKg - totalKg);
  return { points: 40 + Math.round(saved * 5), coins: 8 + Math.round(saved) };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
