import React, { useState } from 'react';
import { 
  X, Calendar, Clock, MapPin, Users, Check, Copy, 
  Sparkles, CheckCircle2, ShieldCheck, Download, Share2
} from 'lucide-react';
import { DepartmentEvent, EventRegistration, UserProfile, AppBranding, DEFAULT_BRANDING } from '../types';

interface EventTicketModalProps {
  event: DepartmentEvent;
  registration: EventRegistration;
  user: UserProfile;
  onClose: () => void;
  branding?: AppBranding;
}

export default function EventTicketModal({
  event,
  registration,
  user,
  onClose,
  branding = DEFAULT_BRANDING,
}: EventTicketModalProps) {
  const [copied, setCopied] = useState(false);

  // Generate standardized ticket number
  const roll = user?.rollNumber || registration?.rollNumber || 'STU';
  const eventCode = (event.title || 'EVT').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  const regCode = (registration.registrationId || '0000').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const ticketNumber = `NOTX-${roll}-${eventCode}-${regCode}`;

  // Smart QR payload compatible with Admin Quick Check-in Scanner
  // The scanner accepts raw roll number, JSON, or URL
  const qrPayload = roll ? roll.toUpperCase() : registration.registrationId;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=ffffff&margin=1&data=${encodeURIComponent(qrPayload)}`;

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    try {
      const title = encodeURIComponent(event.title);
      const details = encodeURIComponent(`${event.description || ''}\n\nVenue: ${event.venue}\nTicket ID: ${ticketNumber}`);
      const location = encodeURIComponent(event.venue || 'Campus');
      
      // Parse date and time into YYYYMMDDTHHMMSSZ format
      let startIso = '';
      let endIso = '';
      if (event.date) {
        const dClean = event.date.replace(/-/g, '');
        startIso = `${dClean}T043000Z`; // Default fallback
        endIso = `${dClean}T073000Z`;
      }
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
    } catch {
      return '#';
    }
  };

  const isCheckedIn = registration.status === 'Attended';
  const isAbsent = registration.status === 'Absent';

  return (
    <div 
      className="fixed inset-0 bg-black/85 z-[150] flex flex-col items-center justify-center p-4 overflow-y-auto backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button */}
      <button 
        onClick={onClose} 
        aria-label="Close Ticket"
        className="absolute top-4 right-4 w-10 h-10 bg-[var(--nb-surface)] text-[var(--nb-content)] rounded-md flex items-center justify-center cursor-pointer transition-transform active:scale-95 z-20 hover:bg-[var(--nb-surface-accent)]"
        style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
      >
        <X className="w-5 h-5 stroke-[2.5]" />
      </button>

      <div className="relative w-full max-w-[340px] my-auto">
        {/* Pass Ticket Container */}
        <div 
          className="w-full flex flex-col bg-[var(--nb-surface)] rounded-2xl overflow-hidden relative"
          style={{ border: '3px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard)' }}
        >
          {/* Lanyard Hole Graphical Notch */}
          <div className="pt-2 pb-1 flex justify-center bg-[var(--nb-surface-accent)] border-b border-[var(--nb-ink)]/15">
            <div 
              className="w-14 h-2.5 rounded-full bg-[var(--nb-ink)] mx-auto flex items-center justify-center"
              style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)' }}
            >
              <div className="w-8 h-0.5 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Header Strip */}
          <div className="bg-[var(--nb-yellow)] text-black px-4 py-2.5 flex justify-between items-center border-b-2 border-[var(--nb-ink)]">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 fill-black text-black" />
              <span className="font-mono font-black text-xs tracking-wider uppercase">
                {branding?.appName || 'NOTX'} OFFICIAL PASS
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-black text-[#FFE600] border border-black">
              ADMIT ONE
            </span>
          </div>

          {/* Status Banner */}
          <div className={`px-4 py-1.5 flex items-center justify-between border-b text-[10px] font-mono font-bold ${
            isCheckedIn 
              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-600/30'
              : isAbsent
              ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-600/30'
              : 'bg-[var(--nb-surface-accent)] text-[var(--nb-secondary)] border-[var(--nb-ink)]/20'
          }`}>
            <span className="flex items-center gap-1">
              {isCheckedIn ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>CHECKED IN & VERIFIED</span>
                </>
              ) : isAbsent ? (
                <span>ABSENT FROM EVENT</span>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>ACTIVE PASS • READY FOR SCAN</span>
                </>
              )}
            </span>
            <span className="font-bold opacity-80">#{regCode}</span>
          </div>
          
          {/* Event Content & Poster */}
          <div className="p-4 space-y-3">
            <div className="flex gap-3">
              <div 
                className="w-[72px] h-[96px] flex-shrink-0 bg-[var(--nb-surface-accent)] rounded-lg overflow-hidden relative"
                style={{ border: '2px solid var(--nb-ink)' }}
              >
                <img 
                  src={event.posterImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <span className="nb-tag text-[8.5px] font-mono uppercase inline-block mb-1">
                    {event.category}
                  </span>
                  <h2 className="nb-headline text-base text-[var(--nb-content)] leading-snug line-clamp-2">
                    {event.title}
                  </h2>
                </div>
                
                <div className="space-y-1 text-xs pt-1 border-t border-[var(--nb-ink)]/10">
                  <div className="flex items-center gap-1.5 text-[10.5px]">
                    <Calendar className="w-3 h-3 text-[var(--nb-accent)] shrink-0" />
                    <span className="font-mono font-bold text-[var(--nb-content)]">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px]">
                    <Clock className="w-3 h-3 text-[var(--nb-accent)] shrink-0" />
                    <span className="font-mono text-[var(--nb-content)] truncate">
                      {event.startTime}{event.endTime && event.endTime !== 'N/A' ? ` – ${event.endTime}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10.5px]">
                    <MapPin className="w-3 h-3 text-[var(--nb-accent)] shrink-0" />
                    <span className="font-medium text-[var(--nb-secondary)] truncate max-w-[130px]">
                      {event.venue}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendee Info Card */}
            <div 
              className="p-2.5 bg-[var(--nb-surface-accent)] rounded-lg text-xs flex justify-between items-center"
              style={{ border: '1.5px solid var(--nb-ink)' }}
            >
              <div className="min-w-0">
                <span className="nb-label text-[8.5px] text-[var(--nb-secondary)] block">ATTENDEE</span>
                <span className="font-bold text-[var(--nb-content)] text-xs truncate block">{user.name}</span>
                <span className="font-mono text-[9.5px] text-[var(--nb-secondary)]">{roll} • {user.year || '3rd Year'}</span>
              </div>
              {registration.isTeam && (
                <div className="text-right flex-shrink-0 pl-2 border-l border-[var(--nb-ink)]/20">
                  <span className="nb-label text-[8.5px] text-[var(--nb-secondary)] block">TEAM</span>
                  <span className="font-bold text-[10.5px] text-[var(--nb-content)] truncate max-w-[100px] block">
                    {registration.teamName || 'Solo'}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {(registration.teamMembers?.length || 0) + 1} Members
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Perforated Ticket Divider with Notches */}
          <div className="relative py-2 bg-[var(--nb-surface)] border-y-2 border-dashed border-[var(--nb-ink)] flex items-center justify-between px-6">
            {/* Left circular cutout notch */}
            <div 
              className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/85" 
              style={{ borderRight: '2px solid var(--nb-ink)' }}
            />
            {/* Right circular cutout notch */}
            <div 
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/85" 
              style={{ borderLeft: '2px solid var(--nb-ink)' }}
            />

            <span className="font-mono text-[9px] font-bold text-[var(--nb-secondary)] uppercase tracking-wider">
              OFFICIAL ENTRY CODE
            </span>
            <button
              onClick={handleCopyTicket}
              className="flex items-center gap-1 font-mono text-[9px] font-bold text-[var(--nb-accent)] hover:underline cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500">COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>{ticketNumber}</span>
                </>
              )}
            </button>
          </div>
          
          {/* QR Code Section */}
          <div className="p-4 flex items-center gap-4 bg-[var(--nb-surface)]">
            <div 
              className="w-24 h-24 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center relative overflow-hidden"
              style={{ border: '2px solid var(--nb-ink)', boxShadow: '2px 2px 0 var(--nb-ink)' }}
            >
              <img 
                src={qrUrl} 
                alt="Entry QR Pass" 
                className="w-full h-full object-contain select-none pointer-events-none" 
                referrerPolicy="no-referrer"
              />
              {isCheckedIn && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center backdrop-blur-[0.5px]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 drop-shadow" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0 space-y-1.5">
              <div>
                <span className="nb-label text-[8.5px] text-[var(--nb-secondary)] uppercase block">
                  FAST SCAN ENTRANCE
                </span>
                <span className="text-xs font-bold text-[var(--nb-content)] block truncate">
                  Show at Venue Gate
                </span>
              </div>
              <p className="text-[10px] text-[var(--nb-secondary)] leading-tight">
                Scan with coordinator camera for instant attendance check-in.
              </p>
              
              {/* Decorative mini barcode */}
              <div className="pt-1 opacity-70">
                <div className="flex items-center gap-[1.5px] h-4">
                  {[2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 1, 4, 2, 3, 5, 2, 1, 3].map((w, idx) => (
                    <div key={idx} className="h-full bg-[var(--nb-ink)]" style={{ width: `${w}px` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Action Strip */}
          <div 
            className="bg-[var(--nb-surface-accent)] px-4 py-2.5 flex justify-between items-center border-t-2"
            style={{ borderColor: 'var(--nb-ink)' }}
          >
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9.5px] font-mono font-bold text-[var(--nb-content)] hover:text-[var(--nb-accent)] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-[var(--nb-accent)]" />
              Add to Google Cal
            </a>

            <button
              onClick={() => window.print()}
              className="text-[9.5px] font-mono font-bold text-[var(--nb-secondary)] hover:text-[var(--nb-content)] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Print / Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
