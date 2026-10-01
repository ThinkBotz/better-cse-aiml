/// <reference types="vite/client" />
import React, { useState } from 'react';
import { Cpu, Lock, Mail, Phone, User, Award, ShieldAlert, KeyRound, Sparkles, Eye, EyeOff, Zap } from 'lucide-react';
import { UserProfile, UserRole, AppBranding, DEFAULT_BRANDING } from '../types';
import BrandLogo from './BrandLogo';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { fetchUsers, createUserProfile, updateUserProfile, findUserForLogin } from '../firebase';
import { CrowdCanvas } from './ui/skiper-ui/skiper39';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  allUsers: UserProfile[];
  refreshUsers: () => void;
  branding?: AppBranding;
}

export default function LoginView({ 
  onLoginSuccess, 
  allUsers, 
  refreshUsers,
  branding = DEFAULT_BRANDING
}: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailOrRoll, setEmailOrRoll] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Sign up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [year, setYear] = useState('3rd Year');
  const [section, setSection] = useState('A');
  const [skills, setSkills] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin PIN states
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrRoll || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Look for user with matching email or roll number
      let foundUser = allUsers.find(
        u => (u.email.toLowerCase() === emailOrRoll.toLowerCase() || 
             (u.rollNumber && u.rollNumber.toLowerCase() === emailOrRoll.toLowerCase()))
      );

      // Check environment variables for super admin override
      const envAdminUser = import.meta.env.VITE_ADMIN_USERNAME;
      const envAdminPass = import.meta.env.VITE_ADMIN_PASSWORD;

      if (envAdminUser && emailOrRoll === envAdminUser && password === envAdminPass) {
        if (!foundUser) {
          const newAdmin: UserProfile = {
            uid: "admin_master",
            name: "System Admin",
            email: envAdminUser,
            role: "admin",
            phone: "",
            profile_pic: "",
            rollNumber: envAdminUser,
            position: "System Administrator",
            department: "Administration",
            responsibilities: "Full system access",
            password: envAdminPass,
            created_at: new Date().toISOString()
          };
          await createUserProfile(newAdmin);
          foundUser = newAdmin;
          refreshUsers();
        } else if (foundUser.role !== 'admin') {
          await updateUserProfile(foundUser.uid, { role: 'admin' });
          foundUser.role = 'admin';
          refreshUsers();
        }
      }

      // If user was not yet in local allUsers memory (e.g. freshly created on another device),
      // look up live in Firestore directly so there is zero delay across devices
      if (!foundUser) {
        const liveUser = await findUserForLogin(emailOrRoll);
        if (liveUser) {
          foundUser = liveUser;
          refreshUsers();
        }
      }

      if (foundUser) {
        if (foundUser.password && foundUser.password !== password) {
          setError('Invalid password. Please check your credentials.');
          setLoading(false);
          return;
        }
        // If password wasn't set (e.g. legacy/seeded profiles), set it on first login
        if (!foundUser.password) {
          await updateUserProfile(foundUser.uid, { password: password });
          foundUser.password = password;
          refreshUsers();
        }
        onLoginSuccess(foundUser);
      } else {
        setError('Invalid Roll Number/Email or password. Please check your credentials.');
      }
    } catch (err) {
      console.error(err);
      setError('Login error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !rollNumber || !phone || !signUpPassword) {
      setError('Please fill in all required fields including password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if user already exists
      const exists = allUsers.some(
        u => u.email.toLowerCase() === email.toLowerCase() || 
             (u.rollNumber && u.rollNumber.toLowerCase() === rollNumber.toLowerCase())
      );

      if (exists) {
        setError('User with this Email or Roll Number already registered.');
        setLoading(false);
        return;
      }

      const newUid = `user_student_${Date.now()}`;
      
      const newProfile: UserProfile = {
        uid: newUid,
        name,
        email,
        role: 'student',
        phone,
        rollNumber: rollNumber.toUpperCase(),
        branch: 'CSE (AI & ML)',
        year,
        section,
        skills,
        password: signUpPassword,
        profile_pic: "",
        department: "CSE (AI & ML)",
        created_at: new Date().toISOString()
      };

      await createUserProfile(newProfile);
      refreshUsers();
      onLoginSuccess(newProfile);
    } catch (err) {
      setError('Error creating account. Please try again.');
      console.error(err);
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
      const googleEmail = result.user.email;
      
      if (!googleEmail) {
        setError('No email found in Google account.');
        setLoading(false);
        return;
      }
      
      // Look for user whose googleEmail matches or email matches
      const foundUser = allUsers.find(
        u => (u.googleEmail && u.googleEmail.toLowerCase() === googleEmail.toLowerCase()) || 
             (u.email.toLowerCase() === googleEmail.toLowerCase())
      );
      
      if (foundUser) {
        onLoginSuccess(foundUser);
      } else {
        setError('No account linked to this Google email. Please login with your Roll Number first and connect your Google account in Profile Settings.');
      }
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

      {/* ── LEFT / TOP HERO STRIP ── Bold saturated yellow with ink typography & animated crowd ── */}
      <div
        className="w-full sm:w-1/2 flex-shrink-0 flex flex-col items-start justify-between p-6 sm:p-12 lg:p-16 min-h-[560px] sm:min-h-full border-b-[2.5px] sm:border-b-0 sm:border-r-[2.5px] border-[var(--nb-ink)] relative overflow-hidden select-none"
        style={{ 
          background: 'var(--nb-yellow)', 
          color: '#111111' 
        }}
      >
        {/* Animated Skiper-UI Crowd Canvas (bottom strip overlay) */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] sm:h-[38%] pointer-events-none z-0 overflow-hidden translate-y-8">
          <CrowdCanvas
            src="/images/peeps/all-peeps.png"
            rows={15}
            cols={7}
            className="w-full h-full"
          />
        </div>

        {/* Logo + wordmark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-1 rounded-md bg-white border-2 border-black shadow-[2px_2px_0_#111]">
            <BrandLogo branding={branding} size="md" />
          </div>
          <div>
            <span className="nb-pill-coral text-[10px] font-mono font-bold uppercase inline-block mb-0.5">
              {branding.subtitle || 'CSE (AI & ML)'}
            </span>
            <p className="font-display text-lg tracking-wider text-[#111111]">
              {branding.appName || 'NOTX'}
            </p>
          </div>
        </div>

        {/* Big headline + sticker pills */}
        <div className="relative z-10 mt-6 sm:mt-0 space-y-2.5 sm:space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="nb-pill-pink text-[10px] font-mono font-bold shadow-[2px_2px_0_#111] inline-flex items-center gap-1">
              <Zap className="w-3 h-3" /> DIGITAL PASSES
            </span>
            <span className="nb-pill-cyan text-[10px] font-mono font-bold shadow-[2px_2px_0_#111] inline-flex items-center gap-1">
              <Award className="w-3 h-3" /> WALL OF FAME
            </span>
          </div>

          <h1
            className="nb-headline leading-none text-[#111111]"
            style={{ fontSize: 'clamp(2.5rem, 7vw, 4.25rem)' }}
          >
            {branding.tagline || 'Connect'}
          </h1>
          
          <p
            className="text-xs sm:text-sm font-semibold leading-relaxed max-w-md text-neutral-800"
          >
            Your high-octane departmental hub. Instant pass verification, live notices, and association events.
          </p>
        </div>

        {/* Bottom tag */}
        <div
          className="relative z-10 mt-5 sm:mt-0 font-mono font-bold text-xs uppercase px-3.5 py-1.5 rounded-md bg-[#111111] text-[#FFE600] border-2 border-black shadow-[2.5px_2.5px_0_rgba(0,0,0,0.3)] self-start"
        >
          {branding.subtitle ? `${branding.subtitle} Association` : 'Association Ecosystem'}
        </div>
      </div>

      {/* ── RIGHT / BOTTOM FORM PANEL ── crisp surface with bold ink accents ── */}
      <div className="w-full sm:w-1/2 flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-[var(--nb-surface)] relative">


        {/* Error banner */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 p-3.5 border-2 border-[var(--nb-ink)] rounded-md nb-pill-coral font-bold shadow-[3px_3px_0_var(--nb-ink)]">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm">{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4 max-w-md w-full mx-auto">
          <div className="border-b-2 border-[var(--nb-ink)] pb-3 mb-2">
            <h2 className="nb-headline text-2xl text-[var(--nb-content)]">SIGN IN</h2>
            <p className="nb-label text-xs text-[var(--nb-secondary)] mt-0.5">Use your University Roll Number or Department Email</p>
          </div>

          {/* Roll / Email */}
          <div>
            <label className="nb-label block mb-1.5 font-bold">Roll Number or Email</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nb-secondary)]" />
              <input
                type="text"
                value={emailOrRoll}
                onChange={(e) => setEmailOrRoll(e.target.value)}
                placeholder="e.g. 23A81A4202"
                className="nb-input !pl-10 font-mono text-xs rounded-md"
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="nb-label block mb-1.5 font-bold">Access Password</label>
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
                Sign In To Portal
              </>
            )}
          </button>

          {/* Info note */}
          <div 
            className="p-3 rounded-md bg-[var(--nb-yellow-subtle)] text-neutral-900"
            style={{ border: '1.5px solid var(--nb-ink)', boxShadow: '2px 2px 0 var(--nb-ink)' }}
          >
            <p className="text-xs font-medium leading-relaxed">
              Default password is your <strong>Roll Number</strong>. Contact{' '}
              <strong className="underline">HOD or Association President</strong> if you need an access reset.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-[2px] bg-[var(--nb-divider)]" />
            <span className="nb-label text-[11px] font-mono font-bold px-2 py-0.5 bg-[var(--nb-surface-accent)] rounded border border-[var(--nb-ink)]">
              OR
            </span>
            <div className="flex-1 h-[2px] bg-[var(--nb-divider)]" />
          </div>

          {/* Google login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-md font-mono font-bold text-xs uppercase tracking-wider bg-white text-[var(--nb-content)] border-2 border-[var(--nb-ink)] shadow-[2.5px_2.5px_0_var(--nb-ink)] hover:bg-[var(--nb-surface-accent)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
