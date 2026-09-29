import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Calendar, 
  Award, 
  BookOpen, 
  ChevronRight, 
  Volume2, 
  Sparkles, 
  AlertCircle, 
  Bookmark, 
  Flame,
  ShieldCheck,
  GraduationCap,
  Hash,
  Cpu,
  Trophy,
  Medal,
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  Edit3,
  Eye,
  Search,
  X,
  Filter
} from 'lucide-react';
import { UserProfile, DepartmentEvent, Announcement, EventRegistration, EventWinner } from '../types';
import { subscribeToEventWinners, deleteEventWinner } from '../firebase';
import AddEventWinnerModal from './AddEventWinnerModal';
import WinnerDetailsModal from './WinnerDetailsModal';
import HoldButton from './HoldButton';

interface DashboardViewProps {
  user: UserProfile;
  allUsers?: UserProfile[];
  events: DepartmentEvent[];
  announcements: Announcement[];
  registrations: EventRegistration[];
  onNavigate: (tab: string) => void;
  onSelectEvent: (event: DepartmentEvent) => void;
  isLoading?: boolean;
}

export default function DashboardView({ 
  user, 
  allUsers = [],
  events, 
  announcements, 
  registrations, 
  onNavigate,
  onSelectEvent,
  isLoading = false
}: DashboardViewProps) {
  const [winners, setWinners] = useState<EventWinner[]>([]);
  const [isAddWinnerOpen, setIsAddWinnerOpen] = useState(false);
  const [winnerToEdit, setWinnerToEdit] = useState<EventWinner | null>(null);
  const [winnerToView, setWinnerToView] = useState<EventWinner | null>(null);
  const [winnerToDelete, setWinnerToDelete] = useState<EventWinner | null>(null);
  const [isDeletingWinner, setIsDeletingWinner] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Search and filter for Wall of Champions
  const [winnerSearch, setWinnerSearch] = useState('');
  const [winnerRankFilter, setWinnerRankFilter] = useState<'all' | '1st' | '2nd' | '3rd' | 'Special'>('all');

  useEffect(() => {
    const unsub = subscribeToEventWinners((fetchedWinners) => {
      setWinners(fetchedWinners);
    });
    return () => unsub();
  }, []);

  const canManageWinners = user.role === 'admin' || user.role === 'president' || (user.role === 'associate' && user.powers?.canManageEvents);

  const handleOpenAdd = () => {
    setWinnerToEdit(null);
    setIsAddWinnerOpen(true);
  };

  const handleOpenEdit = (w: EventWinner) => {
    setWinnerToEdit(w);
    setIsAddWinnerOpen(true);
  };

  const confirmDeleteWinner = async () => {
    if (!winnerToDelete) return;
    setIsDeletingWinner(true);
    try {
      await deleteEventWinner(winnerToDelete.winnerId);
      setToastMessage(`Champion record for "${winnerToDelete.studentName}" was removed from the Wall of Fame.`);
      setTimeout(() => setToastMessage(null), 3500);
      setWinnerToDelete(null);
    } catch (err) {
      console.error("Failed to delete event winner:", err);
    } finally {
      setIsDeletingWinner(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-36 sm:pb-32 space-y-4 select-none">
        {/* Shimmer Welcoming Card */}
        <div className="relative rounded-2xl bg-surface/60 p-4 border border-divider/80 overflow-hidden animate-pulse">
          <div className="flex items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-13 h-13 rounded-2xl bg-surface-accent border border-divider" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4.5 w-36 bg-surface-accent rounded-md" />
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-16 bg-surface-accent rounded-lg" />
                  <div className="h-4 w-20 bg-surface-accent/60 rounded-lg" />
                  <div className="h-4 w-24 bg-surface-accent/60 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="hidden sm:block w-10 h-10 rounded-xl bg-surface-accent/60" />
          </div>
        </div>

        {/* Shimmer Upcoming Events Carousel */}
        <div>
          <div className="flex justify-between items-center mb-2.5">
            <div className="h-3 w-28 bg-surface-accent rounded animate-pulse" />
            <div className="h-3 w-12 bg-surface-accent/60 rounded animate-pulse" />
          </div>
          <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none">
            {[1, 2].map((i) => (
              <div key={i} className="w-[240px] flex-shrink-0 bg-surface/60 rounded-2xl border border-divider/80 overflow-hidden animate-pulse">
                <div className="h-24 bg-surface-accent" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 w-3/4 bg-surface-accent rounded" />
                  <div className="flex justify-between items-center pt-1">
                    <div className="h-2.5 w-16 bg-surface-accent/60 rounded" />
                    <div className="h-3 w-16 bg-surface-accent/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // User registrations lookup
  const myRegs = registrations.filter(r => {
    if (r.studentId === user.uid) return true;
    if (user.rollNumber && r.rollNumber?.toLowerCase() === user.rollNumber.toLowerCase()) return true;
    if (user.rollNumber && r.teamMembers) {
      return r.teamMembers.some(m => m.rollNumber?.toLowerCase() === user.rollNumber?.toLowerCase() && m.status !== 'Declined');
    }
    return false;
  });

  // Upcoming active events
  const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).slice(0, 3);

  // Latest notices
  const recentAnnouncements = [...announcements]
    .sort((a, b) => {
      const tsA = parseInt(a.announcementId.split('_')[1] || '0', 10);
      const tsB = parseInt(b.announcementId.split('_')[1] || '0', 10);
      if (tsA && tsB) return tsB - tsA;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 3);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-36 sm:pb-32 space-y-5 bg-background text-content">
      
      {/* Dynamic Welcoming Card inspired by the reference design */}
      <div className="relative rounded-[28px] bg-gradient-to-br from-[#230D1D] via-[#1C0917] to-[#140611] dark:from-[#230D1D] dark:via-[#1C0917] dark:to-[#140611] p-5 sm:p-6 border border-white/10 dark:border-rose-400/15 overflow-hidden shadow-2xl shadow-rose-950/30">
        {/* Soft atmospheric radial glows */}
        <div className="absolute -right-10 -top-10 w-44 h-44 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
            {/* User Avatar with status pulse dot */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-rose-500 via-pink-400 to-violet-500 shadow-lg shadow-rose-500/25">
                <img 
                  src={user.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.rollNumber || user.uid}`} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover bg-[#1c0817]"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#1c0817] flex items-center justify-center shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            {/* Profile Information */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-rose-300/80 uppercase tracking-widest font-sans">
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-2xl font-display font-extrabold text-white tracking-tight truncate">
                  {user.name}!
                </h3>
                {user.role === 'admin' ? (
                  <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                )}
              </div>

              {/* Pill Badges Row */}
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                {/* Role Symbol Badge */}
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-rose-200 bg-rose-500/20 border border-rose-400/30 px-3 py-1 rounded-full uppercase tracking-wider font-sans shadow-xs">
                  {user.role === 'admin' ? (
                    <ShieldCheck className="w-3 h-3 text-rose-300" />
                  ) : user.role === 'associate' ? (
                    <Award className="w-3 h-3 text-rose-300" />
                  ) : (
                    <GraduationCap className="w-3 h-3 text-rose-300" />
                  )}
                  {user.role}
                </span>

                {/* Roll Number Symbol Badge */}
                {user.rollNumber && (
                  <span className="inline-flex items-center gap-1.5 font-sans text-[10px] text-violet-200 font-bold tracking-wider bg-violet-500/20 px-3 py-1 rounded-full border border-violet-400/30 shadow-xs">
                    <Hash className="w-3 h-3 text-violet-300" />
                    {user.rollNumber}
                  </span>
                )}

                {/* Academic Year/Section Symbol Badge */}
                {user.role === 'student' && (user.year || user.section) ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-pink-200 font-bold bg-white/10 border border-white/15 px-3 py-1 rounded-full backdrop-blur-md">
                    <BookOpen className="w-3 h-3 text-pink-300" />
                    {user.year ? `${user.year}` : ''}{user.section ? ` • Sec ${user.section}` : ''}
                  </span>
                ) : user.position ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-pink-200 font-bold bg-white/10 border border-white/15 px-3 py-1 rounded-full backdrop-blur-md">
                    <Award className="w-3 h-3 text-pink-300" />
                    {user.position}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Department Emblem Symbol */}
          <div className="hidden sm:flex flex-col items-center justify-center px-4 py-3 rounded-2xl bg-white/10 border border-white/15 shrink-0 gap-1 shadow-inner backdrop-blur-md">
            <Cpu className="w-5 h-5 text-rose-300" />
            <span className="text-[9px] font-sans font-extrabold text-rose-200 uppercase tracking-widest">AI & ML</span>
          </div>
        </div>
      </div>

      {/* WALL OF CHAMPIONS • EVENT WINNERS SECTION */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-display text-xs font-bold uppercase text-secondary tracking-wider">
                  Wall of Champions • Event Winners
                </h4>
                {winners.length > 0 && (
                  <span className="font-sans text-[10px] font-extrabold bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                    {winners.length} {winners.length === 1 ? 'Champion' : 'Champions'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {canManageWinners && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="ref-pill-button text-[11px] font-bold tracking-wider py-2 px-4 shadow-lg shadow-rose-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <div className="ref-icon-bubble w-5 h-5">
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>Add Winner</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Rank Filter Controls (when winners exist) */}
        {winners.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-surface/60 backdrop-blur-md border border-divider p-2.5 rounded-full">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                value={winnerSearch}
                onChange={(e) => setWinnerSearch(e.target.value)}
                placeholder="Search champions by name, roll no, event, or project..."
                className="w-full bg-surface-accent/70 border border-divider/60 text-xs text-content rounded-full pl-9 pr-8 py-2 outline-none focus:border-rose-500/50"
              />
              {winnerSearch && (
                <button
                  type="button"
                  onClick={() => setWinnerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-content p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 shrink-0 px-1">
              {[
                { id: 'all', label: 'All Ranks' },
                { id: '1st', label: '🏆 1st' },
                { id: '2nd', label: '🥈 2nd' },
                { id: '3rd', label: '🥉 3rd' },
                { id: 'Special', label: '🌟 Special' },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setWinnerRankFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold font-sans transition-all cursor-pointer whitespace-nowrap ${
                    winnerRankFilter === f.id
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/25'
                      : 'bg-surface-accent/50 hover:bg-surface-accent text-secondary hover:text-content border border-divider/60'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {winners.length === 0 ? (
          canManageWinners ? (
            <div className="bg-gradient-to-br from-surface via-surface-accent/30 to-surface rounded-2xl p-4 sm:p-5 border border-dashed border-amber-500/30 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 mx-auto flex items-center justify-center text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h5 className="font-display text-xs font-bold text-content">No Event Winners Featured Yet</h5>
                <p className="text-[11px] text-secondary leading-relaxed">
                  Admins can dynamically spotlight hackathon champions, quiz masters, and competition winners directly on the home page by selecting students from the database.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                Feature First Winner
              </button>
            </div>
          ) : (
            <div className="bg-surface rounded-2xl p-4 text-center border border-divider/80">
              <p className="text-xs text-secondary font-medium">Department competition winners and podium finishes will be announced here.</p>
            </div>
          )
        ) : (
          (() => {
            const filteredWinners = winners.filter((winner) => {
              if (winnerRankFilter !== 'all') {
                if (winnerRankFilter === '1st' && !winner.position.includes('1st')) return false;
                if (winnerRankFilter === '2nd' && !winner.position.includes('2nd')) return false;
                if (winnerRankFilter === '3rd' && !winner.position.includes('3rd')) return false;
                if (winnerRankFilter === 'Special' && !winner.position.toLowerCase().includes('special')) return false;
              }
              if (!winnerSearch.trim()) return true;
              const q = winnerSearch.toLowerCase().trim();
              return (
                (winner.studentName || '').toLowerCase().includes(q) ||
                (winner.rollNumber || '').toLowerCase().includes(q) ||
                (winner.eventTitle || '').toLowerCase().includes(q) ||
                (winner.prizeTitle || '').toLowerCase().includes(q) ||
                (winner.projectTitle || '').toLowerCase().includes(q) ||
                (winner.department || '').toLowerCase().includes(q)
              );
            });

            if (filteredWinners.length === 0) {
              return (
                <div className="bg-surface rounded-2xl p-6 text-center border border-divider/80 space-y-2">
                  <p className="text-xs text-secondary font-medium">No event winners match "{winnerSearch}".</p>
                  <button
                    type="button"
                    onClick={() => {
                      setWinnerSearch('');
                      setWinnerRankFilter('all');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    Reset Search & Filters
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredWinners.map((winner) => {
                  const isFirst = winner.position.includes('1st');
                  const isSecond = winner.position.includes('2nd');
                  const isThird = winner.position.includes('3rd');
                  const rankTheme = isFirst 
                    ? {
                        border: 'border-amber-500/40 hover:border-amber-500/70',
                        bg: 'from-amber-500/10 via-surface to-surface',
                        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                        icon: '🏆',
                        ring: 'ring-amber-500/30'
                      }
                    : isSecond
                    ? {
                        border: 'border-slate-400/40 hover:border-slate-400/70',
                        bg: 'from-slate-400/10 via-surface to-surface',
                        badgeBg: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
                        icon: '🥈',
                        ring: 'ring-slate-400/30'
                      }
                    : isThird
                    ? {
                        border: 'border-orange-500/40 hover:border-orange-500/70',
                        bg: 'from-orange-500/10 via-surface to-surface',
                        badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                        icon: '🥉',
                        ring: 'ring-orange-500/30'
                      }
                    : {
                        border: 'border-violet-500/40 hover:border-violet-500/70',
                        bg: 'from-violet-500/10 via-surface to-surface',
                        badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/40',
                        icon: '🌟',
                        ring: 'ring-violet-500/30'
                      };

                  return (
                    <div
                      key={winner.winnerId}
                      onClick={() => setWinnerToView(winner)}
                      className={`relative rounded-2xl bg-gradient-to-b ${rankTheme.bg} p-3.5 border ${rankTheme.border} transition-all shadow-md hover:shadow-xl flex flex-col justify-between group overflow-hidden cursor-pointer active:scale-[0.99]`}
                    >
                      {/* Subtle Glow in background */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/3 rounded-full blur-2xl pointer-events-none" />

                      <div>
                        {/* Top Row: Position Badge & Action Buttons (View, Edit, Delete) */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border font-mono tracking-wide ${rankTheme.badgeBg}`}>
                            <span>{rankTheme.icon}</span>
                            <span>{winner.position}</span>
                          </span>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {winner.eventDate && (
                              <span className="font-mono text-[9px] text-tertiary mr-1 hidden sm:inline">
                                {winner.eventDate}
                              </span>
                            )}

                            {/* View action button */}
                            <button
                              type="button"
                              onClick={() => setWinnerToView(winner)}
                              title="View champion credential details"
                              className="p-1 rounded-lg text-secondary hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Admin Edit button */}
                            {canManageWinners && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(winner)}
                                title="Edit winner details"
                                className="p-1 rounded-lg text-secondary hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Admin Delete button */}
                            {canManageWinners && (
                              <button
                                type="button"
                                onClick={() => setWinnerToDelete(winner)}
                                title="Remove winner from Wall of Fame"
                                className="p-1 rounded-lg text-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Student Info Row */}
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className={`relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-surface border border-divider/80 ring-1 ${rankTheme.ring}`}>
                            <img
                              src={winner.studentPhoto || `https://api.dicebear.com/9.x/notionists/svg?seed=${winner.rollNumber || winner.studentId}`}
                              alt={winner.studentName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <h5 className="font-display text-xs font-bold text-content truncate group-hover:text-amber-300 transition-colors">
                                {winner.studentName}
                              </h5>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="font-mono text-[9.5px] font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.2 rounded">
                                {winner.rollNumber}
                              </span>
                              <span className="text-[9.5px] text-secondary font-mono truncate">
                                {winner.department || 'CSE (AI & ML)'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Event & Prize Details */}
                        <div className="space-y-1.5 pt-2 border-t border-divider/60">
                          <div className="flex items-center gap-1.5 text-secondary">
                            <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                            <span className="text-[10.5px] font-bold text-content truncate">{winner.eventTitle}</span>
                          </div>

                          {winner.prizeTitle && (
                            <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                              <span className="truncate">{winner.prizeTitle}</span>
                            </div>
                          )}

                          {winner.awardDetails && (
                            <div className="text-[10px] text-secondary font-medium leading-relaxed bg-surface/70 border border-divider/60 rounded-lg px-2 py-1 line-clamp-2">
                              {winner.awardDetails}
                            </div>
                          )}

                          {winner.projectTitle && (
                            <div className="text-[9.5px] text-indigo-300 font-mono italic truncate bg-indigo-500/10 border border-indigo-500/20 rounded-md px-1.5 py-0.5">
                              💡 {winner.projectTitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-divider/40 flex justify-between items-center text-[8.5px] text-tertiary font-mono">
                        <span className="text-amber-400/80 font-medium">Click for Full Credential</span>
                        <span>{winner.addedBy ? `By ${winner.addedBy}` : 'Department'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        )}
      </div>

      {/* Upcoming Events Carousel */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <h4 className="font-display text-[11px] font-bold uppercase text-secondary tracking-wider">Upcoming Events</h4>
          <button 
            onClick={() => onNavigate('events')} 
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 uppercase tracking-wider cursor-pointer"
          >
            See All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="bg-surface rounded-2xl p-5 text-center border border-divider/80">
            <p className="text-xs text-secondary font-medium">No upcoming events listed right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {upcomingEvents.map((event) => {
              const isRegistered = myRegs.some(r => r.eventId === event.eventId);
              return (
                <div 
                  key={event.eventId}
                  onClick={() => onSelectEvent(event)}
                  className="w-full bg-surface hover:bg-surface-accent rounded-2xl border border-divider/80 hover:border-indigo-500/40 overflow-hidden transition-all cursor-pointer shadow-lg group flex flex-col"
                >
                  <div className="relative h-28 sm:h-32">
                    <img 
                      src={event.posterImage} 
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-surface/85 backdrop-blur-xs text-violet-300 text-[9px] font-bold px-2 py-0.5 rounded-md border border-divider/60 font-mono">
                      {event.category}
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <h5 className="font-display text-xs font-bold text-content truncate">{event.title}</h5>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-divider/60">
                      <span className="font-mono text-[10px] text-secondary">{event.date}</span>
                      {isRegistered ? (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded border border-indigo-500/20">
                          Registered
                        </span>
                      ) : (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-indigo-500/20">
                          Open
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pinned Announcements */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <h4 className="font-display text-[11px] font-bold uppercase text-secondary tracking-wider">Latest Bulletins</h4>
          <button 
            onClick={() => onNavigate('announcements')} 
            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-0.5 uppercase tracking-wider cursor-pointer"
          >
            All Bulletins <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {recentAnnouncements.map((announce) => (
            <div 
              key={announce.announcementId}
              onClick={() => onNavigate('announcements')}
              className="bg-surface hover:bg-surface-accent p-3.5 rounded-xl border border-divider/80 hover:border-divider/80 transition-all cursor-pointer flex gap-3 items-start shadow-sm"
            >
              <div className="w-7.5 h-7.5 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 flex-shrink-0 mt-0.5">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="text-[9px] font-bold text-indigo-400 tracking-wide uppercase font-mono">{announce.category}</span>
                  <span className="font-mono text-[9px] text-tertiary">{announce.date}</span>
                </div>
                <h5 className="text-xs font-bold text-primary mt-0.5 truncate">{announce.title}</h5>
                <p className="text-[11px] text-secondary mt-0.5 line-clamp-1 leading-relaxed">{announce.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Add / Edit Event Winner Modal (CREATE & UPDATE) */}
      {isAddWinnerOpen && (
        <AddEventWinnerModal
          isOpen={isAddWinnerOpen}
          onClose={() => {
            setIsAddWinnerOpen(false);
            setWinnerToEdit(null);
          }}
          events={events}
          allUsers={allUsers}
          currentUser={user}
          initialWinner={winnerToEdit}
          onWinnerSaved={(winnerId) => {
            setToastMessage(winnerToEdit ? "Wall of Champions winner updated successfully!" : "New Champion published to Wall of Fame!");
            setTimeout(() => setToastMessage(null), 3500);
          }}
        />
      )}

      {/* View Champion Details Modal (READ) */}
      {winnerToView && (
        <WinnerDetailsModal
          isOpen={Boolean(winnerToView)}
          winner={winnerToView}
          onClose={() => setWinnerToView(null)}
          canManageWinners={canManageWinners}
          onEdit={(w) => {
            setWinnerToView(null);
            handleOpenEdit(w);
          }}
          onDelete={(w) => {
            setWinnerToView(null);
            setWinnerToDelete(w);
          }}
        />
      )}

      {/* In-App Delete Confirmation Modal (DELETE) */}
      {winnerToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 select-none animate-in fade-in duration-150">
          <div className="bg-surface border border-rose-500/30 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-5 space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1.5">
              <h4 className="font-display text-sm font-bold text-content">Remove from Wall of Champions?</h4>
              <p className="text-xs text-secondary leading-relaxed">
                Are you sure you want to remove <strong className="text-content">{winnerToDelete.studentName}</strong> ({winnerToDelete.position}) for <span className="text-indigo-300">"{winnerToDelete.eventTitle}"</span>?
              </p>
            </div>
            <div className="p-3 bg-surface-accent/60 rounded-xl border border-divider/60 flex items-center gap-2.5 text-left">
              <img
                src={winnerToDelete.studentPhoto || `https://api.dicebear.com/9.x/notionists/svg?seed=${winnerToDelete.rollNumber || winnerToDelete.studentId}`}
                alt=""
                className="w-8 h-8 rounded-lg object-cover bg-surface"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-content truncate">{winnerToDelete.studentName}</div>
                <div className="text-[10px] text-secondary font-mono">{winnerToDelete.rollNumber} • {winnerToDelete.position}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isDeletingWinner}
                onClick={() => setWinnerToDelete(null)}
                className="flex-1 py-2 rounded-xl bg-surface-accent hover:bg-divider text-secondary hover:text-content border border-divider text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <HoldButton
                size="sm"
                holdTime={1800}
                backgroundColor="#18181b"
                fillColor="#e11d48"
                textColor="#ffffff"
                fillTextColor="#ffffff"
                radius={12}
                doneLabel="Removed"
                disabled={isDeletingWinner}
                onHold={confirmDeleteWinner}
                className="flex-1"
              >
                Hold to Remove
              </HoldButton>
            </div>
          </div>
        </div>
      )}

      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-surface/95 border border-indigo-500/40 shadow-2xl backdrop-blur-md px-4 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-semibold text-content animate-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
