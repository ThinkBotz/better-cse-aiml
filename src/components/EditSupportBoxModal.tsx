import React, { useState } from 'react';
import { X, Save, RotateCcw, ShieldCheck, Mail, Phone, MapPin, Clock, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { SupportInfo, DEFAULT_SUPPORT_INFO } from '../types';
import { updateSupportInfo } from '../firebase';

interface EditSupportBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInfo?: SupportInfo;
  onSaved?: (updated: SupportInfo) => void;
}

export default function EditSupportBoxModal({
  isOpen,
  onClose,
  currentInfo,
  onSaved
}: EditSupportBoxModalProps) {
  const initialData: SupportInfo = currentInfo ? { ...DEFAULT_SUPPORT_INFO, ...currentInfo } : { ...DEFAULT_SUPPORT_INFO };

  const [formData, setFormData] = useState<SupportInfo>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state if currentInfo changes when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData(currentInfo ? { ...DEFAULT_SUPPORT_INFO, ...currentInfo } : { ...DEFAULT_SUPPORT_INFO });
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, currentInfo]);

  if (!isOpen) return null;

  const handleChange = (field: keyof SupportInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetDefaults = () => {
    if (window.confirm("Reset all support box fields to department defaults?")) {
      setFormData({ ...DEFAULT_SUPPORT_INFO });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateSupportInfo(formData);
      setSaveSuccess(true);
      if (onSaved) {
        onSaved(formData);
      }
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Failed to save support info:", err);
      setErrorMessage(err.message || "Failed to update support info. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-divider w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-divider flex justify-between items-center bg-surface-accent">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-content text-sm flex items-center gap-1.5 font-display">
                Edit Support Box (Admin)
              </h3>
              <p className="text-[10px] text-secondary">
                Updates help desk contacts across Profile and Support views dynamically
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-tertiary hover:text-content p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4 text-xs">
          
          {saveSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Support Box updated successfully! Changes are live across all devices.</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2 text-rose-400 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="space-y-3 bg-surface-accent/40 p-3.5 rounded-2xl border border-divider/60">
            <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider font-mono">Desk Identity</h4>
            <div>
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">
                Support Desk Title *
              </label>
              <input 
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. Help & Support Desk"
                className="w-full bg-background border border-divider focus:border-indigo-500 text-xs text-content rounded-xl py-2 px-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">
                Badge Tag
              </label>
              <input 
                type="text"
                value={formData.badge || 'OFFICIAL CHANNELS'}
                onChange={(e) => handleChange('badge', e.target.value)}
                placeholder="e.g. OFFICIAL CHANNELS"
                className="w-full bg-background border border-divider focus:border-indigo-500 text-xs text-content rounded-xl py-2 px-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">
                Subtitle / Description
              </label>
              <input 
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleChange('subtitle', e.target.value)}
                placeholder="e.g. Reach out to departmental coordinators, faculty advisors, and lab heads"
                className="w-full bg-background border border-divider focus:border-indigo-500 text-xs text-content rounded-xl py-2 px-3 outline-none"
              />
            </div>
          </div>

          {/* Contact Channels */}
          <div className="space-y-3 bg-surface-accent/40 p-3.5 rounded-2xl border border-divider/60">
            <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider font-mono">Contact Details</h4>
            
            <div>
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Department Official Email *
              </label>
              <input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="e.g. hod.cse.aml@aits.edu"
                className="w-full bg-background border border-divider focus:border-indigo-500 text-xs text-content rounded-xl py-2 px-3 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                Hotline / Phone Number *
              </label>
              <input 
                type="text"
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-background border border-divider focus:border-indigo-500 text-xs text-content rounded-xl py-2 px-3 outline-none font-mono"
              />
            </div>
          </div>

          {/* Location & Timings */}
          <div className="space-y-3 bg-surface-accent/40 p-3.5 rounded-2xl border border-divider/60">
            <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider font-mono">Physical Office / Lab</h4>
            
            <div>
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-violet-400" />
                Location & Lab Room
              </label>
              <input 
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g. NOTX AI & ML Innovation Lab: Room 314, Block 3, 2nd Floor"
                className="w-full bg-background border border-divider focus:border-indigo-500 text-xs text-content rounded-xl py-2 px-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                Operational Hours / Days
              </label>
              <input 
                type="text"
                value={formData.timing}
                onChange={(e) => handleChange('timing', e.target.value)}
                placeholder="e.g. Mon-Fri 9:00 AM - 4:30 PM"
                className="w-full bg-background border border-divider focus:border-indigo-500 text-xs text-content rounded-xl py-2 px-3 outline-none"
              />
            </div>
          </div>

          {/* Immediate Assistance / Notice */}
          <div className="space-y-3 bg-surface-accent/40 p-3.5 rounded-2xl border border-divider/60">
            <h4 className="text-[11px] font-bold text-primary uppercase tracking-wider font-mono">Immediate Guidance Note</h4>
            
            <div>
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                Heading
              </label>
              <input 
                type="text"
                value={formData.urgentHelpTitle}
                onChange={(e) => handleChange('urgentHelpTitle', e.target.value)}
                placeholder="e.g. Need Immediate Assistance?"
                className="w-full bg-background border border-divider focus:border-indigo-500 text-xs text-content rounded-xl py-2 px-3 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-secondary uppercase tracking-wider mb-1">
                Notice / Help Text
              </label>
              <textarea 
                rows={3}
                value={formData.urgentHelpText}
                onChange={(e) => handleChange('urgentHelpText', e.target.value)}
                placeholder="e.g. For urgent exam hall clearances, project evaluations, or permissions..."
                className="w-full bg-background border border-divider focus:border-indigo-500 text-xs text-content rounded-xl py-2 px-3 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-divider bg-surface hover:bg-surface-accent text-secondary hover:text-content text-xs font-semibold transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-2.5 shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Dynamic Changes
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
