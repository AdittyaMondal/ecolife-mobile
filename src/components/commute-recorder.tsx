import { useEffect } from 'react';
import { startCommuteRecorder } from '@/lib/commute-trail';
import { useAuth } from '@/providers/auth-provider';

/** Starts location capture after sign-in. There is no place form. */
export function CommuteRecorder() {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'signedIn') return;
    let stop = () => {};
    let cancel = false;
    void startCommuteRecorder().then((cleanup) => {
      if (cancel) cleanup();
      else stop = cleanup;
    });
    return () => {
      cancel = true;
      stop();
    };
  }, [status]);

  return null;
}
