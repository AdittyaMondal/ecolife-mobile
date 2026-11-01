import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AppState, Platform } from 'react-native';
import { todayISO } from '@/lib/ids';
import { kv } from '@/lib/kv';
import { roadKm } from '@/lib/maps';
import type { TripMode } from '@/types/domain';

export const COMMUTE_TASK = 'ecolife-commute-trail';

type TrailPoint = { t: number; lat: number; lng: number };

const STORE = 'ecolife.commute.trail';
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeTrail(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

if (Platform.OS !== 'web') {
  TaskManager.defineTask(COMMUTE_TASK, async ({ data, error }) => {
    if (error || !data) return;
    const locations = (data as { locations?: Location.LocationObject[] }).locations ?? [];
    await appendLocations(locations);
  });
}

export async function readTrail(): Promise<TrailPoint[]> {
  try {
    const raw = await kv.getItem(STORE);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrailPoint[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendLocations(locations: Location.LocationObject[]) {
  if (locations.length === 0) return;
  const existing = await readTrail();
  const next = [...existing];
  for (const location of locations) {
    const point = {
      t: location.timestamp,
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
    const last = next[next.length - 1];
    if (last && point.t - last.t < 20_000 && meters(last, point) < 30) continue;
    next.push(point);
  }
  next.sort((a, b) => a.t - b.t);
  const cutoff = Date.now() - 36 * 60 * 60 * 1000;
  const trimmed = next.filter((point) => point.t >= cutoff).slice(-800);
  await kv.setItem(STORE, JSON.stringify(trimmed));
  emit();
}

let running = false;

/** Records the phone's locations. No place form. */
export async function startCommuteRecorder(): Promise<() => void> {
  if (Platform.OS === 'web' || running) return () => {};
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') return () => {};
  running = true;

  const capture = async () => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await appendLocations([position]);
    } catch {
      // A missed fix is not a commute.
    }
  };

  await capture();
  const watch = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 60,
      timeInterval: 45_000,
    },
    (position) => {
      void appendLocations([position]);
    },
  );
  const appState = AppState.addEventListener('change', (state) => {
    if (state === 'active') void capture();
  });

  let background = false;
  try {
    const backgroundPermission = await Location.requestBackgroundPermissionsAsync();
    if (backgroundPermission.status === 'granted') {
      const started = await Location.hasStartedLocationUpdatesAsync(COMMUTE_TASK);
      if (!started) {
        await Location.startLocationUpdatesAsync(COMMUTE_TASK, {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 80,
          deferredUpdatesInterval: 60_000,
          showsBackgroundLocationIndicator: false,
          foregroundService: {
            notificationTitle: 'EcoLife',
            notificationBody: 'Recording today’s commute.',
          },
        });
      }
      background = true;
    }
  } catch {
    background = false;
  }

  return () => {
    running = false;
    watch.remove();
    appState.remove();
    if (background) void Location.stopLocationUpdatesAsync(COMMUTE_TASK).catch(() => undefined);
  };
}

const roadCache = new Map<string, number>();

export async function measuredCommuteKm(mode: TripMode, timeZone: string): Promise<number | null> {
  if (mode === 'work_from_home') return 0;
  const ends = commuteEnds(await readTrail(), timeZone);
  if (!ends) return null;
  if (ends.pathKm != null && ends.pathKm >= 0.3) return ends.pathKm;
  const key = [
    mode,
    ends.home.lat.toFixed(3),
    ends.home.lng.toFixed(3),
    ends.work.lat.toFixed(3),
    ends.work.lng.toFixed(3),
  ].join(':');
  const cached = roadCache.get(key);
  if (cached != null) return cached;
  try {
    const km = await roadKm(ends.home, ends.work, mode);
    roadCache.set(key, km);
    return km;
  } catch {
    return ends.pathKm;
  }
}

export function commuteEnds(points: TrailPoint[], timeZone: string, now = Date.now()) {
  const today = todayISO(timeZone);
  const day = points.filter((point) => localDate(point.t, timeZone) === today && point.t <= now);
  if (day.length < 2) return null;

  const night = day.filter((point) => {
    const hour = localHour(point.t, timeZone);
    return hour >= 21 || hour < 9;
  });
  const home = centroid(
    night.length ? night : day.filter((point) => localHour(point.t, timeZone) < 10),
  );
  if (!home) return null;

  const away = day.filter((point) => {
    const hour = localHour(point.t, timeZone);
    return hour >= 10 && hour < 18 && meters(home, point) >= 400;
  });
  const work = densest(away);
  if (!work || meters(home, work) < 400) return null;

  const nearHome = day.filter((point) => meters(point, home) < 250);
  const nearWork = day.filter((point) => meters(point, work) < 250);
  const left = nearHome.reduce((latest, point) => Math.max(point.t, latest), 0);
  const arrived = nearWork.reduce((earliest, point) => {
    if (point.t < left) return earliest;
    return Math.min(point.t, earliest);
  }, Number.POSITIVE_INFINITY);
  const path = day.filter((point) => point.t >= left && point.t <= arrived);
  return { home, work, pathKm: path.length >= 2 ? pathKm(path) : null };
}

function pathKm(points: TrailPoint[]) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const gap = points[index].t - points[index - 1].t;
    const distance = meters(points[index - 1], points[index]);
    if (gap > 30 * 60 * 1000 || distance > 5000) continue;
    total += distance;
  }
  if (total < 300) return null;
  return Math.round(total / 100) / 10;
}

function densest(points: TrailPoint[]) {
  if (points.length === 0) return null;
  const groups = new Map<string, TrailPoint[]>();
  for (const point of points) {
    const key = `${point.lat.toFixed(3)}:${point.lng.toFixed(3)}`;
    const group = groups.get(key) ?? [];
    group.push(point);
    groups.set(key, group);
  }
  let best: TrailPoint[] = [];
  for (const group of groups.values()) {
    if (group.length > best.length) best = group;
  }
  return centroid(best);
}

function centroid(points: TrailPoint[]) {
  if (points.length === 0) return null;
  return {
    lat: points.reduce((sum, point) => sum + point.lat, 0) / points.length,
    lng: points.reduce((sum, point) => sum + point.lng, 0) / points.length,
  };
}

function meters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radius = 6_371_000;
  const lat = ((b.lat - a.lat) * Math.PI) / 180;
  const lng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(lat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(lng / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function localHour(timestamp: number, timeZone: string) {
  return Number(
    new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(
      new Date(timestamp),
    ),
  );
}

function localDate(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp));
}
