import { kv } from '@/lib/kv';
import type { CheckInReward, LocalUserState } from '@/types/domain';

export function rewardBonus(local: LocalUserState) {
  const rows = Object.values(local.checkInRewards ?? {}) as CheckInReward[];
  const device = rows.filter((row) => row.source === 'device');
  const confirmed = rows.filter((row) => row.source === 'api');
  return {
    points: device.reduce((sum, row) => sum + row.points, 0),
    coins: device.reduce((sum, row) => sum + row.coins, 0),
    confirmedPoints: confirmed.reduce((sum, row) => sum + row.points, 0),
    confirmedCoins: confirmed.reduce((sum, row) => sum + row.coins, 0),
  };
}

export function shownPoints(wallet: number, local: LocalUserState) {
  const bonus = rewardBonus(local);
  return Math.max(wallet, bonus.confirmedPoints) + bonus.points;
}

export function shownCoins(wallet: number, local: LocalUserState, spent = 0) {
  const bonus = rewardBonus(local);
  return Math.max(0, Math.max(wallet, bonus.confirmedCoins) + bonus.coins - spent);
}

const keyFor = (userId: number) => `ecolife.user.${userId}`;

export function emptyLocal(): LocalUserState {
  return {
    employeeId: null,
    organizationName: null,
    onboardingComplete: false,
    answers: {},
    baseline: null,
    logs: {},
    checkInRewards: {},
    pendingLogs: [],
    redemptions: [],
    spentCoins: 0,
    eventRegistrations: [],
    orgAnswers: {},
    dismissedTips: [],
    acceptedTips: [],
    gameInterest: false,
  };
}

export async function readLocal(userId: number): Promise<LocalUserState> {
  try {
    const raw = await kv.getItem(keyFor(userId));
    if (!raw) return emptyLocal();
    const parsed = JSON.parse(raw) as Partial<LocalUserState>;
    return {
      ...emptyLocal(),
      ...parsed,
      checkInRewards: parsed.checkInRewards ?? {},
      logs: parsed.logs ?? {},
      pendingLogs: parsed.pendingLogs ?? [],
    };
  } catch {
    return emptyLocal();
  }
}

export async function writeLocal(userId: number, state: LocalUserState): Promise<void> {
  await kv.setItem(keyFor(userId), JSON.stringify(state));
}
