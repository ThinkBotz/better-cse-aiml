import { registerSW } from 'virtual:pwa-register';

export type UpdateState = 'idle' | 'checking' | 'updated' | 'latest' | 'error';

let swRegistration: ServiceWorkerRegistration | null = null;
let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;
let listeners: Array<(state: UpdateState, message?: string) => void> = [];

function notifyListeners(state: UpdateState, message?: string) {
  listeners.forEach(fn => fn(state, message));
}

export function subscribeUpdateState(fn: (state: UpdateState, message?: string) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(item => item !== fn);
  };
}

let isRegistered = false;

export function initPWAAutoUpdate() {
  if (isRegistered || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }
  isRegistered = true;

  updateSWFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      notifyListeners('updated', 'A new version of NOTX Connect is available. Updating...');
      // Activate the new service worker immediately
      if (updateSWFn) {
        updateSWFn(true).catch(err => {
          console.warn('[PWA] Error updating service worker:', err);
        });
      }
    },
    onOfflineReady() {
      console.log('[PWA] NOTX Connect is ready for offline standalone usage.');
    },
    onRegisteredSW(swScriptUrl, registration) {
      if (registration) {
        swRegistration = registration;
        console.log('[PWA] Service worker registered successfully:', swScriptUrl);

        // 1. Check for updates on app foreground / resume (Critical for iOS Home Screen & PWA APK)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            checkRegistrationUpdate();
          }
        });

        window.addEventListener('focus', () => {
          checkRegistrationUpdate();
        });

        // 2. Check for updates when device regains network connection
        window.addEventListener('online', () => {
          checkRegistrationUpdate();
        });

        // 3. Periodic background check every 10 minutes
        setInterval(() => {
          checkRegistrationUpdate();
        }, 10 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('[PWA] Service worker registration error:', error);
    },
  });

  // Ensure fresh page reload once new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      console.log('[PWA] New controller detected. Reloading to activate latest build...');
      window.location.reload();
    }
  });
}

async function checkRegistrationUpdate(): Promise<boolean> {
  if (!swRegistration) return false;
  try {
    await swRegistration.update();
    return true;
  } catch (err) {
    console.warn('[PWA] Periodic update check failed:', err);
    return false;
  }
}

/**
 * Manual check triggered by user or UI
 */
export async function checkForAppUpdates(): Promise<{ updated: boolean; message: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { updated: false, message: 'Service worker not supported on this browser.' };
  }

  notifyListeners('checking', 'Checking for latest published updates...');

  try {
    if (!swRegistration) {
      // If registration hasn't attached yet, try to get existing registration
      swRegistration = (await navigator.serviceWorker.getRegistration()) || null;
    }

    if (swRegistration) {
      const prevWaiting = swRegistration.waiting;
      await swRegistration.update();
      
      // If there's an installing or waiting worker, activate it
      if (swRegistration.waiting && swRegistration.waiting !== prevWaiting) {
        notifyListeners('updated', 'New version found! Installing update...');
        if (updateSWFn) {
          await updateSWFn(true);
        }
        return { updated: true, message: 'Update found and applied!' };
      }
    }

    notifyListeners('latest', 'You are on the latest version of NOTX Connect.');
    return { updated: false, message: 'Already up to date with the latest release.' };
  } catch (error) {
    notifyListeners('error', 'Unable to check for updates. Check connection.');
    return { updated: false, message: 'Update check failed.' };
  }
}
