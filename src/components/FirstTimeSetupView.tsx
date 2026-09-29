import React, { useState } from 'react';
import { UserProfile } from '../types';
import { updateUserProfile } from '../firebase';
import { Sparkles, Phone, Mail, User, ShieldCheck, Loader2 } from 'lucide-react';

interface FirstTimeSetupViewProps {
  user: UserProfile;
  onComplete: (updatedUser: UserProfile) => void;
}

export default function FirstTimeSetupView({ user, onComplete }: FirstTimeSetupViewProps) {
  // Check if this is just a password reset (i.e., user already has data)
  const isPasswordResetOnly = Boolean(user.phone && user.year && user.section);

  const [phone, setPhone] = useState(user.phone || '');
  const [year, setYear] = useState(user.year || '3rd Year');
  const [section, setSection] = useState(user.section || 'A');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || (!isPasswordResetOnly && (!phone || !year || !section))) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const updates: Partial<UserProfile> = {
        password: newPassword,
        isFirstLogin: false
      };
      
      if (!isPasswordResetOnly) {
        Object.assign(updates, { phone, year, section });
      }
      
      await updateUserProfile(user.uid, updates);
      
      const updatedUser = { ...user, ...updates } as UserProfile;
      onComplete(updatedUser);
    } catch (err) {
      console.error(err);
      setError('Failed to save details. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
        
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-full mb-3">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-content mb-1">
            {isPasswordResetOnly ? `Reset Password, ${user.rollNumber}` : `Welcome, ${user.rollNumber}!`}
          </h2>
          <p className="text-xs text-secondary">
            {isPasswordResetOnly ? "Please set a new password for your account." : "Please complete your profile setup to continue."}
          </p>
        </div>

        {error && (
          <div className="mb-4 text-xs text-rose-300 bg-rose-950/50 p-3 rounded-lg border border-rose-800/50 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isPasswordResetOnly && (
            <>
              <div>
                <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                  <input 
                    type="text" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2.5 pl-9 pr-3 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">Year *</label>
                  <select 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2.5 px-3 outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">Section *</label>
                  <input 
                    type="text" 
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="A"
                    className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2.5 px-3 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-semibold text-secondary uppercase mb-1">Set New Password *</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2.5 pl-9 pr-3 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <p className="text-[10px] text-tertiary mt-1">This will replace your temporary password.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-500 hover:opacity-95 text-content font-bold text-xs uppercase tracking-wider rounded-xl py-3.5 mt-2 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPasswordResetOnly ? "Update Password" : "Complete Setup")}
          </button>
        </form>
      </div>
    </div>
  );
}
