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
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-1 text-[11px] font-bold text-white shadow-md shadow-rose-500/30 hover:shadow-lg transition-all border border-rose-400/40 active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>

        {showGuide === 'ios' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[28px] bg-[#200D1B] dark:bg-[#200D1B] border border-rose-400/20 p-6 shadow-2xl relative text-white">
              <button
                type="button"
                onClick={() => setShowGuide(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 mb-3">
                <Download className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-extrabold font-display text-white">Install on iPhone / iPad</h3>
              <p className="mt-2 text-xs text-rose-100/80 leading-relaxed space-y-2">
                1. Tap the <strong className="text-white font-bold">Share</strong> icon at the bottom of Safari.<br />
                2. Scroll down and select <strong className="text-rose-300 font-bold">Add to Home Screen</strong>.<br />
                3. Confirm by tapping <strong className="text-white font-bold">Add</strong>.
              </p>
              
              <button
                type="button"
                onClick={() => setShowGuide(null)}
                className="mt-6 w-full ref-pill-button text-xs font-bold py-2.5"
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
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-1 text-[11px] font-bold text-white shadow-md shadow-rose-500/30 hover:shadow-lg transition-all border border-rose-400/40 active:scale-95 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isAndroid ? 'Install App' : 'Install App'}</span>
        </button>

        {showGuide === 'android' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
            <div className="w-full max-w-sm rounded-[28px] bg-[#200D1B] dark:bg-[#200D1B] border border-rose-400/20 p-6 shadow-2xl relative text-white">
              <button
                type="button"
                onClick={() => setShowGuide(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400 mb-3">
                <Download className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-extrabold font-display text-white">Install on Android Device</h3>
              <p className="mt-2 text-xs text-rose-100/80 leading-relaxed space-y-2">
                1. Tap the <strong className="text-white font-bold">Three Dots (⋮)</strong> menu in Chrome.<br />
                2. Tap <strong className="text-rose-300 font-bold">Install App</strong> or <strong className="text-rose-300 font-bold">Add to Home screen</strong>.<br />
                3. Follow screen prompts to confirm installation.
              </p>
              
              <button
                type="button"
                onClick={() => setShowGuide(null)}
                className="mt-6 w-full ref-pill-button text-xs font-bold py-2.5"
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

