import type {
  CatalogEvent,
  CatalogProduct,
  OnboardingAnswers,
  RankRow,
  UserSummary,
} from '@/types/domain';

export const REGIONS = [
  { code: 'IN-MH', name: 'Maharashtra' },
  { code: 'IN-DL', name: 'Delhi' },
  { code: 'IN-KA', name: 'Karnataka' },
  { code: 'IN-TN', name: 'Tamil Nadu' },
  { code: 'IN-TS', name: 'Telangana' },
  { code: 'IN-WB', name: 'West Bengal' },
  { code: 'IN-GJ', name: 'Gujarat' },
  { code: 'IN-RJ', name: 'Rajasthan' },
  { code: 'IN-UP', name: 'Uttar Pradesh' },
  { code: 'IN-KL', name: 'Kerala' },
  { code: 'IN-PB', name: 'Punjab' },
  { code: 'IN-HR', name: 'Haryana' },
  { code: 'IN-GA', name: 'Goa' },
  { code: 'IN-OR', name: 'Odisha' },
  { code: 'IN-MP', name: 'Madhya Pradesh' },
] as const;

export type ChoiceOption = {
  value: string;
  label: string;
  hint?: string;
};

const host: UserSummary = {
  id: 0,
  name: 'EcoLife',
  avatarUrl: null,
  city: null,
};

function sampleEvent(
  partial: Omit<CatalogEvent, 'host' | 'sample' | 'status' | 'viewer' | 'checkedInCount'> & {
    hostName?: string;
  },
): CatalogEvent {
  return {
    ...partial,
    sample: true,
    status: 'published',
    checkedInCount: 0,
    host: { ...host, name: partial.hostName ?? 'EcoLife' },
    viewer: { isHost: false, isCoHost: false, registered: false, passStatus: null },
  };
}

export const SAMPLE_PRODUCTS: CatalogProduct[] = [
  {
    id: -1,
    slug: 'solstice-solar-lantern',
    name: 'Solstice Solar Lantern',
    description:
      'A rechargeable lantern with a small panel on the handle. Useful for balconies and power cuts.',
    category: 'household',
    pricePaise: 149900,
    imageUrl:
      'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=900&q=80',
    stock: 18,
    co2SavedKg: 12.4,
    coinPrice: 900,
    badge: 'Solar powered',
    sample: true,
  },
  {
    id: -2,
    slug: 'insulated-steel-bottle',
    name: 'Insulated Steel Bottle',
    description:
      'Double-wall steel, 750 ml. Keeps water cold through a commute and replaces single-use bottles.',
    category: 'kitchen',
    pricePaise: 74900,
    imageUrl:
      'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80',
    stock: 40,
    co2SavedKg: 8.1,
    coinPrice: 480,
    badge: 'Recycled steel',
    sample: true,
  },
  {
    id: -3,
    slug: 'organic-canvas-tote',
    name: 'Organic Canvas Tote',
    description: 'Heavy unbleached cotton with a flat base. Built for markets, not for one trip.',
    category: 'household',
    pricePaise: 59900,
    imageUrl:
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80',
    stock: 26,
    co2SavedKg: 4.6,
    coinPrice: 320,
    badge: 'Organic cotton',
    sample: true,
  },
  {
    id: -4,
    slug: 'bamboo-care-kit',
    name: 'Bamboo Care Kit',
    description: 'Brush, comb and a small soap bar. Plastic-free daily basics in one kit.',
    category: 'personal_care',
    pricePaise: 44900,
    imageUrl:
      'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=900&q=80',
    stock: 32,
    co2SavedKg: 2.2,
    coinPrice: 270,
    badge: 'Plastic-free',
    sample: true,
  },
  {
    id: -5,
    slug: 'tulsi-planter',
    name: 'Tulsi Planter',
    description:
      'A rooted tulsi in a terracotta pot. A small plant with a long life on a windowsill.',
    category: 'plants',
    pricePaise: 34900,
    imageUrl:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
    stock: 22,
    co2SavedKg: 6.5,
    coinPrice: 210,
    badge: null,
    sample: true,
  },
  {
    id: -6,
    slug: 'seed-paper-notes',
    name: 'Seed Paper Notes',
    description: 'A pad of plantable paper. Write on it, then soak it and grow the offcuts.',
    category: 'stationery',
    pricePaise: 24900,
    imageUrl:
      'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?auto=format&fit=crop&w=900&q=80',
    stock: 50,
    co2SavedKg: 1.1,
    coinPrice: 140,
    badge: 'Plantable',
    sample: true,
  },
];

