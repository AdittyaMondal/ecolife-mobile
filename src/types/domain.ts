export type Liveness = {
  service: string;
  status: 'up';
};

export type Wallet = {
  pointsTotal: number;
  coinsBalance: number;
};

export type Session = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string | null;
};

export type MemberOrganization = {
  id: number;
  slug: string;
  name: string;
  type: 'industry' | 'ngo' | 'seller';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  role: 'owner' | 'member';
};

export type Me = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatarUrl: string | null;
  city: string | null;
  timezone: string;
  emailVerified: boolean;
  onboardingComplete: boolean;
  completedSteps: number;
  wallet: Wallet;
  unreadNotifications: number;
  organization: MemberOrganization | null;
};

export type AuthResult = {
  session: Session;
  user: Me;
};

export type UserSummary = {
  id: number;
  name: string;
  avatarUrl: string | null;
  city: string | null;
};

export type Baseline = {
  transportKg: number;
  foodKg: number;
  homeEnergyKg: number;
  waterKg: number;
  wasteKg: number;
  totalKg: number;
};

export type Breakdown = Baseline;

export type OnboardingAnswers = {
  householdSize?: number;
  city?: string;
  regionCode?: string;
  coolingUsage?: 'none' | 'fan_only' | 'ac_occasional' | 'ac_daily';
  dietType?: 'vegan' | 'vegetarian' | 'eggetarian' | 'non_veg_weekly' | 'non_veg_daily';
  foodWasteLevel?: 'low' | 'medium' | 'high';
  packagedFoodFreq?: 'rarely' | 'sometimes' | 'often';
  primaryCommuteMode?:
    | 'walk'
    | 'cycle'
    | 'bus'
    | 'metro_train'
    | 'two_wheeler'
    | 'car'
    | 'cab'
    | 'auto_rickshaw'
    | 'work_from_home';
  vehicleFuel?: 'petrol' | 'diesel' | 'cng' | 'electric' | 'not_applicable';
  commuteDistanceKm?: number;
  flightsPerYear?: number;
  electricityKwhMonth?: number | null;
  electricityBillInr?: number | null;
  kwhSource?: 'reported' | 'from_bill' | 'estimated';
  cookingFuel?: 'lpg' | 'png' | 'electric_induction' | 'firewood';
  hasSolar?: boolean;
  waterUsageLevel?: 'low' | 'medium' | 'high';
  wasteHabit?: 'segregate_and_compost' | 'segregate_only' | 'none';
};

export type OnboardingState = {
  completedSteps: number;
  complete: boolean;
  answers: OnboardingAnswers;
};

export type OnboardingCompleteResult = {
  baseline: Baseline;
  wallet: Wallet;
  pointsAwarded: number;
  coinsAwarded: number;
};

export type TripMode = NonNullable<OnboardingAnswers['primaryCommuteMode']>;

export type CommutePlace = {
  label: string;
  placeId: string;
  lat: number;
  lng: number;
};

export type SavedCommute = {
  home: CommutePlace | null;
  work: CommutePlace | null;
  distanceByMode: Partial<Record<TripMode, number>>;
};

export type DailyAnswers = {
  trips?: { mode: TripMode; km: number }[];
  vegMeals?: number;
  nonVegMeals?: number;
  veganMeals?: number;
  acHoursBucket?: '0' | '1_3' | '4_8' | '8_plus';
  bathChoice?: 'bucket' | 'short_shower' | 'long_shower';
  wasteActions?: ('segregated' | 'composted' | 'refused_plastic' | 'none_of_these')[];
};

export type SubmitLogBody = {
  clientLogId: string;
  logDate: string;
  answers: DailyAnswers;
};

export type Streak = {
  current: number;
  longest: number;
};

export type RewardGrant = {
  pointsDelta: number;
  coinsDelta: number;
  reasons: object[];
};

export type LogResult = {
  logId: number;
  breakdown: Breakdown;
  baselineTotalKg: number;
  deltaKg: number;
  reductionPct: number;
  sources: object;
  clamped: boolean;
  reward: RewardGrant;
  wallet: Wallet;
  streak: Streak;
};

export type TrackToday = {
  date: string;
  existingLog: object | null;
  askCooling: boolean;
  defaults: unknown;
};

export type HistoryPoint = {
  date: string;
  totalKg: number;
  baselineTotalKg: number;
  logged: boolean;
};

export type HomeToday = {
  date: string;
  logged: boolean;
  breakdown: Breakdown;
  baselineTotalKg: number;
  deltaKg: number;
  percentOfBaseline: number;
  sources: object;
  inferredCount: number;
};

export type HomeWeek = {
  sparkline: object[];
  avgKgPerDay: number;
  changeVsLastWeekPct: number;
};

export type ActiveGoalSummary = {
  id: number;
  label: string;
  progressPct: number;
  daysLeft: number;
  onTrack: boolean;
};

