import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  ExternalLink, 
  ShieldCheck, 
  Users, 
  Calendar, 
  Award, 
  Layers, 
  ArrowRight, 
  Check, 
  Copy, 
  X, 
  Sparkles,
  LogOut,
  Settings,
  Mail,
  School,
  Globe
} from 'lucide-react';
import { Tenant, UserProfile } from '../types';
import { getAllTenants, createTenant, subscribeToTenants, DEFAULT_TENANT_ID } from '../firebase';
import BrandLogo from './BrandLogo';

interface SuperAdminDashboardProps {
  currentUser: UserProfile;
  onEnterTenant: (tenantId: string) => void;
  onLogout: () => void;
}

export default function SuperAdminDashboard({
  currentUser,
  onEnterTenant,
  onLogout
}: SuperAdminDashboardProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedTenantId, setCopiedTenantId] = useState<string | null>(null);

  // New Tenant Form state
  const [newTenantId, setNewTenantId] = useState('');
  const [newName, setNewName] = useState('');
  const [newShortCode, setNewShortCode] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newInstitution, setNewInstitution] = useState('Annamacharya Institute of Tech & Sciences');
  const [newAccentColor, setNewAccentColor] = useState('indigo');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToTenants((list) => {
      setTenants(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleCopyLink = (tenantId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?tenant=${tenantId}`;
    navigator.clipboard.writeText(url);
    setCopiedTenantId(tenantId);
    setTimeout(() => setCopiedTenantId(null), 2500);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanSlug = newTenantId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!cleanSlug || !newName.trim() || !newAdminEmail.trim()) {
      setFormError('Please fill in Tenant Slug, Association Name, and Admin Gmail.');
      return;
    }

    if (tenants.some(t => t.tenantId === cleanSlug)) {
      setFormError(`A tenant with ID "${cleanSlug}" already exists.`);
      return;
    }

    setSubmitting(true);
    try {
      const newTenant: Tenant = {
        tenantId: cleanSlug,
        name: newName.trim(),
        shortCode: (newShortCode.trim() || cleanSlug.toUpperCase()).substring(0, 10),
        adminEmail: newAdminEmail.trim().toLowerCase(),
        institution: newInstitution.trim(),
        status: 'active',
        branding: {
          appName: 'NOTX',
          tagline: 'Connect',
          subtitle: newShortCode.trim() || newName.trim(),
          logoType: 'preset',
          logoIcon: 'Cpu',
          accentColor: newAccentColor
        },
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email
      };

      await createTenant(newTenant);
      setIsAddModalOpen(false);
      setNewTenantId('');
      setNewName('');
      setNewShortCode('');
      setNewAdminEmail('');
    } catch (err: any) {
      console.error(err);
      setFormError('Failed to create tenant. Please verify database permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--nb-bg)] text-[var(--nb-content)] flex flex-col font-sans">
      
      {/* ── TOP MASTER BAR ── */}
      <header className="border-b-[2.5px] border-[var(--nb-ink)] bg-[var(--nb-surface)] sticky top-0 z-30 shadow-[0_2px_0_var(--nb-ink)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[var(--nb-yellow)] border-2 border-[var(--nb-ink)] flex items-center justify-center shadow-[2px_2px_0_var(--nb-ink)]">
              <Layers className="w-5 h-5 text-neutral-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-lg tracking-wider text-[var(--nb-content)]">
                  NOTX
                </span>
                <span className="nb-pill-coral text-[9px] font-mono font-bold uppercase py-0.5 px-1.5">
                  SAAS ROOT
                </span>
              </div>
              <p className="text-[10px] font-mono text-[var(--nb-secondary)]">Multi-Tenant Platform Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[var(--nb-surface-accent)] rounded border border-[var(--nb-ink)]">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-mono font-bold truncate max-w-[200px]">
                {currentUser.email}
              </span>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="nb-btn text-xs font-bold uppercase py-2 px-3.5 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tenant</span>
            </button>
            <button
              onClick={onLogout}
              className="nb-btn-ghost text-xs font-bold uppercase py-2 px-3 flex items-center gap-1.5 cursor-pointer text-rose-500 hover:text-rose-600"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        
        {/* Banner */}
        <div 
          className="p-6 rounded-lg bg-[var(--nb-yellow)] text-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
          style={{ border: '2.5px solid var(--nb-ink)', boxShadow: '4px 4px 0 var(--nb-ink)' }}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="nb-pill-pink text-[10px] font-mono font-bold uppercase px-2 py-0.5">
                SUPER ADMIN SESSION
              </span>
              <span className="text-xs font-mono font-bold">Google Auth Verified</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight">
              Manage Tenants & Associations
            </h1>
            <p className="text-xs sm:text-sm font-medium text-neutral-800 max-w-xl">
              Provision independent department associations, assign Gmail tenant administrators, and enter any workspace with master oversight.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/90 border-2 border-black rounded-md p-3 text-center min-w-[100px] shadow-[2px_2px_0_#000]">
              <div className="font-display text-2xl font-black">{tenants.length}</div>
              <div className="text-[9px] font-mono font-bold uppercase">Total Tenants</div>
            </div>
            <div className="bg-white/90 border-2 border-black rounded-md p-3 text-center min-w-[100px] shadow-[2px_2px_0_#000]">
              <div className="font-display text-2xl font-black text-emerald-600">
                {tenants.filter(t => t.status === 'active').length}
              </div>
              <div className="text-[9px] font-mono font-bold uppercase">Active</div>
            </div>
          </div>
        </div>

        {/* Tenant Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="nb-headline text-lg text-[var(--nb-content)] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[var(--nb-accent)]" />
              Onboarded Tenants ({tenants.length})
            </h2>
            <span className="text-xs font-mono text-[var(--nb-secondary)]">Click Enter to supervise association</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tenants.map((tenant) => (
              <div
                key={tenant.tenantId}
                className="bg-[var(--nb-surface)] rounded-lg p-5 flex flex-col justify-between transition-all hover:translate-x-0.5 hover:translate-y-0.5"
                style={{ 
                  border: '2px solid var(--nb-ink)', 
                  boxShadow: '3px 3px 0 var(--nb-ink)' 
                }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="nb-pill-cyan text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 inline-block mb-1">
                        ID: {tenant.tenantId}
                      </span>
                      <h3 className="font-display font-bold text-lg text-[var(--nb-content)] leading-tight">
                        {tenant.name}
                      </h3>
                    </div>
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[var(--nb-ink)] ${
                      tenant.status === 'active' ? 'bg-emerald-400 text-neutral-900' : 'bg-neutral-300 text-neutral-800'
                    }`}>
                      {tenant.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[var(--nb-secondary)]">
                    <div className="flex items-center gap-2">
                      <School className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{tenant.institution || 'Main Campus'}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                      <span className="truncate text-[var(--nb-content)] font-bold">{tenant.adminEmail}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--nb-ink)]/15 space-y-2">
                  <button
                    onClick={() => onEnterTenant(tenant.tenantId)}
                    className="w-full nb-btn py-2 px-3 text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Enter Association</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleCopyLink(tenant.tenantId)}
                    className="w-full nb-btn-ghost py-1.5 px-3 text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ border: '1px solid var(--nb-ink)' }}
                  >
                    {copiedTenantId === tenant.tenantId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Tenant URL</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── ADD NEW TENANT MODAL ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-[var(--nb-surface)] rounded-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            style={{ border: '2.5px solid var(--nb-ink)', boxShadow: '6px 6px 0 var(--nb-ink)' }}
          >
            <div className="flex items-center justify-between border-b-2 border-[var(--nb-ink)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--nb-accent)]" />
                <h3 className="nb-headline text-lg text-[var(--nb-content)]">PROVISION NEW TENANT</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded hover:bg-[var(--nb-surface-accent)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded bg-rose-500/10 border-2 border-rose-500 text-rose-500 text-xs font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-3.5">
              <div>
                <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1 font-bold">
                  TENANT ID / SLUG (URL & EMAIL IDENTIFIER) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ece-dept or mech-dept"
                  value={newTenantId}
                  onChange={(e) => setNewTenantId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  className="w-full bg-[var(--nb-surface-accent)] text-xs text-[var(--nb-content)] rounded p-2.5 outline-none font-mono font-bold"
                  style={{ border: '1.5px solid var(--nb-ink)' }}
                />
                <p className="text-[10px] text-[var(--nb-secondary)] mt-1 font-mono">
                  Students will login with: rollnumber.{newTenantId || 'tenantid'}@notx.com
                </p>
              </div>

              <div>
                <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1 font-bold">
                  ASSOCIATION / DEPARTMENT NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ECE Department Association"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[var(--nb-surface-accent)] text-xs text-[var(--nb-content)] rounded p-2.5 outline-none font-bold"
                  style={{ border: '1.5px solid var(--nb-ink)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1 font-bold">
                    SHORT CODE
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ECE"
                    value={newShortCode}
                    onChange={(e) => setNewShortCode(e.target.value.toUpperCase())}
                    className="w-full bg-[var(--nb-surface-accent)] text-xs text-[var(--nb-content)] rounded p-2.5 outline-none font-mono font-bold"
                    style={{ border: '1.5px solid var(--nb-ink)' }}
                  />
                </div>
                <div>
                  <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1 font-bold">
                    ACCENT COLOR
                  </label>
                  <select
                    value={newAccentColor}
                    onChange={(e) => setNewAccentColor(e.target.value)}
                    className="w-full bg-[var(--nb-surface-accent)] text-xs text-[var(--nb-content)] rounded p-2.5 outline-none font-bold cursor-pointer"
                    style={{ border: '1.5px solid var(--nb-ink)' }}
                  >
                    <option value="indigo">Indigo</option>
                    <option value="violet">Violet</option>
                    <option value="emerald">Emerald</option>
                    <option value="cyan">Cyan</option>
                    <option value="amber">Amber</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1 font-bold">
                  TENANT ADMIN GMAIL (AUTHORIZED GOOGLE SIGN-IN) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ece.hod@gmail.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full bg-[var(--nb-surface-accent)] text-xs text-[var(--nb-content)] rounded p-2.5 outline-none font-mono font-bold"
                  style={{ border: '1.5px solid var(--nb-ink)' }}
                />
                <p className="text-[10px] text-[var(--nb-secondary)] mt-1">
                  This Gmail will automatically receive Admin rights when signing in with Google.
                </p>
              </div>

              <div>
                <label className="block nb-label text-[10px] text-[var(--nb-secondary)] mb-1 font-bold">
                  COLLEGE / INSTITUTION NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. Annamacharya Institute of Tech & Sciences"
                  value={newInstitution}
                  onChange={(e) => setNewInstitution(e.target.value)}
                  className="w-full bg-[var(--nb-surface-accent)] text-xs text-[var(--nb-content)] rounded p-2.5 outline-none"
                  style={{ border: '1.5px solid var(--nb-ink)' }}
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 nb-btn-ghost py-2.5 text-xs font-bold uppercase cursor-pointer"
                  style={{ border: '1.5px solid var(--nb-ink)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 nb-btn py-2.5 text-xs font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submitting ? 'Creating...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
