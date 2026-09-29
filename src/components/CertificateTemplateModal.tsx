import React, { useState } from 'react';
import { 
  X, 
  Award, 
  Save, 
  RotateCcw, 
  Eye, 
  Sliders, 
  Sparkles, 
  Check, 
  CheckCircle2, 
  Palette, 
  Type, 
  Building2, 
  FileText, 
  UserCheck 
} from 'lucide-react';
import { CertificateTemplate, DEFAULT_CERTIFICATE_TEMPLATE } from '../types';
import CertificateCard from './CertificateCard';

interface CertificateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate?: CertificateTemplate;
  onSave: (template: CertificateTemplate) => Promise<void>;
  isCertificatesEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => Promise<void>;
}

export const CertificateTemplateModal: React.FC<CertificateTemplateModalProps> = ({
  isOpen,
  onClose,
  currentTemplate,
  onSave,
  isCertificatesEnabled,
  onToggleEnabled
}) => {
  const [template, setTemplate] = useState<CertificateTemplate>(() => ({
    ...DEFAULT_CERTIFICATE_TEMPLATE,
    ...(currentTemplate || {})
  }));

  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const handleInsertToken = (token: string) => {
    setTemplate(prev => ({
      ...prev,
      bodyText: `${prev.bodyText} ${token}`
    }));
  };

  const handleReset = () => {
    if (window.confirm("Reset certificate template to standard departmental defaults?")) {
      setTemplate(DEFAULT_CERTIFICATE_TEMPLATE);
      setFeedback({ type: 'success', message: 'Reset to default template settings.' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);
    try {
      await onSave(template);
      setFeedback({ type: 'success', message: 'Certificate template updated successfully!' });
      setTimeout(() => {
        setFeedback(null);
      }, 2500);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to save certificate template.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleEnabled(!isCertificatesEnabled);
      setFeedback({ 
        type: 'success', 
        message: !isCertificatesEnabled 
          ? 'Certificate feature is now ENABLED for all students.' 
          : 'Certificate feature is now PAUSED.' 
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to update certificate feature status.' });
    } finally {
      setIsToggling(false);
    }
  };

  const sampleEvent = {
    title: "AI & Neural Networks Masterclass",
    date: "28 Oct 2026",
    venue: "Main Auditorium, Campus Block-3"
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 select-none animate-fadeIn">
      <div className="bg-background rounded-3xl border border-divider/90 w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-divider/80 flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/30 text-indigo-400 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-content font-display">Certificate Template & Feature Hub</h3>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isCertificatesEnabled 
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                }`}>
                  {isCertificatesEnabled ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <p className="text-[10px] text-secondary">
                Configure the digital certificates issued to attendees across all department events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick feature switch in modal header */}
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold tracking-tight cursor-pointer transition-all active:scale-95 ${
                isCertificatesEnabled 
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
              }`}
              title="Turn certificate issuing on or off"
            >
              <div className={`w-2 h-2 rounded-full ${isCertificatesEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
              <span>{isCertificatesEnabled ? 'Feature On' : 'Feature Off'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-accent flex items-center justify-center text-secondary hover:text-content border border-divider/80 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback alert banner */}
        {feedback && (
          <div className={`px-5 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <span className="flex items-center gap-1.5">
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {feedback.message}
            </span>
            <button onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">✕</button>
          </div>
        )}

        {/* Feature status callout banner */}
        {!isCertificatesEnabled && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2 text-[10px] text-amber-300 flex items-center justify-between">
            <span>Notice: The certificate feature is currently <strong>TURNED OFF</strong>. Students cannot view or print certificates until you toggle it ON.</span>
            <button 
              onClick={handleToggle} 
              disabled={isToggling}
              className="underline font-bold hover:text-amber-200 cursor-pointer"
            >
              Turn On Now
            </button>
          </div>
        )}

        {/* Mobile View Switcher (Editor vs Live Preview) */}
        <div className="flex md:hidden border-b border-divider/80 bg-surface px-4 py-1.5 gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-secondary hover:text-content'
            }`}
          >
            Edit Settings
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-secondary hover:text-content'
            }`}
          >
            Live Preview
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 overflow-y-auto min-h-0 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-divider/80">
          
          {/* LEFT: Controls & Form (7 cols on desktop) */}
          <div className={`md:col-span-6 lg:col-span-7 p-4 sm:p-6 overflow-y-auto space-y-6 ${
            activeTab === 'preview' ? 'hidden md:block' : 'block'
          }`}>
            <form id="certificate-form" onSubmit={handleSave} className="space-y-6">

              {/* Theme & Visual Styling Palette */}
              <div className="bg-surface border border-divider/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-content font-display">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  <span>Visual Theme & Seal Style</span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-600', ring: 'ring-indigo-500' },
                    { id: 'gold', name: 'Imperial Gold', bg: 'bg-amber-500', ring: 'ring-amber-500' },
                    { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-500' },
                    { id: 'crimson', name: 'Crimson', bg: 'bg-rose-600', ring: 'ring-rose-500' },
                    { id: 'slate', name: 'Obsidian', bg: 'bg-neutral-600', ring: 'ring-neutral-400' }
                  ].map(thm => (
                    <button
                      key={thm.id}
                      type="button"
                      onClick={() => setTemplate(t => ({ ...t, theme: thm.id as any }))}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-[9.5px] font-bold transition-all cursor-pointer ${
                        template.theme === thm.id 
                          ? 'border-white/30 bg-surface-accent shadow-md scale-102 ring-1 ' + thm.ring 
                          : 'border-divider/60 hover:bg-surface-accent/50 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${thm.bg} shadow-inner flex items-center justify-center`}>
                        {template.theme === thm.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{thm.name}</span>
                    </button>
                  ))}
                </div>

                {/* Badge Seal Options & Accent Border Toggle */}
                <div className="pt-2 border-t border-divider/60 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-secondary font-semibold block mb-1">Badge Symbol</label>
                    <select
                      value={template.badgeStyle || 'seal'}
                      onChange={(e) => setTemplate(t => ({ ...t, badgeStyle: e.target.value as any }))}
                      className="w-full bg-background border border-divider/80 rounded-xl px-2.5 py-1.5 text-xs text-content focus:border-indigo-500 outline-none"
                    >
                      <option value="seal">Academic Seal (Award)</option>
                      <option value="shield">Verified Shield</option>
                      <option value="star">Excellence Star</option>
                      <option value="ribbon">Distinction Sparkles</option>
                    </select>
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={template.accentBorder}
                        onChange={(e) => setTemplate(t => ({ ...t, accentBorder: e.target.checked }))}
                        className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[11px] text-content font-medium">Decorative Inner Border</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Organization Branding */}
              <div className="bg-surface border border-divider/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-content font-display">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <span>Issuing Organization & Department</span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="text-[10px] text-secondary font-semibold block mb-1">Organization Header</label>
                    <input
                      type="text"
                      value={template.orgName}
                      onChange={(e) => setTemplate(t => ({ ...t, orgName: e.target.value }))}
                      placeholder="e.g. NOTX Association"
                      className="w-full bg-background border border-divider/80 rounded-xl px-3 py-2 text-xs text-content focus:border-indigo-500 outline-none font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-secondary font-semibold block mb-1">Department / Branch</label>
                    <input
                      type="text"
                      value={template.departmentName}
                      onChange={(e) => setTemplate(t => ({ ...t, departmentName: e.target.value }))}
                      placeholder="e.g. CSE (Artificial Intelligence & Machine Learning)"
                      className="w-full bg-background border border-divider/80 rounded-xl px-3 py-2 text-xs text-content focus:border-indigo-500 outline-none font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-secondary font-semibold block mb-1">Institution Name (Optional Subtitle)</label>
                    <input
                      type="text"
                      value={template.institutionName || ''}
                      onChange={(e) => setTemplate(t => ({ ...t, institutionName: e.target.value }))}
                      placeholder="e.g. Department of Computer Science & Engineering"
                      className="w-full bg-background border border-divider/80 rounded-xl px-3 py-2 text-xs text-content focus:border-indigo-500 outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Certificate Titles & Wording */}
              <div className="bg-surface border border-divider/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-content font-display">
                  <Type className="w-4 h-4 text-indigo-400" />
                  <span>Certificate Title & Body Text</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-secondary font-semibold block mb-1">Certificate Title</label>
                    <input
                      type="text"
                      value={template.certificateTitle}
                      onChange={(e) => setTemplate(t => ({ ...t, certificateTitle: e.target.value }))}
                      placeholder="e.g. Certificate of Participation"
                      className="w-full bg-background border border-divider/80 rounded-xl px-3 py-2 text-xs text-content focus:border-indigo-500 outline-none font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-secondary font-semibold block mb-1">Presentation Statement</label>
                    <input
                      type="text"
                      value={template.certifyStatement}
                      onChange={(e) => setTemplate(t => ({ ...t, certifyStatement: e.target.value }))}
                      placeholder="e.g. This is to certify that"
                      className="w-full bg-background border border-divider/80 rounded-xl px-3 py-2 text-xs text-content focus:border-indigo-500 outline-none font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-secondary font-semibold">Body Description Template</label>
                    <span className="text-[9px] text-indigo-400 font-mono">Insert Token:</span>
                  </div>

                  {/* Token Quick-Insert Pills */}
                  <div className="flex flex-wrap gap-1 pb-1">
                    {[
                      { label: '{eventTitle}', desc: 'Event Name' },
                      { label: '{eventDate}', desc: 'Event Date' },
                      { label: '{eventVenue}', desc: 'Venue' },
                      { label: '{name}', desc: 'Student Name' },
                      { label: '{rollNumber}', desc: 'Roll Number' }
                    ].map(tok => (
                      <button
                        key={tok.label}
                        type="button"
                        onClick={() => handleInsertToken(tok.label)}
                        className="px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9.5px] font-mono transition-all cursor-pointer"
                        title={`Append ${tok.desc}`}
                      >
                        + {tok.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={template.bodyText}
                    onChange={(e) => setTemplate(t => ({ ...t, bodyText: e.target.value }))}
                    rows={3}
                    placeholder="has successfully registered and participated in {eventTitle} held on {eventDate} at {eventVenue}."
                    className="w-full bg-background border border-divider/80 rounded-xl p-3 text-xs text-content focus:border-indigo-500 outline-none leading-relaxed font-sans"
                    required
                  />
                </div>
              </div>

              {/* Signatories Configuration */}
              <div className="bg-surface border border-divider/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-content font-display">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Certificate Signatories</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Signer 1 (Left) */}
                  <div className="p-3 rounded-xl bg-surface-accent/40 border border-divider/60 space-y-2">
                    <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase">Primary Signatory (Left)</span>
                    <div>
                      <input
                        type="text"
                        value={template.signatory1Name}
                        onChange={(e) => setTemplate(t => ({ ...t, signatory1Name: e.target.value }))}
                        placeholder="Signer Name (e.g. Dr. H. Sharma)"
                        className="w-full bg-background border border-divider/80 rounded-lg px-2.5 py-1.5 text-xs text-content mb-1.5"
                        required
                      />
                      <input
                        type="text"
                        value={template.signatory1Title}
                        onChange={(e) => setTemplate(t => ({ ...t, signatory1Title: e.target.value }))}
                        placeholder="Designation (e.g. Head of Department)"
                        className="w-full bg-background border border-divider/80 rounded-lg px-2.5 py-1.5 text-xs text-content mb-1.5"
                        required
                      />
                      <input
                        type="text"
                        value={template.signatory1Dept}
                        onChange={(e) => setTemplate(t => ({ ...t, signatory1Dept: e.target.value }))}
                        placeholder="Dept / Unit (e.g. CSE AI & ML)"
                        className="w-full bg-background border border-divider/80 rounded-lg px-2.5 py-1.5 text-xs text-content"
                      />
                    </div>
                  </div>

                  {/* Signer 2 (Right) */}
                  <div className="p-3 rounded-xl bg-surface-accent/40 border border-divider/60 space-y-2">
                    <span className="text-[10px] font-bold font-mono text-indigo-400 uppercase">Secondary Signatory (Right)</span>
                    <div>
                      <input
                        type="text"
                        value={template.signatory2Name}
                        onChange={(e) => setTemplate(t => ({ ...t, signatory2Name: e.target.value }))}
                        placeholder="Signer Name (e.g. NOTX Connect)"
                        className="w-full bg-background border border-divider/80 rounded-lg px-2.5 py-1.5 text-xs text-content mb-1.5"
                        required
                      />
                      <input
                        type="text"
                        value={template.signatory2Title}
                        onChange={(e) => setTemplate(t => ({ ...t, signatory2Title: e.target.value }))}
                        placeholder="Designation (e.g. Faculty Lead)"
                        className="w-full bg-background border border-divider/80 rounded-lg px-2.5 py-1.5 text-xs text-content mb-1.5"
                        required
                      />
                      <input
                        type="text"
                        value={template.signatory2Dept}
                        onChange={(e) => setTemplate(t => ({ ...t, signatory2Dept: e.target.value }))}
                        placeholder="Unit (e.g. Verified Credential)"
                        className="w-full bg-background border border-divider/80 rounded-lg px-2.5 py-1.5 text-xs text-content"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification & Footer Note */}
              <div className="bg-surface border border-divider/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-content font-display">Footer Verification Watermark</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={template.showVerificationBadge}
                      onChange={(e) => setTemplate(t => ({ ...t, showVerificationBadge: e.target.checked }))}
                      className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                    <span className="text-[11px] text-content font-medium">Show Verification Note</span>
                  </label>
                </div>

                {template.showVerificationBadge && (
                  <input
                    type="text"
                    value={template.footerNote || ''}
                    onChange={(e) => setTemplate(t => ({ ...t, footerNote: e.target.value }))}
                    placeholder="e.g. Verified Academic Credential • NOTX Connect"
                    className="w-full bg-background border border-divider/80 rounded-xl px-3 py-2 text-xs text-content focus:border-indigo-500 outline-none"
                  />
                )}
              </div>

            </form>
          </div>

          {/* RIGHT: Live Interactive Preview (5 cols on desktop) */}
          <div className={`md:col-span-6 lg:col-span-5 p-4 sm:p-6 bg-surface-accent/20 flex flex-col justify-between overflow-y-auto space-y-4 ${
            activeTab === 'editor' ? 'hidden md:flex' : 'flex'
          }`}>
            <div>
              <div className="flex items-center justify-between border-b border-divider/60 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-content font-display">Live Certificate Preview</span>
                </div>
                <span className="text-[9px] font-mono text-tertiary">Real-time Rendering</span>
              </div>

              {/* Certificate Card Rendered with Live Template */}
              <div className="max-w-md mx-auto w-full transition-all">
                <CertificateCard
                  template={template}
                  studentName="AARAV S. VERMA"
                  rollNumber="22A91A0501"
                  event={sampleEvent}
                />
              </div>

              <div className="mt-4 p-3 rounded-xl bg-surface border border-divider/60 text-[10px] text-secondary space-y-1">
                <div className="font-bold text-content flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Print & PDF Ready
                </div>
                <p>
                  Changes saved here immediately apply to all student profile pages when they view or download their event certificates.
                </p>
              </div>
            </div>

            {/* Bottom Actions in preview section for mobile */}
            <div className="pt-3 border-t border-divider/60 md:hidden flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="flex-1 py-2 rounded-xl bg-surface-accent text-content text-xs font-bold"
              >
                Back to Edit
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 border-t border-divider/80 bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-1.5 text-xs text-secondary hover:text-content font-bold px-3 py-2 rounded-xl hover:bg-surface-accent transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-accent text-secondary hover:text-content text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              form="certificate-form"
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving Template...' : 'Save Template'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CertificateTemplateModal;