export type NextEvent = {
  id: number;
  slug: string;
  title: string;
  startAt: string;
  venueName: string;
  passReady: boolean;
};

export type Home = {
  greetingName: string;
  wallet: Wallet;
  today: HomeToday;
  streak: Streak;
  week: HomeWeek;
  breakdown30d: Breakdown;
  activeGoal: ActiveGoalSummary | null;
  leaderboard: { top: unknown[]; me: object };
  nextEvent: NextEvent | null;
};

export type MyRank = {
  rank: number | null;
  pointsTotal: number;
  totalRanked: number;
  percentile: number;
};

export type ProductCategory = 'plants' | 'household' | 'personal_care' | 'kitchen' | 'stationery';

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'co2_desc';

export type Product = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  pricePaise: number;
  imageUrl: string | null;
  stock: number;
  co2SavedKg: number | null;
};

export type Address = {
  id: number;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type AddressInput = {
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type CartItem = {
  productId: number;
  product: Product;
  quantity: number;
  lineTotalPaise: number;
};

export type CartQuote = {
  items: CartItem[];
  subtotalPaise: number;
  maxDiscountPaise: number;
  discountPaise: number;
  totalPaise: number;
  coinsSpent: number;
  coinsBalanceAfter: number;
  coinsPerRupee: number;
  capReached: boolean;
};

export type OrderLine = {
  productName: string;
  unitPaise: number;
  quantity: number;
};

export type Order = {
  id: number;
  orderNumber: string;
  items: OrderLine[];
  subtotalPaise: number;
  discountPaise: number;
  totalPaise: number;
  coinsSpent: number;
  status: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  address: Address | null;
  createdAt: string;
};

export type EventType =
  | 'plant_drive'
  | 'cleanup_drive'
  | 'awareness'
  | 'recycling_drive'
  | 'workshop'
  | 'other';

export type EventItem = {
  id: number;
  slug: string;
  title: string;
  description: string;
  type: EventType;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  visibility: 'public' | 'invite_only';
  coverUrl: string | null;
  host: UserSummary;
  startAt: string;
  endAt: string;
  venueName: string;
  venueAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  registeredCount: number;
  checkedInCount: number;
  distanceKm?: number | null;
  viewer: {
    isHost: boolean;
    isCoHost: boolean;
    registered: boolean;
    passStatus: 'registered' | 'checked_in' | 'cancelled' | 'no_show' | null;
  };
};

export type EventPass = {
  id: number;
  eventId: number;
  eventTitle: string;
  eventStartAt: string;
  venueName: string;
  status: 'registered' | 'checked_in' | 'cancelled' | 'no_show';
  passCode: string;
  qrPayload: string;
  checkedInAt: string | null;
};

export type RewardEntry = {
  id: number;
  pointsDelta: number;
  coinsDelta: number;
  source: string;
  note: string | null;
  createdAt: string;
};

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  linkPath: string | null;
  readAt: string | null;
  createdAt: string;
};

export type OwnProfile = {
  user: UserSummary;
  timezone: string;
  wallet: Wallet;
  baseline: Baseline;
  answers: OnboardingAnswers;
  memberSince: string;
};

export type City = {
  id: number;
  name: string;
  regionCode: string;
};

export type PageInfo = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type DeviceOrder = {
  id: string;
  productName: string;
  productSlug: string;
  coins: number;
  createdAt: string;
};

export type DeviceLog = {
  body: SubmitLogBody;
  breakdown: Breakdown;
  baselineTotalKg: number;
  deltaKg: number;
  synced: boolean;
};

/** Points counted for a check-in. `device` means EcoLife has not granted them yet. */
export type CheckInReward = {
  points: number;
  coins: number;
  source: 'api' | 'device';
};

export type LocalUserState = {
  employeeId: string | null;
  organizationName: string | null;
  onboardingComplete: boolean;
  answers: OnboardingAnswers;
  baseline: Baseline | null;
  logs: Record<string, DeviceLog>;
  checkInRewards: Record<string, CheckInReward>;
  pendingLogs: SubmitLogBody[];
  redemptions: DeviceOrder[];
  spentCoins: number;
  eventRegistrations: number[];
  orgAnswers: Record<string, Record<string, string>>;
  dismissedTips: string[];
  acceptedTips: string[];
  gameInterest: boolean;
  commute: SavedCommute;
};

export type RankRow = {
  rank: number;
  name: string;
  points: number;
  userId: number | null;
  avatarUrl: string | null;
  subtitle: string | null;
};

export type CatalogProduct = Product & {
  coinPrice: number;
  badge: string | null;
  sample: boolean;
};

export type CatalogEvent = EventItem & {
  sample: boolean;
  audience: 'public' | 'organization';
  pointsLabel: string | null;
};
