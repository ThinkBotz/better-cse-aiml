import React, { useState } from 'react';
import { usePWAInstall } from '../usePWAInstall';
import { Download, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState<'ios' | 'android' | null>(null);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // 1. iOS Safari Flow (Webkit does not fire beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowGuide('ios')}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-bold uppercase font-mono bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-all"
          style={{ border: '1.5px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showGuide === 'ios' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
            <div 
              className="w-full max-w-sm rounded-lg bg-[var(--nb-surface)] p-6 relative text-[var(--nb-content)] space-y-4"
              style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard)' }}
            >
              <button
                type="button"
                onClick={() => setShowGuide(null)}
                className="nb-btn-ghost absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center cursor-pointer"
                style={{ border: '1.5px solid var(--nb-ink)' }}
              >
                <X className="w-4 h-4" />
              </button>
              
              <div 
                className="w-12 h-12 rounded bg-[var(--nb-surface-accent)] flex items-center justify-center text-[var(--nb-accent)]"
                style={{ border: '1.5px solid var(--nb-ink)' }}
              >
                <Download className="w-6 h-6" />
              </div>

              <div>
                <h3 className="nb-headline text-lg text-[var(--nb-content)]">Install on iPhone / iPad</h3>
                <p className="mt-2 text-xs text-[var(--nb-secondary)] leading-relaxed space-y-1">
                  1. Tap the <strong>Share</strong> icon at the bottom of Safari.<br />
                  2. Scroll down and select <strong>Add to Home Screen</strong>.<br />
                  3. Confirm by tapping <strong>Add</strong>.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setShowGuide(null)}
                className="w-full nb-btn text-xs font-bold uppercase tracking-wider py-2.5 rounded cursor-pointer"
                style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // 2. Android / Chromium Native Prompt or Fallback Flow
  if (isInstallable || isAndroid) {
    const handleAndroidClick = async () => {
      if (isInstallable) {
        const success = await install();
        if (!success && isAndroid) {
          setShowGuide('android');
        }
      } else {
        setShowGuide('android');
      }
    };

    return (
      <>
        <button
          type="button"
          onClick={handleAndroidClick}
          className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-bold uppercase font-mono bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-all"
          style={{ border: '1.5px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showGuide === 'android' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
            <div 
              className="w-full max-w-sm rounded-lg bg-[var(--nb-surface)] p-6 relative text-[var(--nb-content)] space-y-4"
              style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard)' }}
            >
              <button
                type="button"
                onClick={() => setShowGuide(null)}
                className="nb-btn-ghost absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center cursor-pointer"
                style={{ border: '1.5px solid var(--nb-ink)' }}
              >
                <X className="w-4 h-4" />
              </button>
              
              <div 
                className="w-12 h-12 rounded bg-[var(--nb-surface-accent)] flex items-center justify-center text-[var(--nb-accent)]"
                style={{ border: '1.5px solid var(--nb-ink)' }}
              >
                <Download className="w-6 h-6" />
              </div>

              <div>
                <h3 className="nb-headline text-lg text-[var(--nb-content)]">Install on Android Device</h3>
                <p className="mt-2 text-xs text-[var(--nb-secondary)] leading-relaxed space-y-1">
                  1. Tap the <strong>Three Dots (⋮)</strong> menu in Chrome.<br />
                  2. Tap <strong>Install App</strong> or <strong>Add to Home screen</strong>.<br />
                  3. Follow screen prompts to confirm installation.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setShowGuide(null)}
                className="w-full nb-btn text-xs font-bold uppercase tracking-wider py-2.5 rounded cursor-pointer"
                style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
export default PWAInstallButton;
