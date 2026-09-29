/// <reference types="vite/client" />
import React, { useState } from 'react';
import { Cpu, Lock, Mail, Phone, User, Award, ShieldAlert, KeyRound, Sparkles, Eye, EyeOff } from 'lucide-react';
import { UserProfile, UserRole, AppBranding, DEFAULT_BRANDING } from '../types';
import BrandLogo from './BrandLogo';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { fetchUsers, createUserProfile, updateUserProfile, findUserForLogin } from '../firebase';

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
    <div className="h-full w-full flex flex-col justify-between overflow-y-auto px-5 py-8 bg-background text-content">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mt-2">
        <BrandLogo branding={branding} size="xl" className="mb-4 shadow-2xl shadow-rose-500/20" />
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 text-[11px] font-sans font-bold border border-rose-400/30 mb-2">
          <span>{branding.subtitle ? `${branding.subtitle} Department` : 'CSE (AI & ML) Department'}</span>
        </div>
        <h2 className="text-2xl font-display font-extrabold text-content tracking-tight leading-tight">
          {branding.appName || 'NOTX'}{' '}
          <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
            {branding.tagline || 'Connect'}
          </span>
        </h2>
        <p className="text-xs text-secondary mt-1 max-w-xs">
          Sign in to access your student passes, events & bulletin
        </p>
      </div>

      {/* Main Login Card / Sign Up inspired by reference */}
      <div className="my-4 sm:my-6 ref-card p-5 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/15 rounded-full blur-[40px] pointer-events-none" />
        
        {error && (
          <div className="mb-4 text-xs font-semibold text-rose-200 bg-rose-950/60 border border-rose-500/40 rounded-2xl p-3.5 flex items-start gap-2.5 shadow-md">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4.5">
          <div>
            <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-1.5 ml-2">Roll Number or Department Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input 
                type="text" 
                value={emailOrRoll}
                onChange={(e) => setEmailOrRoll(e.target.value)}
                placeholder="e.g. 23A81A4202 or username"
                className="w-full bg-surface-accent/60 border border-divider/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm text-content placeholder:text-secondary rounded-full py-3 pl-11 pr-4 outline-none transition-all shadow-inner"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-2">
              <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider">Access Password</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-accent/60 border border-divider/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-sm text-content placeholder:text-secondary rounded-full py-3 pl-11 pr-11 outline-none transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-content transition-colors focus:outline-none p-1 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-rose-400" />
                ) : (
                  <Eye className="w-4 h-4 text-secondary hover:text-content" />
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full ref-pill-button py-3.5 text-xs font-extrabold uppercase tracking-wider shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {loading ? (
              <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
            ) : (
              <>
                <div className="ref-icon-bubble w-6 h-6">
                  <KeyRound className="w-3.5 h-3.5 text-white" />
                </div>
                <span>Sign In Securely</span>
              </>
            )}
          </button>
          
          <div className="bg-surface-accent/40 border border-divider/60 rounded-2xl p-3 text-center mt-3 backdrop-blur-md">
            <p className="text-[11px] text-secondary leading-relaxed">
              Accounts are managed centrally. Contact <strong className="text-rose-300">ADMIN or President</strong> for default credentials.
            </p>
          </div>
        </form>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-divider/60"></div>
          <span className="flex-shrink-0 mx-4 text-[10px] uppercase text-secondary font-bold tracking-widest">Or</span>
          <div className="flex-grow border-t border-divider/60"></div>
        </div>
        
        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full ref-pill-secondary py-3.5 text-xs font-bold uppercase tracking-wider justify-center shadow-md active:scale-98"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
