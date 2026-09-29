import React, { useState } from 'react';
import { Award, ShieldCheck, CheckCircle2, Star, Sparkles, Building2, Calendar, MapPin, Copy, Check, Users, QrCode } from 'lucide-react';
import { CertificateTemplate, DepartmentEvent } from '../types';

interface CertificateCardProps {
  template: CertificateTemplate;
  studentName: string;
  rollNumber: string;
  event: Partial<DepartmentEvent>;
  id?: string;
  className?: string;
  certificateId?: string;
  issueDate?: string;
  onViewPeers?: () => void;
  peersCount?: number;
}

export function formatCertificateBody(
  bodyTemplate: string,
  data: {
    studentName: string;
    rollNumber: string;
    eventTitle: string;
    eventDate: string;
    eventVenue: string;
  }
): string {
  let text = bodyTemplate || "has successfully registered and participated in {eventTitle} held on {eventDate} at {eventVenue}.";
  text = text.replace(/\{name\}/gi, data.studentName);
  text = text.replace(/\{rollNumber\}/gi, data.rollNumber);
  text = text.replace(/\{eventTitle\}/gi, data.eventTitle);
  text = text.replace(/\{eventDate\}/gi, data.eventDate);
  text = text.replace(/\{eventVenue\}/gi, data.eventVenue);
  return text;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  template,
  studentName,
  rollNumber,
  event,
  id = 'digital-certificate-card',
  className = '',
  certificateId,
  issueDate,
  onViewPeers,
  peersCount
}) => {
  const [copied, setCopied] = useState(false);
  const theme = template.theme || 'indigo';

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!certificateId) return;
    navigator.clipboard.writeText(certificateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Theme palettes for backgrounds, borders, badges and typography
  const themeConfig = {
    indigo: {
      border: 'border-indigo-500/40',
      gradient: 'from-surface via-surface-accent to-indigo-950/20',
      badgeBg: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
      accentText: 'text-indigo-400',
      highlightBadge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      sealColor: 'text-indigo-400',
      divider: 'border-indigo-500/20',
      glow: 'shadow-indigo-500/10'
    },
    gold: {
      border: 'border-amber-500/40',
      gradient: 'from-surface via-surface-accent to-amber-950/20',
      badgeBg: 'bg-amber-600/20 text-amber-300 border-amber-500/40',
      accentText: 'text-amber-400',
      highlightBadge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      sealColor: 'text-amber-400',
      divider: 'border-amber-500/25',
      glow: 'shadow-amber-500/10'
    },
    emerald: {
      border: 'border-emerald-500/40',
      gradient: 'from-surface via-surface-accent to-emerald-950/20',
      badgeBg: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
      accentText: 'text-emerald-400',
      highlightBadge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      sealColor: 'text-emerald-400',
      divider: 'border-emerald-500/20',
      glow: 'shadow-emerald-500/10'
    },
    crimson: {
      border: 'border-rose-500/40',
      gradient: 'from-surface via-surface-accent to-rose-950/20',
      badgeBg: 'bg-rose-600/20 text-rose-400 border-rose-500/30',
      accentText: 'text-rose-400',
      highlightBadge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      sealColor: 'text-rose-400',
      divider: 'border-rose-500/20',
      glow: 'shadow-rose-500/10'
    },
    slate: {
      border: 'border-neutral-500/40',
      gradient: 'from-surface via-surface-accent to-neutral-900/40',
      badgeBg: 'bg-neutral-700/40 text-neutral-200 border-neutral-600/40',
      accentText: 'text-neutral-200',
      highlightBadge: 'bg-neutral-800 text-neutral-300 border-neutral-700',
      sealColor: 'text-neutral-300',
      divider: 'border-neutral-700/50',
      glow: 'shadow-neutral-500/10'
    }
  }[theme];

  const bodyContent = formatCertificateBody(template.bodyText, {
    studentName: studentName || 'STUDENT NAME',
    rollNumber: rollNumber || 'ROLL NUMBER',
    eventTitle: event.title || 'Department Event',
    eventDate: event.date || 'Event Date',
    eventVenue: event.venue || 'Campus Auditorium'
  });

  return (
    <div
      id={id}
      className={`relative rounded-3xl p-6 sm:p-8 bg-gradient-to-tr ${themeConfig.gradient} border ${themeConfig.border} shadow-2xl flex flex-col justify-between text-center overflow-hidden min-h-[390px] select-none ${className}`}
    >
      {/* Decorative Guilloche Border insets */}
      {template.accentBorder && (
        <div className={`absolute inset-2 rounded-2xl border ${themeConfig.divider} pointer-events-none border-dashed opacity-60`} />
      )}

      {/* Top Header Badge & Organization Branding */}
      <div className="relative z-10 flex flex-col items-center">
        <div className={`w-12 h-12 rounded-2xl ${themeConfig.badgeBg} flex items-center justify-center border shadow-md mb-2.5 transition-transform hover:scale-105`}>
          {template.badgeStyle === 'shield' ? (
            <ShieldCheck className="w-6 h-6" />
          ) : template.badgeStyle === 'star' ? (
            <Star className="w-6 h-6" />
          ) : template.badgeStyle === 'ribbon' ? (
            <Sparkles className="w-6 h-6" />
          ) : (
            <Award className="w-6 h-6" />
          )}
        </div>

        <span className={`font-display text-[10px] sm:text-[11px] font-extrabold ${themeConfig.accentText} tracking-[0.25em] uppercase drop-shadow-sm`}>
          {template.orgName || "NOTX ASSOCIATION"}
        </span>
        <span className="text-[9px] sm:text-[9.5px] text-secondary font-medium tracking-wide mt-0.5 max-w-sm mx-auto">
          {template.departmentName || "CSE (Artificial Intelligence & Machine Learning)"}
        </span>
        {template.institutionName && (
          <span className="text-[8px] text-tertiary mt-0.5 font-mono">
            {template.institutionName}
          </span>
        )}

        {/* Certificate Title Banner */}
        <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold font-mono uppercase tracking-widest border border-white/10 bg-black/40 backdrop-blur-md shadow-inner text-content">
          <Award className={`w-3 h-3 ${themeConfig.accentText}`} />
          <span>{template.certificateTitle || "Certificate of Participation"}</span>
        </div>
      </div>

      {/* Main Recipient Details */}
      <div className="relative z-10 my-4 space-y-2">
        <span className="text-[9.5px] sm:text-xs font-serif italic text-secondary tracking-wide block">
          {template.certifyStatement || "This is to certify that"}
        </span>

        <h2 className="text-xl sm:text-2xl font-display font-black text-content tracking-tight uppercase drop-shadow-md">
          {studentName.toUpperCase() || "RECIPIENT NAME"}
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold ${themeConfig.highlightBadge} border`}>
            <span>Roll No:</span>
            <span className="font-extrabold tracking-wider">{rollNumber || "N/A"}</span>
          </span>

          {certificateId && (
            <button
              type="button"
              onClick={handleCopyId}
              title="Click to copy Certificate ID"
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[8.5px] sm:text-[9px] font-mono font-bold bg-black/50 hover:bg-black/70 border border-white/15 text-content cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              <ShieldCheck className={`w-3 h-3 ${themeConfig.accentText}`} />
              <span>ID: <strong className="text-white tracking-wider font-mono">{certificateId}</strong></span>
              {copied ? (
                <span className="text-[8px] text-emerald-400 font-bold ml-0.5">Copied!</span>
              ) : (
                <Copy className="w-2.5 h-2.5 text-secondary opacity-80" />
              )}
            </button>
          )}
        </div>

        <p className="text-[10px] sm:text-[11px] text-secondary max-w-md mx-auto leading-relaxed pt-1.5 px-2">
          {bodyContent}
        </p>
      </div>

      {/* Signatures & Footer Metadata */}
      <div className="relative z-10 pt-3 border-t border-white/10 mt-1">
        <div className="grid grid-cols-2 gap-4 items-end">
          {/* Signer 1 */}
          <div className="text-left space-y-0.5">
            <div className="w-20 border-b border-content/30 mb-1" />
            <div className="text-[9.5px] sm:text-[10px] font-bold text-primary leading-tight">
              {template.signatory1Name || "Head of Department"}
            </div>
            <div className="text-[8px] text-secondary">
              {template.signatory1Title || "HOD, CSE (AI & ML)"}
            </div>
            {template.signatory1Dept && (
              <div className="text-[7.5px] text-tertiary font-mono">
                {template.signatory1Dept}
              </div>
            )}
          </div>

          {/* Signer 2 */}
          <div className="text-right space-y-0.5">
            <div className="w-20 border-b border-content/30 mb-1 ml-auto" />
            <div className={`text-[9.5px] sm:text-[10px] font-bold ${themeConfig.accentText} leading-tight`}>
              {template.signatory2Name || "NOTX Connect"}
            </div>
            <div className="text-[8px] text-secondary">
              {template.signatory2Title || "Faculty Lead"}
            </div>
            {template.signatory2Dept && (
              <div className="text-[7.5px] text-tertiary font-mono">
                {template.signatory2Dept}
              </div>
            )}
          </div>
        </div>

        {/* Footer verification tag & interactive peer link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[8px] font-mono text-tertiary mt-3 pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            {template.showVerificationBadge && (
              <>
                <CheckCircle2 className={`w-3 h-3 ${themeConfig.accentText}`} />
                <span>{template.footerNote || "Verified Academic Credential • NOTX Connect"}</span>
              </>
            )}
            {issueDate && (
              <span className="text-[7.5px] text-secondary ml-1">
                • Issued: {issueDate}
              </span>
            )}
          </div>

          {onViewPeers && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewPeers();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-indigo-300 hover:text-white border border-white/10 transition-all cursor-pointer font-sans text-[9px] font-bold active:scale-95 shadow-sm"
            >
              <Users className="w-3 h-3 text-indigo-400" />
              <span>See Who Else Got This Certificate</span>
              {peersCount !== undefined && peersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[8px] font-bold">
                  {peersCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CertificateCard;
