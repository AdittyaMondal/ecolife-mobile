import type { TripMode } from '@/types/domain';

const KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const TRAVEL: Partial<Record<TripMode, string>> = {
  walk: 'WALK',
  cycle: 'BICYCLE',
  bus: 'TRANSIT',
  metro_train: 'TRANSIT',
  two_wheeler: 'TWO_WHEELER',
  car: 'DRIVE',
  cab: 'DRIVE',
  auto_rickshaw: 'DRIVE',
};

type GoogleError = { error?: { message?: string } };

/** Road distance between two points the phone already observed. */
export async function roadKm(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  mode: TripMode,
): Promise<number> {
  if (!KEY) throw new Error('Maps key missing');
  const travel = TRAVEL[mode] ?? 'DRIVE';
  try {
    return await route(origin, destination, travel);
  } catch (error) {
    if (travel === 'DRIVE') throw error;
    return route(origin, destination, 'DRIVE');
  }
}

async function route(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: string,
) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': KEY ?? '',
    'X-Goog-FieldMask': 'routes.distanceMeters',
  });
  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
      destination: {
        location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
      },
      travelMode,
      units: 'METRIC',
      ...(travelMode === 'TRANSIT' ? { departureTime: new Date().toISOString() } : {}),
    }),
  });
  const body = (await response.json()) as GoogleError & { routes?: { distanceMeters?: number }[] };
  if (!response.ok) throw new Error(body.error?.message ?? 'No route');
  const meters = body.routes?.[0]?.distanceMeters;
  if (typeof meters !== 'number') throw new Error('No route');
  return Math.max(0.1, Math.min(200, Math.round(meters / 100) / 10));
}
