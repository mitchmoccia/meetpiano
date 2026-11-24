'use client';

import { track } from '@vercel/analytics';
import { prepareEvent, trackingOptOut, type PrivacySignals } from './events';

export type SignupEventName = 'signup_start' | 'signup_complete';

function browserSignals(): PrivacySignals {
  const nav = navigator as Navigator & { msDoNotTrack?: string; globalPrivacyControl?: boolean };
  const host = window as Window & { doNotTrack?: string };
  return {
    doNotTrack: nav.doNotTrack,
    windowDoNotTrack: typeof host.doNotTrack === 'string' ? host.doNotTrack : null,
    msDoNotTrack: typeof nav.msDoNotTrack === 'string' ? nav.msDoNotTrack : null,
    globalPrivacyControl: nav.globalPrivacyControl === true
  };
}

/**
 * Signup funnel only. The external /js/analytics.js file loads the same-origin
 * insights script and registers beforeSend. Do not call inject() from this package:
 * its development mode requests va.vercel-scripts.com.
 */
export function trackProductEvent(name: SignupEventName): void {
  try {
    if (typeof window === 'undefined' || trackingOptOut(browserSignals())) return;
    const clean = prepareEvent(name);
    if (!clean) return;
    track(clean.name);
  } catch {
    /* Creating an account still finishes when the beacon is blocked. */
  }
}