export const SAMPLE_EVENTS: CatalogEvent[] = [
  sampleEvent({
    id: -101,
    slug: 'green-belt-plantation',
    title: 'Green Belt Plantation',
    description:
      'A Saturday morning of planting along the park edge. Saplings, gloves and water are provided.',
    type: 'plant_drive',
    visibility: 'public',
    audience: 'public',
    coverUrl:
      'https://images.unsplash.com/photo-1466692476866-aef0d93a0b95?auto=format&fit=crop&w=1200&q=80',
    startAt: '2026-11-08T01:30:00.000Z',
    endAt: '2026-11-08T04:30:00.000Z',
    venueName: 'Lodhi Park',
    venueAddress: 'Lodhi Gardens, New Delhi',
    latitude: 28.5933,
    longitude: 77.2197,
    capacity: 120,
    registeredCount: 86,
    pointsLabel: '+120 pts',
    hostName: 'City Green Trust',
  }),
  sampleEvent({
    id: -102,
    slug: 'shoreline-cleanup-day',
    title: 'Shoreline Clean-up Day',
    description:
      'Two hours on the sand, then a sort of what we collected. Bags and gloves are waiting at the tent.',
    type: 'cleanup_drive',
    visibility: 'public',
    audience: 'public',
    coverUrl:
      'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80',
    startAt: '2026-11-15T02:30:00.000Z',
    endAt: '2026-11-15T05:00:00.000Z',
    venueName: 'Juhu Beach',
    venueAddress: 'Juhu, Mumbai',
    latitude: 19.0988,
    longitude: 72.8265,
    capacity: 150,
    registeredCount: 108,
    distanceKm: 2.4,
    pointsLabel: '+150 pts',
    hostName: 'Ocean Guardians',
  }),
  sampleEvent({
    id: -103,
    slug: 'composting-at-home',
    title: 'Composting at Home',
    description:
      'A short workshop on balcony composting: what to add, what to leave out, and how it should smell.',
    type: 'workshop',
    visibility: 'public',
    audience: 'public',
    coverUrl:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80',
    startAt: '2026-11-20T11:30:00.000Z',
    endAt: '2026-11-20T13:00:00.000Z',
    venueName: 'HQ Atrium',
    venueAddress: 'Bandra Kurla Complex, Mumbai',
    latitude: 19.066,
    longitude: 72.869,
    capacity: 40,
    registeredCount: 22,
    pointsLabel: '+60 pts',
    hostName: 'Facilities Team',
  }),
  sampleEvent({
    id: -104,
    slug: 'campus-recycling-drive',
    title: 'Campus Recycling Drive',
    description:
      'Bring e-waste and clean paper. The collection desk is open through the afternoon.',
    type: 'recycling_drive',
    visibility: 'invite_only',
    audience: 'organization',
    coverUrl:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=1200&q=80',
    startAt: '2026-11-12T04:30:00.000Z',
    endAt: '2026-11-12T09:30:00.000Z',
    venueName: 'Office courtyard',
    venueAddress: 'Your organization campus',
    latitude: null,
    longitude: null,
    capacity: 80,
    registeredCount: 31,
    pointsLabel: '+80 pts',
    hostName: 'Workplace Green Team',
  }),
  sampleEvent({
    id: -105,
    slug: 'commute-week-briefing',
    title: 'Commute Week Briefing',
    description:
      'A 40-minute session on pooled rides, the shuttle timetable, and how the week is scored.',
    type: 'awareness',
    visibility: 'invite_only',
    audience: 'organization',
    coverUrl:
      'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80',
    startAt: '2026-11-05T08:30:00.000Z',
    endAt: '2026-11-05T09:15:00.000Z',
    venueName: 'Town hall',
    venueAddress: 'Your organization campus',
    latitude: null,
    longitude: null,
    capacity: 200,
    registeredCount: 64,
    pointsLabel: '+40 pts',
    hostName: 'People Team',
  }),
];

