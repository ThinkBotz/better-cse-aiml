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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none max-w-sm w-[90%] px-2 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-surface/95 backdrop-blur-md border border-divider shadow-2xl rounded-2xl p-3 flex items-center gap-3 pointer-events-auto">
        {state === 'checking' && (
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
          </div>
        )}
        {state === 'updated' && (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-bounce" />
          </div>
        )}
        {state === 'latest' && (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-content font-display">
            {state === 'checking' && 'Checking for Updates'}
            {state === 'updated' && 'Updating NOTX Connect'}
            {state === 'latest' && 'App Up To Date'}
            {state === 'error' && 'Update Check Failed'}
          </p>
          <p className="text-[11px] text-secondary truncate mt-0.5">
            {message || 'Syncing latest features and bug fixes automatically.'}
          </p>
        </div>
      </div>
    </div>
  );
};
