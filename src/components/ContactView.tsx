import React, { useState } from 'react';
import { Mail, Phone, MessageSquare, Send, CheckCircle2, HelpCircle, ShieldCheck, MapPin, Edit3, Clock } from 'lucide-react';
import { UserProfile, SupportInfo, DEFAULT_SUPPORT_INFO } from '../types';
import EditSupportBoxModal from './EditSupportBoxModal';

interface ContactViewProps {
  user: UserProfile;
  supportInfo?: SupportInfo;
  onSupportInfoUpdated?: (info: SupportInfo) => void;
}

export default function ContactView({ user, supportInfo, onSupportInfoUpdated }: ContactViewProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'General' | 'Academics' | 'Events' | 'Grievance'>('General');
  const [success, setSuccess] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localSupportInfo, setLocalSupportInfo] = useState<SupportInfo>(supportInfo || DEFAULT_SUPPORT_INFO);

  React.useEffect(() => {
    if (supportInfo) {
      setLocalSupportInfo(supportInfo);
    }
  }, [supportInfo]);

  const activeInfo = localSupportInfo || DEFAULT_SUPPORT_INFO;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    // Simulate sending support request
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSubject('');
      setMessage('');
    }, 4000);
  };

  const handleSupportSaved = (updated: SupportInfo) => {
    setLocalSupportInfo(updated);
    if (onSupportInfoUpdated) {
      onSupportInfoUpdated(updated);
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 pb-36 sm:pb-32 space-y-5 bg-[var(--nb-bg)] text-[var(--nb-content)]">
      
      {/* Header */}
      <div 
        className="p-4 rounded-lg bg-[var(--nb-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--nb-surface-accent)] text-[var(--nb-content)] border border-[var(--nb-ink)] mb-2">
            <ShieldCheck className="w-3 h-3 text-[var(--nb-accent)]" />
            <span>{activeInfo.badge || 'OFFICIAL CHANNELS'}</span>
          </div>
          <h3 className="nb-headline text-2xl leading-none">{activeInfo.title}</h3>
          <p className="nb-label text-xs text-[var(--nb-secondary)] mt-1">{activeInfo.subtitle}</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="nb-btn-ghost text-xs !min-h-[38px] py-1.5 px-3 self-start sm:self-auto cursor-pointer"
            title="Edit dynamic support box fields"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Support Box</span>
          </button>
        )}
      </div>

      {/* Primary Contact Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div 
          className="bg-[var(--nb-surface)] p-4 rounded-lg flex items-center gap-3.5"
          style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
        >
          <div 
            className="w-11 h-11 rounded-md bg-[var(--nb-surface-accent)] flex items-center justify-center text-[var(--nb-accent)] flex-shrink-0"
            style={{ border: '1.5px solid var(--nb-ink)' }}
          >
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="nb-headline text-xs tracking-normal">Department Email</h4>
            <a 
              href={`mailto:${activeInfo.email}`} 
              className="text-xs font-mono font-bold text-[var(--nb-accent)] block hover:underline truncate mt-0.5"
            >
              {activeInfo.email}
            </a>
          </div>
        </div>

        <div 
          className="bg-[var(--nb-surface)] p-4 rounded-lg flex items-center gap-3.5"
          style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
        >
          <div 
            className="w-11 h-11 rounded-md bg-[var(--nb-surface-accent)] flex items-center justify-center text-[var(--nb-accent)] flex-shrink-0"
            style={{ border: '1.5px solid var(--nb-ink)' }}
          >
            <Phone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="nb-headline text-xs tracking-normal">Hotline Contact</h4>
            <a 
              href={`tel:${activeInfo.phone.replace(/\s+/g, '')}`} 
              className="text-xs font-mono font-bold text-[var(--nb-accent)] block hover:underline truncate mt-0.5"
            >
              {activeInfo.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Department Location & Timings Details */}
      {(activeInfo.location || activeInfo.timing) && (
        <div 
          className="bg-[var(--nb-surface)] p-3.5 rounded-lg flex items-center gap-3"
          style={{ border: '1.5px solid var(--nb-ink)' }}
        >
          <div 
            className="w-9 h-9 rounded bg-[var(--nb-surface-accent)] flex items-center justify-center text-[var(--nb-content)] flex-shrink-0"
            style={{ border: '1.5px solid var(--nb-ink)' }}
          >
            <MapPin className="w-4 h-4 text-[var(--nb-accent)]" />
          </div>
          <div className="text-xs leading-relaxed font-sans min-w-0">
            {activeInfo.location && (
              <span className="font-bold text-[var(--nb-content)] block sm:inline">{activeInfo.location}</span>
            )}
            {activeInfo.timing && (
              <span className="text-[var(--nb-secondary)] sm:ml-2 flex sm:inline-flex items-center gap-1 font-mono text-[11px] mt-0.5 sm:mt-0">
                <Clock className="w-3 h-3 text-[var(--nb-accent)] inline" />
                {activeInfo.timing}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Query Submission Box */}
      <div 
        className="bg-[var(--nb-surface)] p-4 sm:p-5 rounded-lg space-y-4"
        style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard)' }}
      >
        <div className="flex items-center justify-between border-b-2 border-[var(--nb-ink)] pb-3">
          <h4 className="nb-headline text-base flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[var(--nb-accent)]" />
            Submit Query / Ticket
          </h4>
          <span className="nb-tag text-[10px] font-mono truncate max-w-[200px]">
            {user.name} ({user.rollNumber || user.email})
          </span>
        </div>

        {success ? (
          <div 
            className="p-6 rounded-lg text-center space-y-2 bg-[var(--nb-surface-accent)]"
            style={{ border: '2px solid var(--nb-ink)' }}
          >
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
            <h5 className="nb-headline text-base">Query Transmitted Successfully!</h5>
            <p className="text-xs text-[var(--nb-secondary)] max-w-md mx-auto leading-relaxed font-sans">
              Your inquiry has been logged in the department support registry. An associate or coordinator will follow up via your registered email (<strong className="text-[var(--nb-content)] font-mono">{user.email}</strong>).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Query Category */}
            <div>
              <label className="nb-label text-[10px] block mb-1.5">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['General', 'Academics', 'Events', 'Grievance'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-md text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-[var(--nb-accent)] text-white border-2 border-[var(--nb-ink)] shadow-[2px_2px_0_var(--nb-ink)]'
                        : 'bg-[var(--nb-surface-accent)] border-[1.5px] border-[var(--nb-ink)] text-[var(--nb-content)] hover:bg-[var(--nb-surface)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="nb-label text-[10px] block mb-1">Subject / Query Topic *</label>
              <input 
                type="text" 
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Permission request for external ML hackathon"
                className="nb-input text-xs"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="nb-label text-[10px] block mb-1">Detailed Message *</label>
              <textarea 
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your query, section details, and any relevant context..."
                className="nb-input text-xs resize-none leading-relaxed"
              />
            </div>

            <button 
              type="submit"
              className="nb-btn w-full cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmit Query</span>
            </button>
          </form>
        )}
      </div>

      {/* Additional Help / FAQs note */}
      {activeInfo.urgentHelpText && (
        <div 
          className="bg-[var(--nb-surface)] p-4 rounded-lg flex gap-3.5 items-start"
          style={{ border: '1.5px solid var(--nb-ink)' }}
        >
          <div 
            className="w-8 h-8 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0"
            style={{ border: '1.5px solid var(--nb-ink)' }}
          >
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h5 className="nb-headline text-sm">{activeInfo.urgentHelpTitle || "Need Immediate Assistance?"}</h5>
            <p className="text-xs text-[var(--nb-secondary)] mt-1 leading-relaxed font-sans">
              {activeInfo.urgentHelpText}
            </p>
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      {isAdmin && (
        <EditSupportBoxModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentInfo={activeInfo}
          onSaved={handleSupportSaved}
        />
      )}
    </div>
  );
}