export const TIPS = [
  {
    id: 'metro-twice',
    title: 'Take the metro on two commute days',
    body: 'Swapping two car trips this week usually saves more than a handful of small habits.',
    impact: '−9 kg CO₂e',
    effort: 'Easy',
    points: '+30',
  },
  {
    id: 'ac-degree',
    title: 'Set the AC one degree warmer',
    body: '24°C instead of 23°C is a small change that shows up on a daily log.',
    impact: '−0.6 kg CO₂e',
    effort: 'Easy',
    points: '+15',
  },
  {
    id: 'veg-lunch',
    title: 'Keep one lunch vegetarian',
    body: 'A plant-forward lunch is one of the larger levers in a normal weekday.',
    impact: '−1.7 kg CO₂e',
    effort: 'Medium',
    points: '+20',
  },
  {
    id: 'bottle',
    title: 'Carry a bottle tomorrow',
    body: 'Refusing a bought drink is a small refusal that stacks across a month.',
    impact: '−0.1 kg CO₂e',
    effort: 'Easy',
    points: '+10',
  },
  {
    id: 'compost',
    title: 'Start a kitchen scrap jar',
    body: 'Even a sealed jar for peels changes the waste line of the daily log.',
    impact: '−0.4 kg CO₂e',
    effort: 'Medium',
    points: '+25',
  },
] as const;

export function tipForToday(date: string) {
  const day = Number(date.slice(-2)) || 1;
  return TIPS[day % TIPS.length] ?? TIPS[0];
}

export const ORG_QUESTIONS = [
  {
    id: 'shuttle',
    prompt: 'How did you travel for work today?',
    hint: 'Your workplace asked this. The answer stays on this phone.',
    options: [
      { value: 'shuttle', label: 'Company shuttle' },
      { value: 'pool', label: 'Pooled ride' },
      { value: 'solo', label: 'I travelled alone' },
      { value: 'remote', label: 'I worked remotely' },
    ],
  },
  {
    id: 'desk',
    prompt: 'What did you switch off before leaving?',
    hint: 'Pick the closest match. This is not sent to EcoLife.',
    options: [
      { value: 'monitor', label: 'Monitor and lights' },
      { value: 'ac', label: 'Cabin AC' },
      { value: 'both', label: 'Both' },
      { value: 'none', label: 'Nothing today' },
    ],
  },
] as const;

export const COMMUTE_OPTIONS: ChoiceOption[] = [
  { value: 'car', label: 'Car' },
  { value: 'two_wheeler', label: 'Bike' },
  { value: 'metro_train', label: 'Metro' },
  { value: 'bus', label: 'Bus' },
  { value: 'walk', label: 'Walk' },
  { value: 'cycle', label: 'Cycle' },
  { value: 'cab', label: 'Cab' },
  { value: 'auto_rickshaw', label: 'Auto' },
  { value: 'work_from_home', label: 'Stayed home' },
];

export const FOOD_OPTIONS: ChoiceOption[] = [
  { value: 'vegan', label: 'Plant-based', hint: 'No animal products' },
  { value: 'vegetarian', label: 'Vegetarian', hint: 'No meat' },
  { value: 'low', label: 'A little meat', hint: 'One meat meal' },
  { value: 'standard', label: 'Mixed', hint: 'A usual mix' },
  { value: 'high', label: 'Mostly meat', hint: 'Meat at most meals' },
];

export const AC_OPTIONS: ChoiceOption[] = [
  { value: '0', label: 'Off' },
  { value: '1_3', label: '1–3 h' },
  { value: '4_8', label: '4–8 h' },
  { value: '8_plus', label: '8 h+' },
];

export const BATH_OPTIONS: ChoiceOption[] = [
  { value: 'bucket', label: 'Bucket' },
  { value: 'short_shower', label: 'Short shower' },
  { value: 'long_shower', label: 'Long shower' },
];

export const WASTE_OPTIONS: ChoiceOption[] = [
  { value: 'segregated', label: 'Segregated waste' },
  { value: 'composted', label: 'Composted scraps' },
  { value: 'refused_plastic', label: 'Refused plastic' },
  { value: 'none_of_these', label: 'None of these' },
];

