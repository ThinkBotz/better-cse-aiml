import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Search, Sparkles, User, Calendar, Edit3, Plus, CheckCircle2 } from 'lucide-react';
import { UserProfile, DepartmentEvent, EventWinner } from '../types';
import { addEventWinner, updateEventWinner } from '../firebase';

interface AddEventWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: DepartmentEvent[];
  allUsers: UserProfile[];
  currentUser: UserProfile;
  initialWinner?: EventWinner | null;
  onWinnerSaved?: (winnerId: string) => void;
  onWinnerAdded?: (winnerId: string) => void;
}

export default function AddEventWinnerModal({
  isOpen,
  onClose,
  events,
  allUsers,
  currentUser,
  initialWinner = null,
  onWinnerSaved,
  onWinnerAdded
}: AddEventWinnerModalProps) {
  const isEditing = Boolean(initialWinner);

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [customEventTitle, setCustomEventTitle] = useState('');
  const [useCustomEvent, setUseCustomEvent] = useState(false);

  // Student selection
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  // Award details
  const [position, setPosition] = useState<'1st Place' | '2nd Place' | '3rd Place' | 'Special Mention' | string>('1st Place');
  const [prizeTitle, setPrizeTitle] = useState('🏆 1st Prize • Champion');
  const [awardDetails, setAwardDetails] = useState('₹5,000 Cash Prize + Certificate of Excellence');
  const [projectTitle, setProjectTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize initial state when modal opens or initialWinner changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialWinner) {
      // Find matching event
      const matchedEv = events.find(ev => ev.eventId === initialWinner.eventId || ev.title === initialWinner.eventTitle);
      if (matchedEv) {
        setSelectedEventId(matchedEv.eventId);
        setUseCustomEvent(false);
        setCustomEventTitle('');
      } else {
        setSelectedEventId(events[0]?.eventId || '');
        setUseCustomEvent(true);
        setCustomEventTitle(initialWinner.eventTitle);
      }

      // Find matching student in allUsers
      const matchedStudent = allUsers.find(
        u => u.uid === initialWinner.studentId || 
             (u.rollNumber && initialWinner.rollNumber && u.rollNumber.toLowerCase() === initialWinner.rollNumber.toLowerCase())
      );

      if (matchedStudent) {
        setSelectedStudent(matchedStudent);
      } else {
        // Synthesize user object from winner record
        setSelectedStudent({
          uid: initialWinner.studentId,
          name: initialWinner.studentName,
          email: '',
          role: 'student',
          rollNumber: initialWinner.rollNumber,
          department: initialWinner.department || 'CSE (AI & ML)',
          year: initialWinner.year || 'III Year',
          section: initialWinner.section || 'A',
          profile_pic: initialWinner.studentPhoto,
          created_at: initialWinner.addedAt || ''
        });
      }

      setPosition(initialWinner.position || '1st Place');
      setPrizeTitle(initialWinner.prizeTitle || '🏆 1st Prize • Champion');
      setAwardDetails(initialWinner.awardDetails || '');
      setProjectTitle(initialWinner.projectTitle || '');
      setErrorMsg('');
    } else {
      // Reset for creation
      setSelectedEventId(events[0]?.eventId || '');
      setCustomEventTitle('');
      setUseCustomEvent(false);
      setSelectedStudent(null);
      setStudentSearch('');
      setPosition('1st Place');
      setPrizeTitle('🏆 1st Prize • Champion');
      setAwardDetails('₹5,000 Cash Prize + Trophy + Certificate');
      setProjectTitle('');
      setErrorMsg('');
    }
  }, [isOpen, initialWinner, events, allUsers]);

  if (!isOpen) return null;

  const filteredStudents = allUsers.filter(u => {
    if (u.uid === 'admin_master') return false;
    const q = studentSearch.toLowerCase().trim();
    if (!q) return true;
    return (u.name || '').toLowerCase().includes(q) ||
           (u.rollNumber || '').toLowerCase().includes(q) ||
           (u.department || '').toLowerCase().includes(q);
  }).slice(0, 8);

  const handlePositionChange = (pos: string) => {
    setPosition(pos);
    if (pos === '1st Place') {
      setPrizeTitle('🏆 1st Prize • Champion');
      setAwardDetails('₹5,000 Cash Prize + Trophy + Certificate');
    } else if (pos === '2nd Place') {
      setPrizeTitle('🥈 2nd Prize • Runner-Up');
      setAwardDetails('₹3,000 Cash Prize + Medal + Certificate');
    } else if (pos === '3rd Place') {
      setPrizeTitle('🥉 3rd Prize • 2nd Runner-Up');
      setAwardDetails('₹1,500 Cash Prize + Certificate');
    } else if (pos === 'Special Mention') {
      setPrizeTitle('🌟 Special Mention • Best Innovation');
      setAwardDetails('Citation of Excellence + Research Sponsorship');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setErrorMsg('Please select a student from the database.');
      return;
    }

    const matchedEvent = events.find(ev => ev.eventId === selectedEventId);
    const finalEventTitle = useCustomEvent 
      ? (customEventTitle.trim() || 'Department Competition') 
      : (matchedEvent?.title || (isEditing ? initialWinner?.eventTitle : 'Department Event') || 'Department Event');

    const finalEventDate = matchedEvent?.date || (isEditing ? initialWinner?.eventDate : new Date().toISOString().split('T')[0]) || new Date().toISOString().split('T')[0];

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const winnerPayload = {
        eventId: useCustomEvent ? 'custom_event' : (matchedEvent?.eventId || (isEditing ? initialWinner?.eventId : 'event') || 'event'),
        eventTitle: finalEventTitle,
        eventDate: finalEventDate,
        studentId: selectedStudent.uid,
        studentName: selectedStudent.name,
        rollNumber: selectedStudent.rollNumber || 'N/A',
        department: selectedStudent.department || 'CSE (AI & ML)',
        year: selectedStudent.year || 'III Year',
        section: selectedStudent.section || 'A',
        studentPhoto: selectedStudent.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${selectedStudent.rollNumber || selectedStudent.uid}`,
        position,
        prizeTitle: prizeTitle.trim(),
        awardDetails: awardDetails.trim(),
        projectTitle: projectTitle.trim() || undefined,
        addedBy: isEditing ? (initialWinner?.addedBy || currentUser.name || 'Department Administration') : (currentUser.name || 'Department Administration')
      };

      if (isEditing && initialWinner) {
        await updateEventWinner(initialWinner.winnerId, winnerPayload);
        if (onWinnerSaved) onWinnerSaved(initialWinner.winnerId);
        if (onWinnerAdded) onWinnerAdded(initialWinner.winnerId);
      } else {
        const winnerId = await addEventWinner(winnerPayload);
        if (onWinnerSaved) onWinnerSaved(winnerId);
        if (onWinnerAdded) onWinnerAdded(winnerId);
      }

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save event winner.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200">
      <div className="bg-surface border border-divider/90 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-divider/70 flex items-center justify-between bg-surface-accent/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              isEditing ? 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400' : 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
            }`}>
              {isEditing ? <Edit3 className="w-4 h-4" /> : <Trophy className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-content font-display">
                {isEditing ? 'Edit Wall of Champions Winner' : 'Add Event Winner to Home Page'}
              </h3>
              <p className="text-[10.5px] text-secondary">
                {isEditing ? 'Modify student podium standings, prize titles, or awards' : 'Feature student achievements and podium finishes on Wall of Fame'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-surface-accent hover:bg-divider text-secondary hover:text-content border border-divider flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-xs flex-grow">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1. SELECT EVENT FROM DB */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-400" />
                <span>Department Event *</span>
              </label>
              <button
                type="button"
                onClick={() => setUseCustomEvent(!useCustomEvent)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
              >
                {useCustomEvent ? 'Pick from DB events' : '+ Custom event name'}
              </button>
            </div>

            {useCustomEvent ? (
              <input
                type="text"
                required
                placeholder="e.g. State-Level AI Hackathon 2026"
                value={customEventTitle}
                onChange={(e) => setCustomEventTitle(e.target.value)}
                className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2 px-3 outline-none focus:border-indigo-500/50"
              />
            ) : (
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2 px-3 outline-none focus:border-indigo-500/50"
              >
                {events.length === 0 ? (
                  <option value="">No events in database (use custom event name)</option>
                ) : (
                  events.map((ev) => (
                    <option key={ev.eventId} value={ev.eventId}>
                      {ev.title} ({ev.date}) • {ev.category}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* 2. SELECT STUDENT FROM DB */}
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-400" />
              <span>Student Winner from Database *</span>
            </label>

            {selectedStudent ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-surface border border-emerald-500/30 overflow-hidden shrink-0">
                    <img
                      src={selectedStudent.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${selectedStudent.rollNumber || selectedStudent.uid}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-content text-xs truncate flex items-center gap-1">
                      <span>{selectedStudent.name}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    </div>
                    <div className="text-[10px] text-secondary font-mono truncate">
                      {selectedStudent.rollNumber || 'N/A'} • {selectedStudent.department || 'CSE (AI & ML)'} • {selectedStudent.year || 'III Year'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentSearch('');
                  }}
                  className="text-xs text-secondary hover:text-content p-1 cursor-pointer transition-colors"
                  title="Change student"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                  <input
                    type="text"
                    placeholder="Search by student name, roll number, or department..."
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setIsStudentDropdownOpen(true);
                    }}
                    onFocus={() => setIsStudentDropdownOpen(true)}
                    className="w-full bg-background border border-divider text-xs text-content rounded-xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500/50"
                  />
                </div>

                {isStudentDropdownOpen && (
                  <div className="mt-1 bg-surface border border-divider rounded-xl shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-divider/50">
                    {filteredStudents.length === 0 ? (
                      <div className="p-3 text-[11px] text-secondary text-center italic">
                        No students found matching "{studentSearch}"
                      </div>
                    ) : (
                      filteredStudents.map((st) => (
                        <div
                          key={st.uid}
                          onClick={() => {
                            setSelectedStudent(st);
                            setIsStudentDropdownOpen(false);
                          }}
                          className="p-2 hover:bg-surface-accent flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6.5 h-6.5 rounded-lg bg-surface-accent overflow-hidden shrink-0">
                              <img
                                src={st.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${st.rollNumber || st.uid}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-content text-xs truncate">{st.name}</div>
                              <div className="text-[9.5px] text-secondary font-mono truncate">{st.rollNumber || 'N/A'} • {st.department || 'AI & ML'}</div>
                            </div>
                          </div>

                          <span className="text-[10px] text-indigo-400 font-bold shrink-0">Select</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. PODIUM POSITION / TIER */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Position / Prize Rank *</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: '1st Place', icon: '🏆', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
                { label: '2nd Place', icon: '🥈', color: 'border-slate-400/40 text-slate-300 bg-slate-500/10' },
                { label: '3rd Place', icon: '🥉', color: 'border-orange-500/40 text-orange-300 bg-orange-500/10' },
                { label: 'Special Mention', icon: '🌟', color: 'border-violet-500/40 text-violet-300 bg-violet-500/10' },
              ].map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handlePositionChange(item.label)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 text-center ${
                    position === item.label
                      ? `${item.color} shadow-sm ring-1 ring-indigo-500/40`
                      : 'bg-background border-divider text-secondary hover:text-content hover:bg-surface-accent'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-[10.5px] leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. PRIZE TITLE & DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                Badge / Prize Title
              </label>
              <input
                type="text"
                required
                value={prizeTitle}
                onChange={(e) => setPrizeTitle(e.target.value)}
                placeholder="e.g. 🏆 1st Prize • Champion"
                className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2 px-3 outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                Award / Cash Prize Details
              </label>
              <input
                type="text"
                required
                value={awardDetails}
                onChange={(e) => setAwardDetails(e.target.value)}
                placeholder="e.g. ₹5,000 Cash Prize + Trophy"
                className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2 px-3 outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          {/* 5. PROJECT / TOPIC TITLE (OPTIONAL) */}
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
              Project Title or Winning Topic (Optional)
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="e.g. Project: MedPrompt AI Multi-Modal Diagnostic Agent"
              className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2 px-3 outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-divider/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-accent hover:bg-divider text-content text-xs font-semibold cursor-pointer border border-divider transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !selectedStudent}
              className={`px-5 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-40 ${
                isEditing 
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30' 
                  : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
              }`}
            >
              {isEditing ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{isSubmitting ? 'Updating...' : 'Save Winner Changes'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish to Home Page'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
