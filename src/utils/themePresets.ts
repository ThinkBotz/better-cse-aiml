export type ThemePresetKey = 
  | 'cobalt-tech' 
  | 'cyber-gold' 
  | 'emerald-forge' 
  | 'royal-violet' 
  | 'crimson-riot' 
  | 'aqua-nexus' 
  | 'mono-slate' 
  | 'custom';

export interface TenantThemeConfig {
  presetKey: ThemePresetKey;
  name: string;
  description: string;
  heroBg: string;         // Background for Welcome Card & Login Hero Strip
  heroFg: string;         // Foreground text color (#FFFFFF or #111111)
  accent: string;         // Primary CTA buttons & active highlights
  accentFg: string;       // Text color on accent buttons
  subtleBg: string;       // Pill / tag background
  borderInk?: string;     // Border color (default: #1A1A1A)
  previewBadgeClass: string;
}

export const THEME_PRESETS: Record<Exclude<ThemePresetKey, 'custom'>, TenantThemeConfig> = {
  'cobalt-tech': {
    presetKey: 'cobalt-tech',
    name: 'Electric Cobalt',
    description: 'Engineering, Systems & High-Tech CSE',
    heroBg: '#1D4ED8',
    heroFg: '#FFFFFF',
    accent: '#2563EB',
    accentFg: '#FFFFFF',
    subtleBg: '#DBEAFE',
    borderInk: '#1A1A1A',
    previewBadgeClass: 'nb-pill-blue'
  },
  'cyber-gold': {
    presetKey: 'cyber-gold',
    name: 'Cyber Gold',
    description: 'AI & ML, Data Science & Robotics',
    heroBg: '#FFE600',
    heroFg: '#111111',
    accent: '#FF5722',
    accentFg: '#FFFFFF',
    subtleBg: '#FFF9C4',
    borderInk: '#1A1A1A',
    previewBadgeClass: 'nb-pill-yellow'
  },
  'emerald-forge': {
    presetKey: 'emerald-forge',
    name: 'Emerald Forge',
    description: 'Biotechnology, Clean Tech & Innovation',
    heroBg: '#059669',
    heroFg: '#FFFFFF',
    accent: '#10B981',
    accentFg: '#111111',
    subtleBg: '#D1FAE5',
    borderInk: '#1A1A1A',
    previewBadgeClass: 'nb-pill-green'
  },
  'royal-violet': {
    presetKey: 'royal-violet',
    name: 'Royal Violet',
    description: 'Leadership, Creative Design & Elite Tech',
    heroBg: '#7C3AED',
    heroFg: '#FFFFFF',
    accent: '#8B5CF6',
    accentFg: '#FFFFFF',
    subtleBg: '#EDE9FE',
    borderInk: '#1A1A1A',
    previewBadgeClass: 'nb-pill-purple'
  },
  'crimson-riot': {
    presetKey: 'crimson-riot',
    name: 'Crimson Riot',
    description: 'Hackathons, High Energy & Mechanical',
    heroBg: '#DC2626',
    heroFg: '#FFFFFF',
    accent: '#EF4444',
    accentFg: '#FFFFFF',
    subtleBg: '#FEE2E2',
    borderInk: '#1A1A1A',
    previewBadgeClass: 'nb-pill-coral'
  },
  'aqua-nexus': {
    presetKey: 'aqua-nexus',
    name: 'Aqua Nexus',
    description: 'Web3, Cloud Computing & IoT Networks',
    heroBg: '#0891B2',
    heroFg: '#FFFFFF',
    accent: '#00B4D8',
    accentFg: '#111111',
    subtleBg: '#CFFAFE',
    borderInk: '#1A1A1A',
    previewBadgeClass: 'nb-pill-cyan'
  },
  'mono-slate': {
    presetKey: 'mono-slate',
    name: 'Monochrome Ink',
    description: 'Minimalist Editorial & Corporate Tech',
    heroBg: '#1A1A1A',
    heroFg: '#FFFFFF',
    accent: '#4F46E5',
    accentFg: '#FFFFFF',
    subtleBg: '#F1F5F9',
    borderInk: '#1A1A1A',
    previewBadgeClass: 'bg-neutral-900 text-white'
  }
};

export const DEFAULT_THEME_CONFIG: TenantThemeConfig = THEME_PRESETS['cyber-gold'];

/**
 * Resolves a TenantThemeConfig from an AppBranding object with backward compatibility
 */
export function resolveTenantTheme(branding?: {
  theme?: TenantThemeConfig;
  accentColor?: string;
}): TenantThemeConfig {
  if (branding?.theme && branding.theme.heroBg) {
    return branding.theme;
  }

  // Legacy fallback based on accentColor
  switch (branding?.accentColor) {
    case 'indigo':
    case 'blue':
      return THEME_PRESETS['cobalt-tech'];
    case 'emerald':
    case 'green':
      return THEME_PRESETS['emerald-forge'];
    case 'violet':
    case 'purple':
      return THEME_PRESETS['royal-violet'];
    case 'rose':
    case 'red':
      return THEME_PRESETS['crimson-riot'];
    case 'cyan':
      return THEME_PRESETS['aqua-nexus'];
    case 'amber':
    case 'yellow':
    default:
      return THEME_PRESETS['cyber-gold'];
  }
}

/**
 * Injects CSS custom properties into DOM root or target element
 */
export function applyTenantTheme(theme: TenantThemeConfig, target: HTMLElement = document.documentElement) {
  target.style.setProperty('--tenant-hero-bg', theme.heroBg);
  target.style.setProperty('--tenant-hero-fg', theme.heroFg);
  target.style.setProperty('--tenant-accent', theme.accent);
  target.style.setProperty('--tenant-accent-fg', theme.accentFg);
  target.style.setProperty('--tenant-subtle', theme.subtleBg);
  target.style.setProperty('--tenant-border', theme.borderInk || '#1A1A1A');

  // Also bind to legacy --nb-accent so all existing buttons and pills adapt immediately
  target.style.setProperty('--nb-accent', theme.accent);
  target.style.setProperty('--nb-accent-fg', theme.accentFg);
}