export function mealsFromChoice(choice: string): {
  vegMeals: number;
  nonVegMeals: number;
  veganMeals: number;
} {
  switch (choice) {
    case 'vegan':
      return { veganMeals: 3, vegMeals: 0, nonVegMeals: 0 };
    case 'vegetarian':
      return { veganMeals: 0, vegMeals: 3, nonVegMeals: 0 };
    case 'low':
      return { veganMeals: 0, vegMeals: 2, nonVegMeals: 1 };
    case 'high':
      return { veganMeals: 0, vegMeals: 0, nonVegMeals: 3 };
    default:
      return { veganMeals: 0, vegMeals: 1, nonVegMeals: 2 };
  }
}

export const CATEGORY_META = [
  { key: 'transportKg', label: 'Transport', tint: 'bg-accent' },
  { key: 'foodKg', label: 'Food', tint: 'bg-eco-100' },
  { key: 'homeEnergyKg', label: 'Energy', tint: 'bg-eco-50' },
  { key: 'waterKg', label: 'Water', tint: 'bg-muted' },
  { key: 'wasteKg', label: 'Waste', tint: 'bg-card' },
] as const;

export function sampleRanks(me: {
  id: number;
  name: string;
  points: number;
  city: string | null;
}): RankRow[] {
  const others: RankRow[] = [
    {
      rank: 1,
      name: 'Anika Rao',
      points: 4820,
      userId: -1,
      avatarUrl: null,
      subtitle: 'Operations',
    },
    { rank: 2, name: 'Dev Sharma', points: 4610, userId: -2, avatarUrl: null, subtitle: 'Finance' },
    {
      rank: 3,
      name: 'Meher Kapoor',
      points: 4404,
      userId: -3,
      avatarUrl: null,
      subtitle: 'Design',
    },
    {
      rank: 4,
      name: 'Kabir Joshi',
      points: 4211,
      userId: -4,
      avatarUrl: null,
      subtitle: 'Engineering',
    },
    { rank: 5, name: 'Tara Iyer', points: 4090, userId: -5, avatarUrl: null, subtitle: 'People' },
    { rank: 6, name: 'Rohan Gill', points: 3988, userId: -6, avatarUrl: null, subtitle: 'Sales' },
  ];
  const mine: RankRow = {
    rank: 7,
    name: me.name,
    points: me.points,
    userId: me.id,
    avatarUrl: null,
    subtitle: me.city,
  };
  return [...others, mine].map((row, index) => ({ ...row, rank: index + 1 }));
}

export function orgRanks(me: { id: number; name: string; points: number }): RankRow[] {
  return [
    { rank: 1, name: 'Leela Nair', points: 1880, userId: -11, avatarUrl: null, subtitle: 'Member' },
    { rank: 2, name: me.name, points: me.points, userId: me.id, avatarUrl: null, subtitle: 'You' },
    {
      rank: 3,
      name: 'Imran Sheikh',
      points: 1420,
      userId: -12,
      avatarUrl: null,
      subtitle: 'Member',
    },
    { rank: 4, name: 'Pia Dutta', points: 990, userId: -13, avatarUrl: null, subtitle: 'Member' },
  ];
}

export const ONBOARDING_STEPS: {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  fields: (keyof OnboardingAnswers)[];
}[] = [
  { step: 1, title: 'Home', fields: ['householdSize', 'city', 'regionCode', 'coolingUsage'] },
  { step: 2, title: 'Food', fields: ['dietType', 'foodWasteLevel', 'packagedFoodFreq'] },
  {
    step: 3,
    title: 'Travel',
    fields: ['primaryCommuteMode', 'vehicleFuel', 'commuteDistanceKm', 'flightsPerYear'],
  },
  {
    step: 4,
    title: 'Energy',
    fields: ['electricityKwhMonth', 'electricityBillInr', 'kwhSource', 'cookingFuel', 'hasSolar'],
  },
  { step: 5, title: 'Water & waste', fields: ['waterUsageLevel', 'wasteHabit'] },
];

export const CATEGORY_LABELS: Record<string, string> = {
  plants: 'Plants',
  household: 'Home',
  personal_care: 'Personal care',
  kitchen: 'Drinkware',
  stationery: 'Stationery',
};

export const EVENT_LABELS: Record<string, string> = {
  plant_drive: 'Tree plantation',
  cleanup_drive: 'Clean-up',
  awareness: 'Awareness',
  recycling_drive: 'Recycling',
  workshop: 'Workshop',
  other: 'Other',
};
