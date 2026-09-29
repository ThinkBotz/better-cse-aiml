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
    <div className="h-full w-full bg-[var(--nb-bg)] flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-[var(--nb-surface)] rounded-lg p-6 relative overflow-hidden"
        style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard)' }}
      >
        <div className="text-center mb-6">
          <div 
            className="inline-flex p-3 bg-[var(--nb-surface-accent)] rounded-lg mb-3 text-[var(--nb-accent)]"
            style={{ border: '1.5px solid var(--nb-ink)' }}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="nb-headline text-2xl text-[var(--nb-content)] mb-1">
            {isPasswordResetOnly ? `Reset Password, ${user.rollNumber}` : `Welcome, ${user.rollNumber}!`}
          </h2>
          <p className="nb-label text-xs text-[var(--nb-secondary)]">
            {isPasswordResetOnly ? "PLEASE SET A NEW PASSWORD FOR YOUR ACCOUNT." : "PLEASE COMPLETE YOUR PROFILE SETUP TO CONTINUE."}
          </p>
        </div>

        {error && (
          <div 
            className="mb-4 text-xs font-bold text-rose-600 bg-rose-500/10 p-3 rounded text-center"
            style={{ border: '1.5px solid var(--nb-ink)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isPasswordResetOnly && (
            <>
              <div>
                <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1">PHONE NUMBER *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nb-secondary)]" />
                  <input 
                    type="text" 
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-[var(--nb-surface-accent)] text-xs font-bold text-[var(--nb-content)] rounded py-2.5 pl-9 pr-3 outline-none"
                    style={{ border: '1.5px solid var(--nb-ink)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1">YEAR *</label>
                  <select 
                    value={year} 
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full bg-[var(--nb-surface-accent)] text-xs font-bold text-[var(--nb-content)] rounded py-2.5 px-3 outline-none"
                    style={{ border: '1.5px solid var(--nb-ink)' }}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1">SECTION *</label>
                  <input 
                    type="text" 
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="A"
                    className="w-full bg-[var(--nb-surface-accent)] text-xs font-bold text-[var(--nb-content)] rounded py-2.5 px-3 outline-none uppercase font-mono"
                    style={{ border: '1.5px solid var(--nb-ink)' }}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1">SET NEW PASSWORD *</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--nb-secondary)]" />
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Choose a strong password"
                className="w-full bg-[var(--nb-surface-accent)] text-xs font-bold text-[var(--nb-content)] rounded py-2.5 pl-9 pr-3 outline-none"
                style={{ border: '1.5px solid var(--nb-ink)' }}
              />
            </div>
            <p className="nb-label text-[10px] text-[var(--nb-secondary)] mt-1">THIS WILL REPLACE YOUR TEMPORARY CREDENTIAL.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full nb-btn text-xs font-bold uppercase tracking-wider rounded py-3 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            style={{ border: '2px solid var(--nb-ink)', boxShadow: 'var(--shadow-hard-sm)' }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isPasswordResetOnly ? "Update Password" : "Complete Setup")}
          </button>
        </form>
      </div>
    </div>
  );
}
