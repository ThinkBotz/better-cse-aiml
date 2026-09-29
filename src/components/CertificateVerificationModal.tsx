import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  Calendar, 
  MapPin, 
  User, 
  Hash, 
  Building2,
  Copy,
  Check
} from 'lucide-react';
import { IssuedCertificate, CertificateTemplate, DEFAULT_CERTIFICATE_TEMPLATE } from '../types';
import { verifyCertificateById } from '../firebase';
import CertificateCard from './CertificateCard';

interface CertificateVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialId?: string;
  template?: CertificateTemplate;
}

export const CertificateVerificationModal: React.FC<CertificateVerificationModalProps> = ({
  isOpen,
  onClose,
  initialId = '',
  template = DEFAULT_CERTIFICATE_TEMPLATE
}) => {
  const [certIdInput, setCertIdInput] = useState(initialId);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCert, setVerifiedCert] = useState<IssuedCertificate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = certIdInput.trim();
    if (!cleanId) return;

    setIsVerifying(true);
    setErrorMsg(null);
    setHasSearched(true);
    setVerifiedCert(null);

    try {
      const result = await verifyCertificateById(cleanId);
      if (result) {
        setVerifiedCert(result);
      } else {
        setErrorMsg(`No active certificate found matching "${cleanId}". Please check the ID and try again.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Verification request failed. Please check network connection.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopy = () => {
    if (!verifiedCert) return;
    navigator.clipboard.writeText(verifiedCert.certificateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
      <div className="bg-background rounded-3xl border border-divider/90 w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-divider/80 flex items-center justify-between bg-surface shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30 text-emerald-400 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-content font-display">Certificate Verifier</h3>
              <p className="text-[10px] text-secondary">
                Verify the authenticity and validity of any departmental certificate ID
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-accent hover:bg-divider flex items-center justify-center text-secondary hover:text-content border border-divider transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="p-4 sm:p-5 border-b border-divider/60 bg-surface/40 shrink-0">
          <form onSubmit={handleVerify} className="flex gap-2">
            <div className="relative flex-grow">
              <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary font-mono" />
              <input
                type="text"
                placeholder="e.g. CERT-AIML-0501-A4B2..."
                value={certIdInput}
                onChange={(e) => setCertIdInput(e.target.value)}
                className="w-full bg-surface-accent border border-divider rounded-xl pl-9 pr-4 py-2.5 text-xs text-content font-mono placeholder:font-sans placeholder:text-secondary focus:outline-none focus:border-indigo-500/50 uppercase transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isVerifying || !certIdInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 shrink-0 flex items-center gap-1.5"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify ID</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Verification Result Area */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-grow">
          {isVerifying && (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-secondary font-medium">Validating cryptographic record in database...</p>
            </div>
          )}

          {!isVerifying && errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <div className="space-y-1 text-xs">
                <div className="font-bold">Verification Failed</div>
                <p className="text-rose-300/80 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {!isVerifying && verifiedCert && (
            <div className="space-y-4 animate-fadeIn">
              {/* Authenticity Banner */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                      Official Verified Credential
                    </div>
                    <div className="text-[10px] text-secondary">
                      Tamper-evident record authenticated in institutional database
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-accent border border-divider text-content text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  title="Copy Certificate ID"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-secondary" />}
                  <span>{copied ? "Copied" : "Copy ID"}</span>
                </button>
              </div>

              {/* Credential Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface border border-divider/80 rounded-xl p-3 space-y-0.5">
                  <span className="text-[9px] font-mono text-secondary uppercase">Recipient Name</span>
                  <div className="font-bold text-content font-display">{verifiedCert.studentName}</div>
                </div>

                <div className="bg-surface border border-divider/80 rounded-xl p-3 space-y-0.5">
                  <span className="text-[9px] font-mono text-secondary uppercase">Roll Number</span>
                  <div className="font-bold text-indigo-400 font-mono">{verifiedCert.rollNumber}</div>
                </div>

                <div className="bg-surface border border-divider/80 rounded-xl p-3 space-y-0.5">
                  <span className="text-[9px] font-mono text-secondary uppercase">Event Title</span>
                  <div className="font-bold text-content truncate">{verifiedCert.eventTitle}</div>
                </div>

                <div className="bg-surface border border-divider/80 rounded-xl p-3 space-y-0.5">
                  <span className="text-[9px] font-mono text-secondary uppercase">Event / Issue Date</span>
                  <div className="font-bold text-content">{verifiedCert.eventDate || verifiedCert.issueDate}</div>
                </div>

                <div className="bg-surface border border-divider/80 rounded-xl p-3 space-y-0.5 col-span-2">
                  <span className="text-[9px] font-mono text-secondary uppercase">Certificate ID</span>
                  <div className="font-mono font-bold text-emerald-400 tracking-wider text-xs">
                    {verifiedCert.certificateId}
                  </div>
                </div>
              </div>

              {/* Certificate Preview Card */}
              <div className="border border-divider/80 rounded-2xl p-3 bg-surface/50 space-y-2">
                <span className="text-[10px] font-mono font-bold text-secondary uppercase block">
                  Original Certificate Render
                </span>
                <CertificateCard
                  template={template}
                  studentName={verifiedCert.studentName}
                  rollNumber={verifiedCert.rollNumber}
                  event={{
                    title: verifiedCert.eventTitle,
                    date: verifiedCert.eventDate,
                    venue: verifiedCert.eventVenue
                  }}
                  certificateId={verifiedCert.certificateId}
                  issueDate={verifiedCert.issueDate}
                />
              </div>
            </div>
          )}

          {!hasSearched && (
            <div className="text-center py-10 px-4 space-y-2 text-secondary">
              <Award className="w-10 h-10 mx-auto opacity-30 mb-1" />
              <p className="text-xs font-semibold text-content">Institutional Verification Registry</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Paste any Certificate ID above to verify its authenticity, issuing body, and recipient credentials.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-divider/80 bg-surface flex items-center justify-between text-[11px] text-secondary shrink-0">
          <span>CSE (AI & ML) Departmental Registry</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface-accent hover:bg-divider text-content font-bold text-xs border border-divider cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateVerificationModal;
