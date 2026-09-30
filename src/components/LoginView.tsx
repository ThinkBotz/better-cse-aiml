/// <reference types="vite/client" />
import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  User, 
  ShieldAlert, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Layers, 
  Sparkles,
  School
} from 'lucide-react';
import { UserProfile, AppBranding, DEFAULT_BRANDING, Tenant, SUPER_ADMIN_EMAILS } from '../types';
import BrandLogo from './BrandLogo';
import { 
  auth, 
  subscribeToTenants, 
  findTenantByAdminEmail, 
  findUserForLogin, 
  createUserProfile, 
  updateUserProfile,
  DEFAULT_TENANT_ID
} from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { hashPassword, verifyPassword, recordUserActivity } from '../utils/auth';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  allUsers: UserProfile[];
  refreshUsers: () => void;
  branding?: AppBranding;
  activeTenantId?: string;
  onSelectTenant?: (tenantId: string) => void;
}

export default function LoginView({ 
  onLoginSuccess, 
  allUsers, 
  refreshUsers,
  branding = DEFAULT_BRANDING,
  activeTenantId = DEFAULT_TENANT_ID,
  onSelectTenant
}: LoginViewProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    return localStorage.getItem('notx_active_tenant') || activeTenantId || DEFAULT_TENANT_ID;
  });

  const [rollNumberInput, setRollNumberInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Subscribe to real-time tenants
  useEffect(() => {
    const unsub = subscribeToTenants((list) => {
      setTenants(list);
      // If selected tenant not in active list, default to first active tenant
      const activeTenants = list.filter(t => t.status === 'active');
      if (activeTenants.length > 0 && !activeTenants.some(t => t.tenantId === selectedTenantId)) {
        setSelectedTenantId(activeTenants[0].tenantId);
      }
    });
    return () => unsub();
  }, [selectedTenantId]);

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    localStorage.setItem('notx_active_tenant', tenantId);
    if (onSelectTenant) {
      onSelectTenant(tenantId);
    }
  };

  const selectedTenant = tenants.find(t => t.tenantId === selectedTenantId) || tenants[0];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollNumberInput || !password) {
      setError('Please enter both your Roll Number and Password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if selected tenant is deactivated
      if (selectedTenant && selectedTenant.status === 'inactive') {
        setError(`The association "${selectedTenant.name}" has been deactivated. Please contact your administrator.`);
        setLoading(false);
        return;
      }

      const cleanRoll = rollNumberInput.trim();
      const syntheticEmail = `${cleanRoll.toLowerCase()}.${selectedTenantId.toLowerCase()}@notx.com`;

      // 1. Check environment variables for super admin override
      const envAdminUser = import.meta.env.VITE_ADMIN_USERNAME;
      const envAdminPass = import.meta.env.VITE_ADMIN_PASSWORD;

      if (envAdminUser && cleanRoll.toLowerCase() === envAdminUser.toLowerCase() && password === envAdminPass) {
        let masterAdmin = allUsers.find(u => u.email.toLowerCase() === envAdminUser.toLowerCase());
        if (!masterAdmin) {
          masterAdmin = {
            uid: "admin_master",
            name: "System Admin",
            email: envAdminUser,
            role: "admin",
            isSuperAdmin: true,
            phone: "",
            profile_pic: "",
            rollNumber: envAdminUser,
            position: "System Administrator",
            department: "Administration",
            responsibilities: "Full system access",
            password: envAdminPass,
            created_at: new Date().toISOString()
          };
          await createUserProfile(masterAdmin);
          refreshUsers();
        }
        onLoginSuccess(masterAdmin);
        setLoading(false);
        return;
      }

      // 2. Try Firebase Auth with synthetic email
      let authUserSuccess = false;
      try {
        await signInWithEmailAndPassword(auth, syntheticEmail, password);
        authUserSuccess = true;
      } catch (authErr: any) {
        // Fall back to direct profile lookup
      }

      // 3. Find user in memory or live Firestore
      let foundUser = allUsers.find(u => 
        (u.rollNumber?.toLowerCase() === cleanRoll.toLowerCase() || 
         u.email.toLowerCase() === cleanRoll.toLowerCase() ||
         u.email.toLowerCase() === syntheticEmail) &&
        (u.tenantId === selectedTenantId || !u.tenantId || u.isSuperAdmin)
      );

      if (!foundUser) {
        foundUser = await findUserForLogin(cleanRoll, selectedTenantId);
      }

      if (foundUser) {
        // If user already has a password, verify using secure hash comparison
        if (foundUser.password && !authUserSuccess) {
          const { isValid, needsRehash } = await verifyPassword(password, foundUser.password);
          if (!isValid) {
            setError('Invalid password. Please check your credentials.');
            setLoading(false);
            return;
          }
          // Automatically upgrade legacy plain text password to cryptographic SHA-256 hash
          if (needsRehash) {
            try {
              const hashedPassword = await hashPassword(password);
              await updateUserProfile(foundUser.uid, { password: hashedPassword });
              foundUser.password = hashedPassword;
            } catch (hashErr) {
              console.warn('Silent rehash error:', hashErr);
            }
          }
        }

        // If password was empty (first time login for seeded profiles)
        if (!foundUser.password) {
          const hashedPassword = await hashPassword(password);
          await updateUserProfile(foundUser.uid, { password: hashedPassword });
          foundUser.password = hashedPassword;
          refreshUsers();
        }

        recordUserActivity();
        onLoginSuccess(foundUser);
      } else {
        setError(`No user found with Roll Number "${cleanRoll}" in ${selectedTenant?.name || 'this department'}.`);
      }
    } catch (err: any) {
      console.error(err);
      setError('Login error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleEmail = result.user.email?.toLowerCase();
      
      if (!googleEmail) {
        setError('No email found in Google account.');
        setLoading(false);
        return;
      }

      // 1. Check Super Admin
      const isSuper = SUPER_ADMIN_EMAILS.some(e => e.toLowerCase() === googleEmail);
      if (isSuper) {
        let superAdmin = allUsers.find(u => u.email.toLowerCase() === googleEmail && u.isSuperAdmin);
        if (!superAdmin) {
          superAdmin = {
            uid: result.user.uid,
            name: result.user.displayName || "Super Admin",
            email: googleEmail,
            googleEmail: googleEmail,
            role: 'admin',
            isSuperAdmin: true,
            tenantId: selectedTenantId || DEFAULT_TENANT_ID,
            profile_pic: result.user.photoURL || "",
            position: "SaaS Super Administrator",
            department: "NOTX Global Administration",
            responsibilities: "Platform control and tenant oversight",
            created_at: new Date().toISOString()
          };
          await createUserProfile(superAdmin);
          refreshUsers();
        }
        recordUserActivity();
        onLoginSuccess(superAdmin);
        return;
      }

      // 2. Check if this is an authorized Tenant Admin for any department
      const tenant = await findTenantByAdminEmail(googleEmail);
      if (tenant) {
        if (tenant.status === 'inactive') {
          setError(`The association "${tenant.name}" has been deactivated by Super Admin.`);
          return;
        }
        let tenantAdmin = allUsers.find(u => u.email.toLowerCase() === googleEmail && u.tenantId === tenant.tenantId);
        if (!tenantAdmin) {
          tenantAdmin = {
            uid: result.user.uid,
            name: result.user.displayName || `${tenant.shortCode} Admin`,
            email: googleEmail,
            googleEmail: googleEmail,
            role: 'admin',
            tenantId: tenant.tenantId,
            profile_pic: result.user.photoURL || "",
            position: "Department Administrator",
            department: tenant.name,
            responsibilities: `Administrative access for ${tenant.name}`,
            created_at: new Date().toISOString()
          };
          await createUserProfile(tenantAdmin);
          refreshUsers();
        }
        recordUserActivity();
        onLoginSuccess(tenantAdmin);
        return;
      }

      // 3. Check if user already manually linked their Google email in their profile (tenant-scoped)
      if (selectedTenant && selectedTenant.status === 'inactive') {
        setError(`The association "${selectedTenant.name}" has been deactivated.`);
        return;
      }
      const linkedStudent = allUsers.find(u => 
        u.googleEmail?.toLowerCase() === googleEmail &&
        (u.tenantId === selectedTenantId || (!u.tenantId && selectedTenantId === DEFAULT_TENANT_ID))
      );
      if (linkedStudent) {
        recordUserActivity();
        onLoginSuccess(linkedStudent);
        return;
      }

      // 4. If no linked account exists for this student in the selected tenant
      setError(`No account is linked to this Google email (${googleEmail}) in "${selectedTenant?.name || 'this department'}". Students must sign in using their Roll Number first and connect Google in Profile Settings.`);
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col sm:flex-row overflow-y-auto bg-[var(--nb-bg)]">

      {/* ── LEFT / TOP HERO STRIP ── Bold saturated yellow with ink typography & stickers ── */}
      <div
        className="flex-shrink-0 flex flex-col items-start justify-between p-6 sm:p-10 sm:w-[44%] sm:min-h-full min-h-[240px]"
        style={{ 
          background: 'var(--nb-yellow)', 
          borderRight: '2.5px solid var(--nb-ink)', 
          borderBottom: '2.5px solid var(--nb-ink)',
          color: '#111111' 
        }}
      >
        {/* Logo + SaaS wordmark */}
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#111]">
            <BrandLogo branding={selectedTenant?.branding || branding} size="md" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="nb-pill-coral text-[9px] font-mono font-bold uppercase inline-block">
                SAAS PLATFORM
              </span>
              <span className="nb-pill-cyan text-[9px] font-mono font-bold uppercase inline-block">
                {selectedTenant?.shortCode || 'AIML'}
              </span>
            </div>
            <p className="font-display text-lg tracking-wider text-[#111111] font-black">
              NOTX
            </p>
          </div>
        </div>

        {/* Big headline + sticker pills */}
        <div className="mt-8 sm:mt-0 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="nb-pill-pink text-[10px] font-mono font-bold shadow-[2px_2px_0_#111]">
              ⚡ MULTI-TENANT
            </span>
            <span className="nb-pill-purple text-[10px] font-mono font-bold text-white shadow-[2px_2px_0_#111]">
              🏛 {selectedTenant?.shortCode || 'CSE-AIML'}
            </span>
          </div>

          <h1
            className="nb-headline leading-none text-[#111111]"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)' }}
          >
            {selectedTenant?.name || 'Department Connect'}
          </h1>
          
          <p
            className="text-xs sm:text-sm font-semibold leading-relaxed max-w-[280px] text-neutral-800"
          >
            Universal department pass verification, live notifications, and digital credentials.
          </p>
        </div>

        {/* Bottom tag */}
        <div
          className="mt-6 sm:mt-0 font-mono font-bold text-xs uppercase px-3.5 py-1.5 rounded-md bg-[#111111] text-[#FFE600] border-2 border-black shadow-[2.5px_2.5px_0_rgba(0,0,0,0.3)] self-start"
        >
          {selectedTenant?.institution || 'Academic SaaS Ecosystem'}
        </div>
      </div>

      {/* ── RIGHT / BOTTOM FORM PANEL ── */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-12 bg-[var(--nb-surface)]">

        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 border-2 border-[var(--nb-ink)] rounded-md nb-pill-coral font-bold shadow-[3px_3px_0_var(--nb-ink)] max-w-md w-full mx-auto">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm leading-snug">{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4 max-w-md w-full mx-auto">
          <div className="border-b-2 border-[var(--nb-ink)] pb-3 mb-2">
            <div className="flex items-center justify-between">
              <h2 className="nb-headline text-2xl text-[var(--nb-content)]">SIGN IN</h2>
              <span className="nb-pill-yellow text-[9px] font-mono font-bold text-neutral-900 border border-[var(--nb-ink)] px-2 py-0.5">
                NOTX SAAS
              </span>
            </div>
            <p className="nb-label text-xs text-[var(--nb-secondary)] mt-0.5">
              Select your department tenant and enter your credentials
            </p>
          </div>

          {/* 1. Tenant Selector */}
          <div>
            <label className="nb-label block mb-1.5 font-bold flex items-center justify-between">
              <span>SELECT ASSOCIATION / TENANT</span>
              <span className="text-[9px] font-mono text-[var(--nb-secondary)]">Scope</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nb-secondary)]" />
              <select
                value={selectedTenantId}
                onChange={(e) => handleTenantChange(e.target.value)}
                className="nb-input !pl-10 !pr-10 font-bold text-xs rounded-md w-full cursor-pointer appearance-none bg-[var(--nb-surface)]"
              >
                {tenants.filter(t => t.status === 'active').map(t => (
                  <option key={t.tenantId} value={t.tenantId}>
                    {t.name} ({t.shortCode || t.tenantId})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-[var(--nb-secondary)]" />
            </div>
          </div>

          {/* 2. Roll Number */}
          <div>
            <label className="nb-label block mb-1.5 font-bold flex items-center justify-between">
              <span>ROLL NUMBER</span>
              <span className="text-[9px] font-mono text-[var(--nb-secondary)]">e.g. 23HM1A3354</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nb-secondary)]" />
              <input
                type="text"
                value={rollNumberInput}
                onChange={(e) => setRollNumberInput(e.target.value.toUpperCase())}
                placeholder="e.g. 23HM1A3354"
                className="nb-input !pl-10 font-mono text-xs rounded-md uppercase"
                autoComplete="username"
              />
            </div>
          </div>

          {/* 3. Password */}
          <div>
            <label className="nb-label block mb-1.5 font-bold flex items-center justify-between">
              <span>PASSWORD</span>
              <span className="text-[9px] font-mono text-[var(--nb-secondary)]">Default = Roll or Temp Pass</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nb-secondary)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="nb-input !pl-10 !pr-12 text-xs rounded-md"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 cursor-pointer text-[var(--nb-secondary)] hover:text-[var(--nb-content)]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-3 px-4 rounded-md font-mono font-bold text-xs uppercase tracking-wider text-white bg-[var(--nb-blue)] hover:bg-blue-600 border-2 border-[var(--nb-ink)] shadow-[3px_3px_0_var(--nb-ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Sign In To {selectedTenant?.shortCode || 'Association'}
              </>
            )}
          </button>

          {/* Info note */}
          <div 
            className="p-3 rounded-md bg-[var(--nb-yellow-subtle)] dark:bg-[var(--nb-surface-accent)] text-neutral-900 dark:text-neutral-100"
            style={{ border: '1.5px solid var(--nb-ink)', boxShadow: '2px 2px 0 var(--nb-ink)' }}
          >
            <p className="text-xs font-medium leading-relaxed">
              Default password is your <strong>Roll Number</strong> or temporary password <strong>notx@123</strong>.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[2px] bg-[var(--nb-divider)]" />
            <span className="nb-label text-[11px] font-mono font-bold px-2 py-0.5 bg-[var(--nb-surface-accent)] rounded border border-[var(--nb-ink)]">
              ADMIN & LINKED GOOGLE SIGN-IN
            </span>
            <div className="flex-1 h-[2px] bg-[var(--nb-divider)]" />
          </div>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-md font-mono font-bold text-xs uppercase tracking-wider bg-white dark:bg-neutral-900 text-[var(--nb-content)] border-2 border-[var(--nb-ink)] shadow-[2.5px_2.5px_0_var(--nb-ink)] hover:bg-[var(--nb-surface-accent)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <p className="text-[10px] text-center font-mono text-[var(--nb-secondary)]">
            Auto-detects Super Admin / Tenant Admin. Students must link Google in Profile first.
          </p>
        </form>
      </div>
    </div>
  );
}
