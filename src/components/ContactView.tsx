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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-background text-content">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            {activeInfo.badge || 'OFFICIAL CHANNELS'}
          </div>
          <h3 className="text-xl font-bold tracking-tight text-content font-display">{activeInfo.title}</h3>
          <p className="text-xs text-secondary mt-0.5 leading-relaxed">{activeInfo.subtitle}</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 transition-all text-xs font-semibold shrink-0 cursor-pointer shadow-xs active:scale-95"
            title="Edit dynamic support box fields"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Support Box</span>
          </button>
        )}
      </div>

      {/* Primary Contact Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-surface p-4 rounded-2xl border border-divider flex items-center gap-3.5 hover:border-divider transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 flex-shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-content uppercase tracking-wider">Department Email</h4>
            <a href={`mailto:${activeInfo.email}`} className="text-xs text-indigo-400 font-mono font-medium block hover:underline truncate mt-0.5">
              {activeInfo.email}
            </a>
          </div>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-divider flex items-center gap-3.5 hover:border-divider transition-colors shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400 flex-shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-content uppercase tracking-wider">Hotline Contact</h4>
            <a href={`tel:${activeInfo.phone.replace(/\s+/g, '')}`} className="text-xs text-indigo-400 font-mono font-medium block hover:underline truncate mt-0.5">
              {activeInfo.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Department Location & Timings Details */}
      {(activeInfo.location || activeInfo.timing) && (
        <div className="bg-surface p-3.5 rounded-2xl border border-divider flex items-center gap-3 text-xs text-secondary shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-[11px] leading-relaxed">
            {activeInfo.location && (
              <span className="font-semibold text-content">{activeInfo.location}</span>
            )}
            {activeInfo.timing && (
              <span className="text-secondary ml-1.5 flex sm:inline-flex items-center gap-1 mt-0.5 sm:mt-0 font-mono text-[10px]">
                <Clock className="w-3 h-3 text-violet-400 inline" />
                {activeInfo.timing}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Query Submission Box */}
      <div className="bg-surface p-4 sm:p-5 rounded-3xl border border-divider space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-divider/80 pb-3">
          <h4 className="text-sm font-bold text-content flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            Submit Query / Ticket
          </h4>
          <span className="text-[10px] text-secondary font-mono truncate max-w-[200px]">
            {user.name} ({user.rollNumber || user.email})
          </span>
        </div>

        {success ? (
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl text-center text-indigo-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-indigo-400 animate-bounce" />
            <h5 className="text-sm font-bold text-content">Query Transmitted Successfully!</h5>
            <p className="text-xs text-secondary max-w-md mx-auto leading-relaxed">
              Your inquiry has been logged in the department support registry. An associate or coordinator will follow up via your registered email (<span className="text-indigo-400 font-mono">{user.email}</span>).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Query Category */}
            <div>
              <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1.5">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['General', 'Academics', 'Events', 'Grievance'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-1.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-background border-divider text-secondary hover:text-primary hover:border-divider'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1.5">Subject / Query Topic *</label>
              <input 
                type="text" 
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Permission request for external ML hackathon"
                className="w-full bg-background border border-divider focus:border-indigo-500/50 text-xs text-content rounded-xl py-2 px-3 outline-none transition-colors"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1.5">Detailed Message *</label>
              <textarea 
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your query, section details, and any relevant context..."
                className="w-full bg-background border border-divider focus:border-indigo-500/50 text-xs text-content rounded-xl py-2 px-3 outline-none resize-none transition-colors leading-relaxed"
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
            >
              <Send className="w-3.5 h-3.5" />
              Transmit Query
            </button>
          </form>
        )}
      </div>

      {/* Additional Help / FAQs note */}
      {activeInfo.urgentHelpText && (
        <div className="bg-surface border border-divider p-4 rounded-2xl flex gap-3.5 items-start shadow-sm">
          <HelpCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-content">{activeInfo.urgentHelpTitle || "Need Immediate Assistance?"}</h5>
            <p className="text-[11px] text-secondary mt-1 leading-relaxed">
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
