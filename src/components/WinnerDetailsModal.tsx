import React, { useState } from 'react';
import { 
  X, 
  Trophy, 
  Medal, 
  Sparkles, 
  Calendar, 
  User, 
  Hash, 
  BookOpen, 
  CheckCircle2, 
  Share2, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  Award,
  GraduationCap
} from 'lucide-react';
import { EventWinner, UserProfile } from '../types';
import HoldButton from './HoldButton';

interface WinnerDetailsModalProps {
  winner: EventWinner | null;
  isOpen: boolean;
  onClose: () => void;
  canManageWinners?: boolean;
  onEdit?: (winner: EventWinner) => void;
  onDelete?: (winner: EventWinner) => void;
}

export default function WinnerDetailsModal({
  winner,
  isOpen,
  onClose,
  canManageWinners = false,
  onEdit,
  onDelete
}: WinnerDetailsModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !winner) return null;

  const isFirst = winner.position.includes('1st');
  const isSecond = winner.position.includes('2nd');
  const isThird = winner.position.includes('3rd');

  const rankTheme = isFirst 
    ? {
        border: 'border-amber-500/40',
        glow: 'from-amber-500/25 via-amber-500/5 to-transparent',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: '🏆',
        textColor: 'text-amber-400',
        ring: 'ring-amber-500/40'
      }
    : isSecond
    ? {
        border: 'border-slate-400/40',
        glow: 'from-slate-400/25 via-slate-400/5 to-transparent',
        badgeBg: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
        icon: '🥈',
        textColor: 'text-slate-300',
        ring: 'ring-slate-400/40'
      }
    : isThird
    ? {
        border: 'border-orange-500/40',
        glow: 'from-orange-500/25 via-orange-500/5 to-transparent',
        badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
        icon: '🥉',
        textColor: 'text-orange-400',
        ring: 'ring-orange-500/40'
      }
    : {
        border: 'border-violet-500/40',
        glow: 'from-violet-500/25 via-violet-500/5 to-transparent',
        badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
        icon: '🌟',
        textColor: 'text-violet-400',
        ring: 'ring-violet-500/40'
      };

  const handleCopyCitation = () => {
    const text = `🏆 Wall of Champions: Congratulations to ${winner.studentName} (${winner.rollNumber || 'AIML'}) for securing ${winner.position} [${winner.prizeTitle || 'Champion'}] in "${winner.eventTitle}"! ${winner.awardDetails ? `Award: ${winner.awardDetails}.` : ''} #DepartmentOfAIML #NOTXConnect`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className={`bg-surface border ${rankTheme.border} rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative`}>
        {/* Decorative Top Glow */}
        <div className={`absolute top-0 inset-x-0 h-28 bg-gradient-to-b ${rankTheme.glow} pointer-events-none`} />

        {/* Modal Top Bar */}
        <div className="p-4 border-b border-divider/70 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border font-mono tracking-wide ${rankTheme.badgeBg}`}>
              <span>{rankTheme.icon}</span>
              <span>{winner.position}</span>
            </span>
            <span className="font-mono text-[10px] text-tertiary">Wall of Champions</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyCitation}
              className="p-1.5 rounded-xl bg-surface-accent hover:bg-divider text-secondary hover:text-content border border-divider flex items-center gap-1 text-xs cursor-pointer transition-colors"
              title="Copy achievement citation"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-semibold">{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-surface-accent hover:bg-divider text-secondary hover:text-content border border-divider flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 relative z-10">
          {/* Champion Profile Spotlight */}
          <div className="flex items-center gap-3.5">
            <div className={`relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-surface border border-divider ring-2 ${rankTheme.ring} shadow-md`}>
              <img
                src={winner.studentPhoto || `https://api.dicebear.com/9.x/notionists/svg?seed=${winner.rollNumber || winner.studentId}`}
                alt={winner.studentName}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-display text-base font-bold text-content truncate">
                  {winner.studentName}
                </h3>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                {winner.rollNumber && (
                  <span className="font-mono text-[10.5px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md">
                    {winner.rollNumber}
                  </span>
                )}
                <span className="text-[11px] text-secondary font-mono truncate">
                  {winner.department || 'CSE (AI & ML)'}
                </span>
                {(winner.year || winner.section) && (
                  <span className="text-[10.5px] text-secondary font-mono">
                    • {winner.year}{winner.section ? ` Sec ${winner.section}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Event & Award Spotlight Card */}
          <div className="bg-surface-accent/40 border border-divider rounded-2xl p-4 space-y-3">
            <div>
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1 mb-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span>Department Event</span>
              </div>
              <div className="text-sm font-bold text-content font-display">
                {winner.eventTitle}
              </div>
              {winner.eventDate && (
                <div className="text-[10.5px] font-mono text-tertiary mt-0.5">
                  Conducted on {winner.eventDate}
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-divider/60">
              <div className="text-[9.5px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1 mb-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span>Prize & Distinction</span>
              </div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{winner.prizeTitle || winner.position}</span>
              </div>
              {winner.awardDetails && (
                <div className="mt-1.5 text-xs text-secondary font-medium leading-relaxed bg-surface/80 border border-divider/60 rounded-xl p-2.5">
                  {winner.awardDetails}
                </div>
              )}
            </div>

            {winner.projectTitle && (
              <div className="pt-2.5 border-t border-divider/60">
                <div className="text-[9.5px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1 mb-1">
                  <span>💡 Winning Project / Topic</span>
                </div>
                <div className="text-xs font-semibold text-indigo-200 font-mono bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-2.5">
                  {winner.projectTitle}
                </div>
              </div>
            )}
          </div>

          {/* Verification Footnote */}
          <div className="flex items-center justify-between text-[10px] text-tertiary font-mono pt-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <Award className="w-3 h-3" />
              Verified Department Winner
            </span>
            <span>{winner.addedBy ? `By ${winner.addedBy}` : 'Admin Verified'}</span>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="p-4 border-t border-divider/70 bg-surface-accent/30 flex items-center justify-between gap-2 shrink-0">
          {canManageWinners ? (
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(winner);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              {onDelete && (
                <HoldButton
                  size="sm"
                  holdTime={1600}
                  radius={12}
                  backgroundColor="rgba(244, 63, 94, 0.15)"
                  fillColor="#e11d48"
                  textColor="#fda4af"
                  fillTextColor="#ffffff"
                  doneLabel="Deleted"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onHold={() => {
                    setTimeout(() => {
                      onClose();
                      onDelete(winner);
                    }, 400);
                  }}
                  className="border border-rose-500/30 text-xs font-bold"
                >
                  Hold to Delete
                </HoldButton>
              )}
            </div>
          ) : (
            <div className="text-[10px] text-secondary font-mono">
              Academic Achiever Credential
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface hover:bg-divider text-content border border-divider text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
