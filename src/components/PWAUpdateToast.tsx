import React, { useEffect, useState } from 'react';
import { subscribeUpdateState, UpdateState } from '../pwaUpdateManager';
import { RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';

export const PWAUpdateToast: React.FC = () => {
  const [state, setState] = useState<UpdateState>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const unsubscribe = subscribeUpdateState((newState, msg) => {
      setState(newState);
      if (msg) setMessage(msg);

      if (newState === 'latest' || newState === 'error') {
        const timer = setTimeout(() => {
          setState('idle');
        }, 3500);
        return () => clearTimeout(timer);
      }
    });

    return unsubscribe;
  }, []);

  if (state === 'idle') return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-sm w-[90%] px-2 animate-fadeIn">
      <div 
        className="bg-[var(--nb-surface)] rounded-lg p-3 flex items-center gap-3 pointer-events-auto"
        style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard)' }}
      >
        {state === 'checking' && (
          <div 
            className="w-8 h-8 rounded bg-[var(--nb-surface-accent)] flex items-center justify-center shrink-0 text-[var(--nb-accent)]"
            style={{ border: '1.5px solid var(--nb-ink)' }}
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
          </div>
        )}
        {state === 'updated' && (
          <div 
            className="w-8 h-8 rounded bg-emerald-400 text-black flex items-center justify-center shrink-0"
            style={{ border: '1.5px solid var(--nb-ink)' }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
        )}
        {state === 'latest' && (
          <div 
            className="w-8 h-8 rounded bg-emerald-400 text-black flex items-center justify-center shrink-0"
            style={{ border: '1.5px solid var(--nb-ink)' }}
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="nb-headline text-xs text-[var(--nb-content)]">
            {state === 'checking' && 'Checking for Updates'}
            {state === 'updated' && 'Updating NOTX Connect'}
            {state === 'latest' && 'App Up To Date'}
            {state === 'error' && 'Update Check Failed'}
          </p>
          <p className="nb-label text-[10px] text-[var(--nb-secondary)] truncate mt-0.5">
            {message || 'Syncing latest features and bug fixes automatically.'}
          </p>
        </div>
      </div>
    </div>
  );
};
export default PWAUpdateToast;
