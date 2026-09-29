import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Database, 
  Sparkles, 
  RefreshCw, 
  Lock, 
  Calendar, 
  Users, 
  Award, 
  Trophy, 
  FolderArchive,
  Check,
  AlertCircle
} from 'lucide-react';
import { UserProfile, DepartmentEvent, EventRegistration } from '../types';
import HoldButton from './HoldButton';
import { exportAllDatabaseData, resetEntireDatabaseForNewAssociation, SystemBackupData } from '../firebase';

interface ResetAssociationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  events: DepartmentEvent[];
  registrations: EventRegistration[];
  initialTab?: 'export' | 'reset';
  onResetComplete: () => void;
}

export default function ResetAssociationModal({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  events,
  registrations,
  initialTab = 'export',
  onResetComplete
}: ResetAssociationModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'reset'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setConfirmationInput('');
      setConfirmCheckbox(false);
      setResetCompleteSummary(null);
    }
  }, [isOpen, initialTab]);
  
  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [lastExportName, setLastExportName] = useState('');

  // Reset confirmation states
  const [hasBackedUp, setHasBackedUp] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetStage, setResetStage] = useState('');
  const [resetPercent, setResetPercent] = useState(0);
  const [resetCompleteSummary, setResetCompleteSummary] = useState<any | null>(null);

  if (!isOpen) return null;

  const CONFIRM_PHRASE = 'RESET-ASSOCIATION';

  const handleDownloadFullBackup = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const backupData: SystemBackupData = await exportAllDatabaseData(currentUser.name);
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `NOTX_Connect_Full_Backup_${dateStr}.json`;
      
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setLastExportName(filename);
      setExportSuccess(true);
      setHasBackedUp(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error('Backup export failed:', err);
      alert('Failed to generate full backup. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportStudentsCSV = () => {
    const students = allUsers.filter(u => u.role === 'student');
    const headers = ['Roll Number', 'Name', 'Email', 'Department', 'Year', 'Section', 'Phone', 'Created At'];
    const rows = students.map(s => [
      `"${s.rollNumber || ''}"`,
      `"${s.name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.department || ''}"`,
      `"${s.year || ''}"`,
      `"${s.section || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.created_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Students_Directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExportRegistrationsCSV = () => {
    const headers = ['Registration ID', 'Event ID', 'Student Name', 'Roll Number', 'Status', 'Applied At', 'Team Name'];
    const rows = registrations.map(r => [
      `"${r.registrationId}"`,
      `"${r.eventId}"`,
      `"${r.studentName}"`,
      `"${r.rollNumber || ''}"`,
      `"${r.status}"`,
      `"${r.appliedAt}"`,
      `"${r.teamName || 'Solo'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Event_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleExecuteReset = async () => {
    if (confirmationInput.trim() !== CONFIRM_PHRASE || !confirmCheckbox) {
      return;
    }

    setIsResetting(true);
    setResetStage('Preparing system clean...');
    setResetPercent(5);

    try {
      const summary = await resetEntireDatabaseForNewAssociation(currentUser, (stage, percent) => {
        setResetStage(stage);
        setResetPercent(percent);
      });

      setResetCompleteSummary(summary);
      onResetComplete();
    } catch (err: any) {
      console.error('Reset execution failed:', err);
      alert('Error during reset: ' + (err.message || 'Unknown error'));
      setIsResetting(false);
    }
  };

  const isConfirmDisabled = confirmationInput.trim() !== CONFIRM_PHRASE || !confirmCheckbox || isResetting;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn">
      <div className="bg-surface border border-divider/90 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4.5 border-b border-divider/70 flex items-center justify-between bg-surface-accent/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              activeTab === 'reset' 
                ? 'bg-rose-500/15 border border-rose-500/25 text-rose-400' 
                : 'bg-indigo-500/15 border border-indigo-500/25 text-indigo-400'
            }`}>
              {activeTab === 'reset' ? <AlertTriangle className="w-4 h-4" /> : <Database className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-content font-display">
                {activeTab === 'reset' ? 'Reset Association • Start New Term' : 'System Backup & Data Export'}
              </h3>
              <p className="text-[10.5px] text-secondary">
                {activeTab === 'reset' ? 'Clean wipe database and prepare fresh association instance' : 'Download complete archival exports across all collections'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isResetting}
            className="w-7 h-7 rounded-xl bg-surface-accent hover:bg-divider text-secondary hover:text-content border border-divider flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-5 pt-3 shrink-0 flex gap-2 border-b border-divider/60">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-2 text-xs font-bold font-display flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'export'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-secondary hover:text-content'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1. Overall Data Export</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`pb-2.5 px-2 text-xs font-bold font-display flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
              activeTab === 'reset'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-secondary hover:text-content'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>2. Reset Association (Clean Slate)</span>
          </button>
        </div>

        {/* Tab 1: Export Content */}
        {activeTab === 'export' && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {/* Database Snapshot Stats */}
            <div className="bg-surface-accent/40 rounded-2xl p-4 border border-divider/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Current Database State</span>
                </span>
                <span className="text-[10px] font-mono text-tertiary">Department of CSE (AI & ML)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-surface/80 p-2.5 rounded-xl border border-divider/60 text-center">
                  <div className="text-base font-bold text-content font-mono">{allUsers.length}</div>
                  <div className="text-[9.5px] text-secondary font-medium uppercase">Users & Members</div>
                </div>

                <div className="bg-surface/80 p-2.5 rounded-xl border border-divider/60 text-center">
                  <div className="text-base font-bold text-indigo-400 font-mono">{events.length}</div>
                  <div className="text-[9.5px] text-secondary font-medium uppercase">Events Hosted</div>
                </div>

                <div className="bg-surface/80 p-2.5 rounded-xl border border-divider/60 text-center">
                  <div className="text-base font-bold text-emerald-400 font-mono">{registrations.length}</div>
                  <div className="text-[9.5px] text-secondary font-medium uppercase">Registrations</div>
                </div>

                <div className="bg-surface/80 p-2.5 rounded-xl border border-divider/60 text-center">
                  <div className="text-base font-bold text-amber-400 font-mono">Full</div>
                  <div className="text-[9.5px] text-secondary font-medium uppercase">All Collections</div>
                </div>
              </div>
            </div>

            {/* Main Export Action Card */}
            <div className="bg-gradient-to-br from-indigo-500/10 via-surface to-surface rounded-2xl p-4.5 border border-indigo-500/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-display text-sm font-bold text-content flex items-center gap-1.5">
                    <FolderArchive className="w-4 h-4 text-indigo-400" />
                    <span>Complete System Archival JSON</span>
                  </h4>
                  <p className="text-secondary text-[11px] mt-1 leading-relaxed">
                    Generates a single comprehensive JSON package containing users, events, registrations, certificates, event winners, announcements, photo albums, notifications, and settings.
                  </p>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadFullBackup}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md shadow-indigo-600/30 active:scale-95 flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating Backup...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Complete System Backup (.json)</span>
                    </>
                  )}
                </button>

                {exportSuccess && (
                  <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Export saved to your device!</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick CSV Export Options */}
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                Individual Table Spreadsheets (CSV)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExportStudentsCSV}
                  className="p-3 rounded-xl bg-surface border border-divider hover:border-divider hover:bg-surface-accent text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-bold text-content text-xs">Students Directory</div>
                      <div className="text-[10px] text-secondary font-mono">Roll numbers, emails, sections</div>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-secondary" />
                </button>

                <button
                  type="button"
                  onClick={handleExportRegistrationsCSV}
                  className="p-3 rounded-xl bg-surface border border-divider hover:border-divider hover:bg-surface-accent text-left transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-bold text-content text-xs">Event Registrations</div>
                      <div className="text-[10px] text-secondary font-mono">Attendance & participation logs</div>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-secondary" />
                </button>
              </div>
            </div>

            {/* Next step prompt */}
            <div className="pt-2 border-t border-divider/60 flex items-center justify-between">
              <span className="text-[10.5px] text-secondary font-medium">Ready to start clean for the new academic year?</span>
              <button
                type="button"
                onClick={() => setActiveTab('reset')}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
              >
                Proceed to Reset →
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Reset Content */}
        {activeTab === 'reset' && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs">
            {resetCompleteSummary ? (
              <div className="py-6 text-center space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="font-display text-base font-bold text-content">Association Reset Successfully!</h4>
                  <p className="text-secondary text-xs leading-relaxed">
                    All previous student accounts, events, registrations, certificates, and photo records have been permanently wiped.
                  </p>
                </div>

                <div className="bg-surface-accent/60 border border-divider rounded-2xl p-4 max-w-sm mx-auto text-left space-y-1.5 font-mono text-[11px]">
                  <div className="text-indigo-400 font-bold border-b border-divider pb-1 mb-1">Clean Slate Summary:</div>
                  <div className="flex justify-between text-secondary">
                    <span>Events Cleared:</span>
                    <span className="text-content font-bold">{resetCompleteSummary.deletedCounts.events || 0}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Registrations Cleared:</span>
                    <span className="text-content font-bold">{resetCompleteSummary.deletedCounts.registrations || 0}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Certificates Cleared:</span>
                    <span className="text-content font-bold">{resetCompleteSummary.deletedCounts.certificates || 0}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Student Accounts Cleared:</span>
                    <span className="text-content font-bold">{resetCompleteSummary.deletedCounts.users || 0}</span>
                  </div>
                  <div className="flex justify-between text-secondary pt-1 border-t border-divider text-[10px]">
                    <span>Preserved Root Admin:</span>
                    <span className="text-emerald-400 font-bold truncate max-w-[140px]">{resetCompleteSummary.preservedAdmin?.email}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.location.reload();
                    }}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-600/30 active:scale-95"
                  >
                    Refresh App & Start New Academic Term
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Danger Notice Banner */}
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs font-display">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>DANGER ZONE: START NEW ASSOCIATION TERM</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    This irreversible operation clears all prior session records from Firestore:
                  </p>
                  <ul className="text-[10.5px] text-rose-300 list-disc list-inside space-y-0.5 font-mono">
                    <li>All Student, Coordinator & Associate accounts are cleared</li>
                    <li>All Events, Workshops & Hackathons are deleted</li>
                    <li>All Registration rosters & Attendance logs are deleted</li>
                    <li>All Issued E-Certificates & Wall of Champions records are cleared</li>
                    <li>All Photo albums, announcements & chats are cleared</li>
                  </ul>
                  <div className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                    🛡️ <strong>Safety Preservation:</strong> Your Administrator profile (<strong>{currentUser.email}</strong>) will be preserved as the active master administrator so you can immediately begin enrolling the new academic year's student body.
                  </div>
                </div>

                {/* Pre-reset backup check */}
                {!hasBackedUp && (
                  <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-[11px] text-amber-300 font-medium">Have you downloaded a backup of the current term?</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadFullBackup}
                      disabled={isExporting}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10.5px] font-bold cursor-pointer shrink-0"
                    >
                      {isExporting ? 'Exporting...' : 'Download Backup'}
                    </button>
                  </div>
                )}

                {/* Confirmation Step 1: Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface border border-divider cursor-pointer hover:bg-surface-accent transition-colors">
                  <input
                    type="checkbox"
                    checked={confirmCheckbox}
                    onChange={(e) => setConfirmCheckbox(e.target.checked)}
                    disabled={isResetting}
                    className="mt-0.5 rounded text-rose-500 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="text-[11px] text-content leading-tight">
                    <strong>I confirm that I want to wipe all past academic year data.</strong>
                    <div className="text-[10px] text-secondary mt-0.5">I understand that students, registrations, events, certificates, and media will be permanently erased.</div>
                  </div>
                </label>

                {/* Confirmation Step 2: Verification Phrase */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center justify-between">
                    <span>Type confirmation phrase to unlock:</span>
                    <span className="font-mono text-rose-400 font-bold select-all bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                      {CONFIRM_PHRASE}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    disabled={isResetting}
                    placeholder={`Type "${CONFIRM_PHRASE}" exactly...`}
                    className="w-full bg-background border border-divider text-xs text-content rounded-xl py-2 px-3 outline-none font-mono focus:border-rose-500/60 uppercase"
                  />
                </div>

                {/* Reset Progress Bar */}
                {isResetting && (
                  <div className="space-y-2 p-3 bg-surface rounded-xl border border-divider">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-secondary">{resetStage}</span>
                      <span className="text-rose-400 font-bold">{resetPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                        style={{ width: `${resetPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-divider/60">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isResetting}
                    className="px-4 py-2 rounded-xl bg-surface-accent hover:bg-divider text-content text-xs font-semibold cursor-pointer border border-divider transition-all"
                  >
                    Cancel
                  </button>

                  <HoldButton
                    size="md"
                    holdTime={2500}
                    radius={14}
                    backgroundColor="#18181b"
                    fillColor="#e11d48"
                    textColor="#ffffff"
                    fillTextColor="#ffffff"
                    doneLabel="Database Wiped"
                    disabled={isConfirmDisabled}
                    onHold={handleExecuteReset}
                    icon={isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    className="px-5 shadow-md shadow-rose-600/30 text-xs font-bold uppercase tracking-wider"
                  >
                    {isResetting ? 'Resetting Database...' : 'Hold to Wipe Everything & Reset'}
                  </HoldButton>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
