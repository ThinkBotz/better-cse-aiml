import React from 'react';
import { 
  Cpu, 
  Bot, 
  Sparkles, 
  Terminal, 
  Code2, 
  Zap, 
  Rocket, 
  Atom, 
  Flame, 
  ShieldCheck, 
  Radio, 
  Layers, 
  GraduationCap, 
  Compass, 
  Globe, 
  Trophy 
} from 'lucide-react';
import { AppBranding, DEFAULT_BRANDING } from '../types';

export const BRAND_ICONS: Record<string, React.ElementType> = {
  Cpu,
  Bot,
  Sparkles,
  Terminal,
  Code2,
  Zap,
  Rocket,
  Atom,
  Flame,
  ShieldCheck,
  Radio,
  Layers,
  GraduationCap,
  Compass,
  Globe,
  Trophy
};

export const ACCENT_THEMES: Record<string, {
  border: string;
  glow: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  primaryBg: string;
}> = {
  indigo: {
    border: 'from-indigo-600 via-indigo-500 to-violet-500',
    glow: 'shadow-indigo-500/25',
    iconColor: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/15',
    badgeText: 'text-indigo-400',
    badgeBorder: 'border-indigo-500/30',
    primaryBg: 'bg-indigo-600 hover:bg-indigo-500'
  },
  violet: {
    border: 'from-violet-600 via-purple-500 to-fuchsia-500',
    glow: 'shadow-violet-500/25',
    iconColor: 'text-violet-400',
    badgeBg: 'bg-violet-500/15',
    badgeText: 'text-violet-400',
    badgeBorder: 'border-violet-500/30',
    primaryBg: 'bg-violet-600 hover:bg-violet-500'
  },
  emerald: {
    border: 'from-emerald-600 via-teal-500 to-cyan-500',
    glow: 'shadow-emerald-500/25',
    iconColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    primaryBg: 'bg-emerald-600 hover:bg-emerald-500'
  },
  cyan: {
    border: 'from-cyan-600 via-sky-500 to-blue-500',
    glow: 'shadow-cyan-500/25',
    iconColor: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
    primaryBg: 'bg-cyan-600 hover:bg-cyan-500'
  },
  amber: {
    border: 'from-amber-600 via-orange-500 to-yellow-500',
    glow: 'shadow-amber-500/25',
    iconColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    badgeBorder: 'border-amber-500/30',
    primaryBg: 'bg-amber-500 hover:bg-amber-400'
  },
  rose: {
    border: 'from-rose-600 via-pink-500 to-red-500',
    glow: 'shadow-rose-500/25',
    iconColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    badgeBorder: 'border-rose-500/30',
    primaryBg: 'bg-rose-600 hover:bg-rose-500'
  }
};

interface BrandLogoProps {
  branding?: AppBranding;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function BrandLogo({
  branding = DEFAULT_BRANDING,
  size = 'md',
  className = ''
}: BrandLogoProps) {
  const accentKey = branding.accentColor || 'indigo';
  const theme = ACCENT_THEMES[accentKey] || ACCENT_THEMES.indigo;

  const sizeClasses = {
    xs: {
      container: 'w-6 h-6 rounded-lg p-[1px]',
      inner: 'rounded-[7px]',
      icon: 'w-3.5 h-3.5',
      image: 'rounded-[7px]'
    },
    sm: {
      container: 'w-7.5 h-7.5 rounded-xl p-[1px]',
      inner: 'rounded-[10px]',
      icon: 'w-4 h-4',
      image: 'rounded-[10px]'
    },
    md: {
      container: 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl p-[1px]',
      inner: 'rounded-[11px]',
      icon: 'w-4 h-4 sm:w-4.5 sm:h-4.5',
      image: 'rounded-[11px]'
    },
    lg: {
      container: 'w-12 h-12 rounded-2xl p-[1.5px]',
      inner: 'rounded-[14px]',
      icon: 'w-6 h-6',
      image: 'rounded-[14px]'
    },
    xl: {
      container: 'w-16 h-16 rounded-3xl p-[2px]',
      inner: 'rounded-[22px]',
      icon: 'w-8 h-8',
      image: 'rounded-[22px]'
    }
  }[size];

  // Custom uploaded logo
  if (branding.logoType === 'custom' && branding.logoImageUrl) {
    return (
      <div className={`${sizeClasses.container} bg-gradient-to-tr ${theme.border} shadow-md ${theme.glow} flex-shrink-0 ${className}`}>
        <div className={`w-full h-full bg-background ${sizeClasses.inner} overflow-hidden flex items-center justify-center`}>
          <img 
            src={branding.logoImageUrl} 
            alt={branding.appName || 'Logo'} 
            className={`w-full h-full object-cover ${sizeClasses.image}`}
          />
        </div>
      </div>
    );
  }

  // Preset Icon Logo
  const IconComponent = BRAND_ICONS[branding.logoIcon || 'Cpu'] || Cpu;

  return (
    <div className={`${sizeClasses.container} bg-gradient-to-tr ${theme.border} shadow-md ${theme.glow} flex-shrink-0 ${className}`}>
      <div className={`w-full h-full bg-background ${sizeClasses.inner} flex items-center justify-center`}>
        <IconComponent className={`${sizeClasses.icon} ${theme.iconColor}`} />
      </div>
    </div>
  );
}
