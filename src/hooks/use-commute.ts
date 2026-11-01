import { useEffect, useState } from 'react';
import { measuredCommuteKm, subscribeTrail } from '@/lib/commute-trail';
import { useAuth } from '@/providers/auth-provider';
import type { TripMode } from '@/types/domain';

/** One-way kilometres observed from this phone today. Null until both ends exist. */
export function useMeasuredCommute(mode: TripMode) {
  const { user } = useAuth();
  const zone = user?.timezone || 'Asia/Kolkata';
  const [km, setKm] = useState<number | null>(mode === 'work_from_home' ? 0 : null);

  useEffect(() => {
    if (mode === 'work_from_home') {
      setKm(0);
      return;
    }
    let cancel = false;
    const load = () => {
      void measuredCommuteKm(mode, zone).then((value) => {
        if (!cancel) setKm(value);
      });
    };
    load();
    const unsubscribe = subscribeTrail(load);
    return () => {
      cancel = true;
      unsubscribe();
    };
  }, [mode, zone]);

  return km;
}
