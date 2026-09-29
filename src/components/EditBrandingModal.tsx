import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Upload, 
  Check, 
  Image as ImageIcon, 
  Sliders, 
  Eye, 
  RefreshCw,
  Palette,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { AppBranding, DEFAULT_BRANDING } from '../types';
import BrandLogo, { BRAND_ICONS, ACCENT_THEMES } from './BrandLogo';
import { updateAppBranding } from '../firebase';

interface EditBrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBranding?: AppBranding;
  onSaved?: (updated: AppBranding) => void;
}

export default function EditBrandingModal({
  isOpen,
  onClose,
  currentBranding = DEFAULT_BRANDING,
  onSaved
}: EditBrandingModalProps) {
  const [appName, setAppName] = useState(currentBranding.appName || 'NOTX');
  const [tagline, setTagline] = useState(currentBranding.tagline || 'Connect');
  const [subtitle, setSubtitle] = useState(currentBranding.subtitle || 'AI & ML');
  const [logoType, setLogoType] = useState<'preset' | 'custom'>(currentBranding.logoType || 'preset');
  const [logoIcon, setLogoIcon] = useState(currentBranding.logoIcon || 'Cpu');
  const [logoImageUrl, setLogoImageUrl] = useState(currentBranding.logoImageUrl || '');
  const [accentColor, setAccentColor] = useState(currentBranding.accentColor || 'indigo');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Live draft object for real-time preview
  const liveDraft: AppBranding = {
    appName: appName.trim() || 'NOTX',
    tagline: tagline.trim(),
    subtitle: subtitle.trim(),
    logoType,
    logoIcon,
    logoImageUrl,
    accentColor
  };

  const currentTheme = ACCENT_THEMES[accentColor] || ACCENT_THEMES.indigo;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 1.5MB for fast loading.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setLogoImageUrl(base64);
      setLogoType('custom');
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) {
      setErrorMsg('Brand name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const updated: AppBranding = {
        appName: appName.trim(),
        tagline: tagline.trim(),
        subtitle: subtitle.trim(),
        logoType,
        logoIcon,
        logoImageUrl: logoType === 'custom' ? logoImageUrl : '',
        accentColor,
        updatedAt: new Date().toISOString()
      };

      await updateAppBranding(updated);
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save brand settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetToDefault = () => {
    setAppName(DEFAULT_BRANDING.appName);
    setTagline(DEFAULT_BRANDING.tagline || '');
    setSubtitle(DEFAULT_BRANDING.subtitle || '');
    setLogoType(DEFAULT_BRANDING.logoType);
    setLogoIcon(DEFAULT_BRANDING.logoIcon || 'Cpu');
    setLogoImageUrl('');
    setAccentColor(DEFAULT_BRANDING.accentColor || 'indigo');
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
      <div className="bg-surface border border-divider/90 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-divider/70 flex items-center justify-between bg-surface-accent/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400`}>
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-content font-display">Portal Branding & Logo Customizer</h3>
              <p className="text-[10.5px] text-secondary">Dynamically change the brand name (NOTX) and logo across the application</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-xl bg-surface-accent hover:bg-divider text-secondary hover:text-content border border-divider flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4.5 overflow-y-auto space-y-4.5 text-xs flex-grow">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* LIVE HEADER PREVIEW */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                <Eye className="w-3 h-3 text-indigo-400" />
                <span>Live Navigation Bar Preview</span>
              </span>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline"
              >
                Reset to default
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-background border border-divider/80 shadow-inner flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <BrandLogo branding={liveDraft} size="md" />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <h4 className="text-xs sm:text-sm font-display font-bold text-content tracking-tight truncate">
                      {liveDraft.appName}
                    </h4>
                    {liveDraft.subtitle && (
                      <span className={`text-[8px] sm:text-[9px] font-mono font-bold ${currentTheme.badgeBg} ${currentTheme.badgeText} border ${currentTheme.badgeBorder} px-1.5 py-0.2 rounded-md flex-shrink-0`}>
                        {liveDraft.subtitle}
                      </span>
                    )}
                  </div>
                  <p className="text-[8.5px] text-secondary font-medium leading-none mt-0.5 flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse flex-shrink-0" />
                    <span>{liveDraft.tagline ? `${liveDraft.tagline} Portal` : 'Connected Portal'}</span>
                  </p>
                </div>
              </div>

              <span className="text-[9px] font-mono font-bold bg-surface-accent text-secondary px-2 py-1 rounded-lg border border-divider">
                ACTIVE
              </span>
            </div>
          </div>

          {/* 1. BRAND NAME & TAGLINE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                Brand Name * (e.g. NOTX)
              </label>
              <input
                type="text"
                required
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. NOTX or THINKBOTZ"
                className="w-full bg-background border border-divider text-xs text-content font-bold rounded-xl py-2 px-3 outline-none focus:border-indigo-500/60 uppercase"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                Department Badge (e.g. AI & ML)
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. AI & ML, CSE, IT"
                className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2 px-3 outline-none focus:border-indigo-500/60"
              />
            </div>
          </div>

          {/* 2. TAGLINE */}
          <div>
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
              Portal Suffix / Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Connect, Hub, Portal, Community"
              className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2 px-3 outline-none focus:border-indigo-500/60"
            />
          </div>

          {/* 3. LOGO TYPE: PRESET VS CUSTOM */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider">
              Logo Presentation Style
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLogoType('preset')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  logoType === 'preset'
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'bg-background border-divider text-secondary hover:text-content hover:bg-surface-accent'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Tech Icon Preset</span>
              </button>

              <button
                type="button"
                onClick={() => setLogoType('custom')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  logoType === 'custom'
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'bg-background border-divider text-secondary hover:text-content hover:bg-surface-accent'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Custom Image / Crest</span>
              </button>
            </div>
          </div>

          {/* 4. PRESET ICONS GRID */}
          {logoType === 'preset' ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                  Choose Logo Icon
                </span>
                <span className="font-mono text-[9.5px] text-tertiary">Selected: {logoIcon}</span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {Object.keys(BRAND_ICONS).map((iconKey) => {
                  const IconComp = BRAND_ICONS[iconKey];
                  const isSelected = logoIcon === iconKey;
                  return (
                    <button
                      key={iconKey}
                      type="button"
                      onClick={() => setLogoIcon(iconKey)}
                      title={iconKey}
                      className={`h-10 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? `${currentTheme.badgeBg} border-indigo-500 text-indigo-400 ring-2 ring-indigo-500/40 shadow-sm scale-105`
                          : 'bg-background border-divider text-secondary hover:text-content hover:bg-surface-accent'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              {/* Accent Color Picker */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                  <Palette className="w-3 h-3 text-indigo-400" />
                  <span>Logo Glow & Accent Palette</span>
                </span>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
                    { id: 'violet', label: 'Violet', color: 'bg-violet-500' },
                    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
                    { id: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
                    { id: 'amber', label: 'Amber', color: 'bg-amber-500' },
                    { id: 'rose', label: 'Rose', color: 'bg-rose-500' }
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAccentColor(c.id)}
                      className={`p-1.5 rounded-xl border flex items-center gap-1.5 text-[10px] font-bold font-mono transition-all cursor-pointer ${
                        accentColor === c.id
                          ? 'border-indigo-500 bg-surface-accent text-content ring-1 ring-indigo-500/40'
                          : 'border-divider bg-background text-secondary hover:text-content'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.color} shrink-0`} />
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* CUSTOM LOGO IMAGE UPLOADER */
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Upload Association Logo / Crest
              </span>

              <div className="p-3.5 bg-background rounded-2xl border border-divider space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-accent border border-divider overflow-hidden flex items-center justify-center shrink-0">
                    {logoImageUrl ? (
                      <img src={logoImageUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-secondary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-secondary">PNG, JPG, or SVG with transparent background recommended</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">
                    Or Paste Image URL directly:
                  </label>
                  <input
                    type="url"
                    value={logoImageUrl}
                    onChange={(e) => setLogoImageUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-surface border border-divider text-xs text-content rounded-xl py-2 px-3 outline-none focus:border-indigo-500/60 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}

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
              disabled={isSubmitting || !appName.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-600/30 active:scale-95 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Update Portal Brand & Logo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
