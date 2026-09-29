import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Search, 
  Award, 
  ShieldCheck, 
  Copy, 
  Check, 
  Calendar, 
  ExternalLink,
  Eye,
  GraduationCap
} from 'lucide-react';
import { IssuedCertificate, CertificateTemplate, DEFAULT_CERTIFICATE_TEMPLATE, DepartmentEvent } from '../types';
import CertificateCard from './CertificateCard';

interface CertificateRecipientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventDate?: string;
  eventVenue?: string;
  certificates: IssuedCertificate[];
  template?: CertificateTemplate;
}

export const CertificateRecipientsModal: React.FC<CertificateRecipientsModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  eventDate,
  eventVenue,
  certificates,
  template = DEFAULT_CERTIFICATE_TEMPLATE
}) => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewCert, setPreviewCert] = useState<IssuedCertificate | null>(null);

  if (!isOpen) return null;

  const filteredCerts = certificates.filter(c => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.studentName || '').toLowerCase().includes(q) ||
      (c.rollNumber || '').toLowerCase().includes(q) ||
      (c.certificateId || '').toLowerCase().includes(q) ||
      (c.department || '').toLowerCase().includes(q)
    );
  });

  const handleCopyId = (certId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(certId);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
      <div className="bg-background rounded-3xl border border-divider/90 w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-divider/80 flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 flex items-center justify-center border border-indigo-500/30 text-indigo-400 shrink-0 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-content font-display truncate">
                  Certificate Recipients
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  {certificates.length} {certificates.length === 1 ? 'Awardee' : 'Awardees'}
                </span>
              </div>
              <p className="text-[11px] text-secondary truncate mt-0.5">
                {eventTitle} {eventDate ? `• ${eventDate}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-accent hover:bg-divider flex items-center justify-center text-secondary hover:text-content border border-divider transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-divider/60 bg-surface/50 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or Certificate ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-accent/70 border border-divider rounded-xl pl-9 pr-4 py-2 text-xs text-content placeholder:text-secondary focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-secondary hover:text-content"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Recipients List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-grow">
          {filteredCerts.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Award className="w-10 h-10 text-secondary mx-auto opacity-50 mb-2" />
              <p className="text-sm font-bold text-content">No Recipients Found</p>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                {search 
                  ? `No certificates matched "${search}". Try searching by roll number or name.`
                  : "No other students have been issued this certificate yet."}
              </p>
            </div>
          ) : (
            filteredCerts.map((cert, index) => {
              const seed = cert.studentName || cert.rollNumber || 'student';
              return (
                <div 
                  key={cert.certificateId || index}
                  className="bg-surface hover:bg-surface-accent/70 border border-divider/80 hover:border-indigo-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all shadow-sm"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img 
                        src={`https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}`}
                        alt={cert.studentName}
                        className="w-10 h-10 rounded-xl bg-surface-accent border border-divider p-0.5 object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-background">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-content truncate font-display">
                          {cert.studentName}
                        </h4>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 shrink-0">
                          {cert.status || 'Verified'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-secondary mt-0.5 font-mono">
                        <span className="font-bold text-indigo-300">{cert.rollNumber}</span>
                        {cert.department && <span>• {cert.department}</span>}
                        {cert.year && <span>• {cert.year}</span>}
                      </div>

                      {/* Certificate ID Pill with Copy */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(cert.certificateId, e)}
                          title="Click to copy Certificate ID"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-mono font-bold bg-neutral-900 border border-neutral-700 hover:border-indigo-500/50 text-neutral-200 cursor-pointer transition-all active:scale-95"
                        >
                          <ShieldCheck className="w-2.5 h-2.5 text-indigo-400" />
                          <span>ID: {cert.certificateId}</span>
                          {copiedId === cert.certificateId ? (
                            <span className="text-emerald-400 text-[8px] font-bold">Copied!</span>
                          ) : (
                            <Copy className="w-2 h-2 text-secondary" />
                          )}
                        </button>

                        {cert.issueDate && (
                          <span className="text-[8.5px] text-tertiary">
                            Issued: {cert.issueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setPreviewCert(cert)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-accent hover:bg-divider text-content text-xs font-semibold border border-divider transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-divider/80 bg-surface flex items-center justify-between text-[11px] text-secondary shrink-0">
          <span>Showing {filteredCerts.length} of {certificates.length} total recipients</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface-accent hover:bg-divider text-content font-bold text-xs border border-divider cursor-pointer transition-all"
          >
            Done
          </button>
        </div>
      </div>

      {/* Sub-modal: Single Certificate Preview */}
      {previewCert && (
        <div className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-background rounded-3xl border border-divider max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-divider pb-2">
              <div>
                <h4 className="text-xs font-bold text-content font-display">Certificate Preview</h4>
                <p className="text-[10px] text-secondary">ID: {previewCert.certificateId}</p>
              </div>
              <button 
                onClick={() => setPreviewCert(null)}
                className="w-7 h-7 rounded-full bg-surface-accent flex items-center justify-center text-secondary hover:text-content border border-divider cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <CertificateCard
              template={template}
              studentName={previewCert.studentName}
              rollNumber={previewCert.rollNumber}
              event={{
                title: previewCert.eventTitle,
                date: previewCert.eventDate,
                venue: previewCert.eventVenue || eventVenue
              }}
              certificateId={previewCert.certificateId}
              issueDate={previewCert.issueDate}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewCert(null)}
                className="px-4 py-1.5 rounded-xl bg-surface-accent hover:bg-divider text-content font-bold text-xs border border-divider cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateRecipientsModal;
