'use client';

import { useEffect } from 'react';

import { touchSessionAction } from '@/app/actions/session';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

export function IdleSessionGuard() {
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    let lastTouch = 0;
    let stopped = false;

    const logout = async () => {
      if (stopped) return;
      stopped = true;
      const { logoutAction } = await import('@/app/(auth)/actions');
      await logoutAction();
    };

    const touch = () => {
      if (stopped) return;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => void logout(), IDLE_TIMEOUT_MS);

      const now = Date.now();
      if (now - lastTouch < TOUCH_INTERVAL_MS) return;
      lastTouch = now;
      void touchSessionAction().then((active) => {
        if (!active) window.location.assign('/login?reason=idle');
      });
    };

    const events: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, touch, { passive: true }));
    document.addEventListener('visibilitychange', touch);
    touch();

    return () => {
      stopped = true;
      clearTimeout(idleTimer);
      events.forEach((event) => window.removeEventListener(event, touch));
      document.removeEventListener('visibilitychange', touch);
    };
  }, []);

  return null;
}
