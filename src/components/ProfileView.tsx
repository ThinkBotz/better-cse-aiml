import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Code, Award, Edit, Save, X, Eye, Lock, 
  FileBadge, Calendar, Settings, ArrowRight, QrCode, 
  MessageSquare, Camera, Sparkles, Grid, CheckCircle2, Clock, MapPin,
  PhoneCall, Edit3, ShieldCheck, Users, Smartphone, RefreshCw, Copy, ExternalLink
} from 'lucide-react';
import { checkForAppUpdates } from '../pwaUpdateManager';
import { UserProfile, EventRegistration, DepartmentEvent, SupportInfo, DEFAULT_SUPPORT_INFO, CertificateTemplate, DEFAULT_CERTIFICATE_TEMPLATE, IssuedCertificate, AppBranding, DEFAULT_BRANDING } from '../types';
import CertificateCard from './CertificateCard';
import { 
  updateUserProfile,
  auth,
  subscribeToCertificates,
  generateCertificateId
} from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { CRAFTWORK_SPECIAL_DATA_URL } from '../lib/craftworkAvatar';
import { AvatarGalleryModal } from './AvatarGalleryModal';
import EditSupportBoxModal from './EditSupportBoxModal';
import CertificateRecipientsModal from './CertificateRecipientsModal';
import CertificateVerificationModal from './CertificateVerificationModal';

interface ProfileViewProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  registrations: EventRegistration[];
  events: DepartmentEvent[];
  allUsers: UserProfile[];
  onLogout: () => void;
  refreshUsers: () => void;
  onOpenAdminPanel: () => void;
  setActiveTab?: (tab: string) => void;
  supportInfo?: SupportInfo;
  onOpenSupportBox?: () => void;
  onOpenMembers?: () => void;
  onSupportInfoUpdated?: (info: SupportInfo) => void;
  isCertificatesEnabled?: boolean;
  certificateTemplate?: CertificateTemplate;
  branding?: AppBranding;
}


function EventTicketView({ event, registration, user, onClose, branding }: { event: DepartmentEvent, registration: EventRegistration, user: any, onClose: () => void, branding?: AppBranding }) {
  const newTicketNum = `${user?.rollNumber || 'TKT'}-${event.title.substring(0,3).toUpperCase()}-${registration.registrationId.substring(0,4).toUpperCase()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=000000&bgcolor=ffffff&data=${encodeURIComponent(user?.rollNumber?.toUpperCase() || registration.registrationId)}`;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4 pt-10">
      <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-content backdrop-blur-md cursor-pointer hover:bg-white/20 transition-colors z-10 border border-white/10">
         <X className="w-5 h-5" />
      </button>
      <div className="relative w-full max-w-[250px]">
         {/* Ticket Container */}
         <div className="w-full flex flex-col drop-shadow-2xl font-sans">
            {/* Top Section */}
            <div className="bg-[#F3F2EB] rounded-t-[28px] overflow-hidden relative">
               {/* Header */}
               <div className="bg-[#3D4329] px-5 py-4 flex justify-between items-center text-[#F3F2EB]">
                  <div className="flex items-center gap-2.5">
                     <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-[#F3F2EB]" />
                     </div>
                     <span className="font-bold tracking-widest text-[11px]">EVENT TICKET</span>
                  </div>
                  <span className="text-[9px] text-content/60 font-mono">#{newTicketNum}</span>
               </div>
               
               {/* Body */}
               <div className="p-3.5 flex gap-3">
                  <div className="w-[65px] h-[90px] flex-shrink-0 bg-neutral-200 rounded-xl overflow-hidden shadow-sm">
                     <img src={event.posterImage} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-start py-0.5">
                     <div>
                        <h2 className="text-[16px] font-bold text-[#111] leading-[1.1]">{event.title}</h2>
                        <p className="text-[9px] text-[#555] font-medium mt-1.5">{event.category}</p>
                     </div>
                     
                     <div className="space-y-1.5 mt-auto pb-1">
                        <div className="flex justify-between items-end">
                           <span className="text-[9px] text-[#777]">Date</span>
                           <span className="text-[11px] font-semibold text-[#111]">{event.date}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <span className="text-[9px] text-[#777]">Time</span>
                           <span className="text-[11px] font-semibold text-[#111]">{event.startTime} - {event.endTime}</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <span className="text-[9px] text-[#777]">Venue</span>
                           <span className="text-[11px] font-semibold text-[#111] truncate max-w-[80px] text-right">{event.venue}</span>
                        </div>
                        {registration.isTeam && (
                           <>
                              <div className="flex justify-between items-end mt-2">
                                 <span className="text-[9px] text-[#777]">Team Name</span>
                                 <span className="text-[11px] font-semibold text-[#111] truncate max-w-[80px] text-right">{registration.teamName}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                 <span className="text-[9px] text-[#777]">Team Size</span>
                                 <span className="text-[11px] font-semibold text-[#111]">{(registration.teamMembers?.length || 0) + 1} Members</span>
                              </div>
                           </>
                        )}
                     </div>
                  </div>
               </div>
               
               {/* Status */}
               <div className="px-3.5 pb-3.5">
                  <div className="border-t-[1.5px] border-dashed border-[#ccc] pt-3 flex items-center justify-between">
                     <div className="inline-flex items-center gap-1.5 bg-[#E3F5E7] text-[#307548] px-2.5 py-1.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-bold tracking-wide pr-1">Confirmed</span>
                     </div>
                     <span className="font-mono text-[9px] font-bold text-[#555] uppercase">{registration.rollNumber || ''}</span>
                  </div>
               </div>
               
               {/* Left Cutout */}
               <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-black/80 rounded-full"></div>
               {/* Right Cutout */}
               <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-black/80 rounded-full"></div>
            </div>
            
            {/* Tear Line Container */}
            <div className="h-6 bg-transparent flex items-center relative overflow-hidden -my-[1px]">
               {/* Dashed line */}
               <div className="w-full h-[0px] border-t-2 border-dashed border-[#C93F2B] absolute top-1/2 -translate-y-1/2"></div>
            </div>
            
            {/* Bottom Section */}
            <div className="bg-[#F3F2EB] rounded-b-[28px] overflow-hidden relative">
               {/* Left Cutout (Top) */}
               <div className="absolute -top-3 -left-3 w-6 h-6 bg-black/80 rounded-full"></div>
               {/* Right Cutout (Top) */}
               <div className="absolute -top-3 -right-3 w-6 h-6 bg-black/80 rounded-full"></div>
               
               <div className="p-3.5 flex gap-3 pt-5">
                  <div className="flex flex-col items-center">
                     <div className="w-[60px] h-[60px] bg-white p-1.5 rounded-xl border border-neutral-200">
                        <img src={qrUrl} alt="QR Code" className="w-full h-full object-cover mix-blend-multiply" />
                     </div>
                     <span className="text-[9px] text-[#777] font-mono mt-2.5 uppercase tracking-widest">{newTicketNum}</span>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-2 py-1">
                     <div>
                        <div className="flex items-center gap-1.5 text-[#777] mb-0.5">
                           <Clock className="w-3.5 h-3.5" />
                           <span className="text-[9px]">Time</span>
                        </div>
                        <div className="text-[11px] font-bold text-[#111] leading-tight">
                           {event.startTime}<br/>- {event.endTime}
                        </div>
                     </div>
                     <div>
                        <div className="flex items-center gap-1.5 text-[#777] mb-0.5">
                           <MapPin className="w-3.5 h-3.5" />
                           <span className="text-[9px]">Location</span>
                        </div>
                        <div className="text-[11px] font-bold text-[#111] leading-tight mt-1">
                           AITS Kadapa
                        </div>
                     </div>
                     <div>
                        <div className="flex items-center gap-1.5 text-[#777] mb-0.5">
                           <Calendar className="w-3.5 h-3.5" />
                           <span className="text-[9px]">Date</span>
                        </div>
                        <div className="text-[11px] font-bold text-[#111] leading-tight mt-1">
                           {event.date}
                        </div>
                     </div>

                  </div>
               </div>
               
               {/* Footer */}
               <div className="bg-[#EAE9E3] p-4 flex justify-between items-center mt-2">
                  <div className="flex items-center gap-2.5">
                     <div className="w-6 h-6 bg-[#2D3319] rounded-full flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-[#F3F2EB] rounded-full"></div>
                     </div>
                     <div>
                        <div className="text-[11px] font-bold text-[#111]">{branding?.appName || 'NOTX'} {branding?.tagline || 'Connect'}</div>
                        <div className="text-[8px] text-[#666] mt-0.5">Empowering Students, Building Futures</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-[9px] text-[#555] font-medium">Thank you!</div>
                     <div className="text-[9px] text-[#555] font-medium">See you at the event.</div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function ProfileView({ 
  user, 
  setUser, 
  registrations, 
  events, 
  allUsers,
  onLogout,
  refreshUsers,
  onOpenAdminPanel,
  setActiveTab,
  supportInfo,
  onOpenSupportBox,
  onOpenMembers,
  onSupportInfoUpdated,
  isCertificatesEnabled = true,
  certificateTemplate,
  branding = DEFAULT_BRANDING
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditSupportModalOpen, setIsEditSupportModalOpen] = useState(false);
  const [currentSupportInfo, setCurrentSupportInfo] = useState<SupportInfo>(supportInfo || DEFAULT_SUPPORT_INFO);

  React.useEffect(() => {
    if (supportInfo) {
      setCurrentSupportInfo(supportInfo);
    }
  }, [supportInfo]);

  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [year, setYear] = useState(user.year || '3rd Year');
  const [section, setSection] = useState(user.section || 'A');
  const [password, setPassword] = useState(user.password || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [skills, setSkills] = useState(user.skills || '');
  const [linkedin, setLinkedin] = useState(user.linkedin || '');
  const [responsibilities, setResponsibilities] = useState(memberResponsibilities());
  const [profilePic, setProfilePic] = useState(user.profile_pic || '');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );

  // Craftwork / Userpic preset avatars
  const seed = user.rollNumber || user.uid || 'notx';
  const craftworkUserpics = [
    { label: 'Craftwork Special', url: CRAFTWORK_SPECIAL_DATA_URL },
    { label: 'Notionist 1', url: `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}` },
    { label: 'Notionist 2', url: `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}-v2` },
    { label: 'Lorelei', url: `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}` },
    { label: 'Open Peeps', url: `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}` },
    { label: 'Avataaars', url: `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}` },
    { label: 'Adventurer', url: `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}` },
    { label: 'Micah', url: `https://api.dicebear.com/9.x/micah/svg?seed=${seed}` },
    { label: 'Personas', url: `https://api.dicebear.com/9.x/personas/svg?seed=${seed}` },
    { label: 'Bottts', url: `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}` },
    { label: 'Big Smile', url: `https://api.dicebear.com/9.x/big-smile/svg?seed=${seed}` },
    { label: 'Miniavs', url: `https://api.dicebear.com/9.x/miniavs/svg?seed=${seed}` },
  ];
  
  // Certificate view state & DB subscriptions
  const [activeCertEvent, setActiveCertEvent] = useState<DepartmentEvent | null>(null);
  const [dbCertificates, setDbCertificates] = useState<IssuedCertificate[]>([]);
  const [showPeersModal, setShowPeersModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyInitialId, setVerifyInitialId] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToCertificates((certs) => {
      setDbCertificates(certs);
    });
    return () => unsub();
  }, []);

  const [activeTicket, setActiveTicket] = useState<{event: DepartmentEvent, registration: EventRegistration} | null>(null);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  
  const handleLinkGoogle = async () => {
    setIsLinkingGoogle(true);
    try {
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleEmail = result.user.email;
      
      await updateUserProfile(user.uid, { googleEmail });
      
      alert("Successfully connected Google Account: " + googleEmail);
      if (onLogout) {
        // You might want to refresh the user profile in parent, or just show it directly
      }
    } catch (err: any) {
      if (err.code === 'auth/credential-already-in-use') {
        alert("This Google account is already linked to another user.");
      } else if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        alert("Failed to link Google account: " + err.message);
      }
      console.error("Google link error:", err);
    } finally {
      setIsLinkingGoogle(false);
    }
  };


  function memberResponsibilities() {
    if (user.role === 'admin') return user.responsibilities || 'Strategic oversight';
    if (user.role === 'associate') return user.responsibilities || 'Coordination and management';
    if (user.role === 'coordinator') return user.responsibilities || 'Event execution and coordination';
    return '';
  }

  const myRegs = registrations.filter(r => {
    if (r.studentId === user.uid) return true;
    if (user.rollNumber && r.rollNumber?.toLowerCase() === user.rollNumber.toLowerCase()) return true;
    if (user.rollNumber && r.teamMembers) {
      return r.teamMembers.some(m => m.rollNumber?.toLowerCase() === user.rollNumber?.toLowerCase() && m.status !== 'Declined');
    }
    return false;
  });
  const attendedRegs = myRegs.filter(r => r.status === 'Attended');

  // Find associated events for attended registrations
  const attendedEvents = events.filter(e => 
    attendedRegs.some(r => r.eventId === e.eventId)
  );

  const handleSave = async () => {
    try {
      const updates: Partial<UserProfile> = {
        name,
        email,
        phone,
        year,
        section,
        password,
        skills,
        linkedin,
        profile_pic: profilePic,
        ...(user.role !== 'student' ? { responsibilities } : {})
      };
      await updateUserProfile(user.uid, updates);
      
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      setIsEditing(false);
      refreshUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const defaultAvatar = `https://api.dicebear.com/9.x/notionists/svg?seed=${user.rollNumber || user.uid}`;
  const currentAvatar = isEditing ? (profilePic || defaultAvatar) : (user.profile_pic || defaultAvatar);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-36 sm:pb-32 space-y-4 bg-background">
      
      {/* Profile Core Header inspired by reference design */}
      <div className="relative rounded-[28px] bg-gradient-to-br from-[#230D1D] via-[#1C0917] to-[#140611] dark:from-[#230D1D] dark:via-[#1C0917] dark:to-[#140611] p-5 sm:p-6 border border-white/10 dark:border-rose-400/15 text-center overflow-hidden shadow-2xl shadow-rose-950/30">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-rose-500/15 via-pink-500/10 to-violet-500/15 blur-xl pointer-events-none"></div>
        <div className="relative pt-1 flex flex-col items-center">
          <button 
            type="button"
            onClick={() => setIsEditing(true)}
            className="relative group cursor-pointer"
            title="Click to edit profile & change avatar"
          >
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full p-[2px] bg-gradient-to-tr from-rose-500 via-pink-400 to-violet-500 shadow-xl shadow-rose-500/25">
              <img 
                src={currentAvatar} 
                alt={user.name} 
                className="w-full h-full rounded-full object-cover bg-[#1c0817] transition-transform group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
              <Camera className="w-5 h-5 text-white drop-shadow" />
            </div>
            <div className="absolute bottom-0 right-0 bg-rose-500 text-white p-1.5 rounded-full border-2 border-[#1c0817] shadow-md flex items-center justify-center">
              <Camera className="w-3 h-3" />
            </div>
          </button>

          <h3 className="text-lg sm:text-xl font-display font-extrabold text-white mt-3 tracking-tight">{user.name}</h3>
          
          <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
            <span className="text-[10px] font-sans font-extrabold text-rose-200 bg-rose-500/20 px-3 py-1 rounded-full border border-rose-400/30 uppercase tracking-wider">
              {user.role}
            </span>
            {user.rollNumber && (
              <span className="font-sans text-[10px] text-violet-200 font-bold bg-violet-500/20 px-3 py-1 rounded-full border border-violet-400/30">
                {user.rollNumber}
              </span>
            )}
          </div>
          <p className="text-xs text-rose-200/70 mt-1 font-sans">
            {user.role === 'student' ? `${user.branch} • ${user.year}` : user.position}
          </p>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onOpenMembers}
          className="ref-pill-secondary py-3 px-4 text-xs font-bold shadow-sm justify-center"
        >
          <Users className="w-4 h-4 text-rose-400" />
          <span>Members Directory</span>
        </button>
        <button 
          onClick={onOpenSupportBox}
          className="ref-pill-secondary py-3 px-4 text-xs font-bold shadow-sm justify-center"
        >
          <PhoneCall className="w-4 h-4 text-rose-400" />
          <span>Support Box</span>
        </button>
      </div>

      {/* EXECUTIVE COMMAND CENTER QUICK LINK */}
      {user.role !== 'student' && (
        <button 
          onClick={onOpenAdminPanel}
          className="w-full ref-pill-button py-3.5 px-5 text-xs font-bold tracking-wider shadow-lg shadow-rose-500/30 flex items-center justify-between gap-2 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="ref-icon-bubble w-7 h-7">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="block font-extrabold text-sm text-white">Executive Control Desk</span>
              <span className="block text-[9px] text-rose-200/80">Manage Roles, Assignments & Attendance</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-1" />
        </button>
      )}

      {/* Action Tabs (Edit/Save) */}
      <div className="flex justify-between items-center px-0.5">
        <h4 className="text-[9px] font-bold text-secondary tracking-wider uppercase font-mono">Contact & Core Specs</h4>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-[9px] text-indigo-300 hover:text-indigo-200 font-bold border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 rounded-lg cursor-pointer transition-colors"
          >
            <Edit className="w-3 h-3 text-indigo-400" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1 text-[9px] text-secondary hover:text-content font-semibold border border-divider bg-surface px-2.5 py-1 rounded-lg cursor-pointer"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-1 text-[9px] text-white font-bold bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-lg cursor-pointer transition-colors shadow-sm"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Editable Fields / Info card */}
      <div className="bg-surface p-3.5 rounded-2xl border border-divider/80 space-y-2.5 shadow-md">
        
        {/* Craftwork / Userpic Avatar Picker when Editing */}
        {isEditing && (
          <div className="pb-3 border-b border-divider space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Choose Avatar Model</span>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center gap-1 text-[9px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 rounded-lg transition-all shadow-md cursor-pointer"
              >
                <Grid className="w-3 h-3" />
                Browse 120+ Models
              </button>
            </div>
            
            <div className="grid grid-cols-6 gap-1.5 pt-1">
              {craftworkUserpics.map((pic) => {
                const isSelected = profilePic === pic.url || (!profilePic && pic.url === defaultAvatar);
                return (
                  <button
                    key={pic.label}
                    type="button"
                    onClick={() => setProfilePic(pic.url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border transition-all p-1 bg-surface cursor-pointer ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-105' : 'border-divider hover:border-divider'
                    }`}
                    title={pic.label}
                  >
                    <img src={pic.url} alt={pic.label} className="w-full h-full object-cover rounded-lg" />
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="text-[8px] font-bold text-secondary uppercase block mb-1">Custom Photo / Avatar URL</label>
                <input
                  type="text"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  placeholder="https://..."
                  className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2.5 py-1 text-xs text-content w-full outline-none font-mono"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="mt-4 px-2.5 py-1 bg-surface-accent hover:bg-divider border border-divider rounded-lg text-xs font-semibold text-primary hover:text-content flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Full Gallery
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 text-xs">
          <User className="w-4 h-4 text-tertiary flex-shrink-0" />
          <div className="flex-1">
            <div className="text-[9px] font-bold text-secondary uppercase">Full Name</div>
            {!isEditing ? (
              <div className="text-primary mt-0.5 text-[11px] font-medium">{user.name}</div>
            ) : (
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2 py-1 text-xs text-content mt-1 w-full outline-none"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs border-t border-divider/80 pt-2">
          <Mail className="w-4 h-4 text-tertiary flex-shrink-0" />
          <div className="flex-1">
            <div className="text-[9px] font-bold text-secondary uppercase">Email Address</div>
            {!isEditing ? (
              <div className="text-secondary mt-0.5 font-mono text-[11px]">{user.email}</div>
            ) : (
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2 py-1 text-xs text-content mt-1 w-full outline-none"
              />
            )}
          </div>
        </div>


        <div className="flex items-center gap-2.5 text-xs border-t border-divider/80 pt-2">
          <Lock className="w-4 h-4 text-tertiary flex-shrink-0" />
          <div className="flex-1">
            <div className="text-[9px] font-bold text-secondary uppercase">Access Password</div>
            {!isEditing ? (
              <div className="text-secondary mt-0.5 font-mono text-[11px] select-all">{user.password || '••••••••'}</div>
            ) : (
              <input 
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2 py-1 text-xs text-content mt-1 w-full outline-none font-mono"
                placeholder="Enter new password"
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5 text-xs border-t border-divider/80 pt-2">
          <Phone className="w-4 h-4 text-tertiary flex-shrink-0" />
          <div className="flex-1">
            <div className="text-[9px] font-bold text-secondary uppercase">Phone Number</div>
            {!isEditing ? (
              <div className="text-secondary mt-0.5 font-mono text-[11px]">{user.phone || 'Not added'}</div>
            ) : (
              <input 
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2 py-1 text-xs text-content mt-1 w-full outline-none"
              />
            )}
          </div>
        </div>

        {true && (
          <div className="grid grid-cols-2 gap-2 border-t border-divider/80 pt-2">
            <div className="text-xs">
              <div className="text-[9px] font-bold text-secondary uppercase">Year</div>
              {!isEditing ? (
                <div className="text-primary mt-0.5 text-[11px] font-mono">{user.year || '3rd Year'}</div>
              ) : (
                <select 
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2 py-1 text-xs text-content mt-1 w-full outline-none"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              )}
            </div>
            <div className="text-xs">
              <div className="text-[9px] font-bold text-secondary uppercase">Section</div>
              {!isEditing ? (
                <div className="text-primary mt-0.5 text-[11px] font-mono">{user.section || 'A'}</div>
              ) : (
                <input 
                  type="text"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2 py-1 text-xs text-content mt-1 w-full outline-none"
                />
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5 text-xs border-t border-divider/80 pt-2">
          <Calendar className="w-4 h-4 text-tertiary flex-shrink-0" />
          <div className="flex-1">
            <div className="text-[9px] font-bold text-secondary uppercase">Account Password</div>
            {!isEditing ? (
              <div className="text-tertiary mt-0.5 font-mono text-[11px]">••••••••</div>
            ) : (
              <input 
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set password"
                className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2 py-1 text-xs text-content mt-1 w-full outline-none font-mono"
              />
            )}
          </div>
        </div>

        {user.role === 'student' ? (
          <div className="flex items-center gap-2.5 text-xs border-t border-divider/80 pt-2">
            <Code className="w-4 h-4 text-tertiary flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[9px] font-bold text-secondary uppercase">Technical Skills</div>
              {!isEditing ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(user.skills || 'Add skills...').split(',').map((skill, i) => (
                    <span key={i} className="text-[9px] bg-surface-accent text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/20">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <input 
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. Python, ML, React"
                  className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2 py-1 text-xs text-content mt-1 w-full outline-none"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-xs border-t border-divider/80 pt-2">
            <Award className="w-4 h-4 text-tertiary flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[9px] font-bold text-secondary uppercase">Executive Role & Responsibilities</div>
              {!isEditing ? (
                <div className="text-primary mt-0.5 leading-relaxed text-[11px]">{user.responsibilities || 'Coordination'}</div>
              ) : (
                <textarea 
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  className="bg-background border border-divider focus:border-indigo-500/50 rounded px-2 py-1 text-xs text-content mt-1 w-full resize-none h-16 outline-none"
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* DIGITAL CHECK-IN PASS (QR CODE) */}
      {user.role !== 'admin' && user.rollNumber && (
        <div className="bg-surface p-4 rounded-2xl border border-divider/80 space-y-2.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-divider pb-2">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-violet-400" />
              <span className="text-[9px] font-bold text-primary uppercase tracking-wider font-mono">Digital Pass</span>
            </div>
            <span className="text-[8px] font-mono font-bold text-violet-300 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">
              Verified ID
            </span>
          </div>
          
          <div className="flex flex-col items-center py-2 space-y-2">
            <div className="relative p-2 bg-background border border-divider rounded-xl shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=ffffff&bgcolor=080C14&data=${encodeURIComponent(user.rollNumber.toUpperCase())}`} 
                alt="Student Registration QR Code" 
                className="w-28 h-28 select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="text-center">
              <h5 className="text-[11px] font-bold text-content tracking-tight">{user.name}</h5>
              <p className="font-mono text-[9px] text-secondary mt-0.5 uppercase">{user.rollNumber} • {user.year} ({user.section})</p>
              <p className="text-[8px] text-violet-400 mt-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-2.5 py-0.5 inline-block">
                Present this QR code for instant event check-in
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REGISTERED EVENTS STATUS TRACKER */}
      <div className="space-y-2">
        <h4 className="text-[9px] font-bold text-secondary tracking-wider uppercase border-b border-divider pb-1.5 font-mono">My Registered events ({myRegs.length})</h4>
        {myRegs.length === 0 ? (
          <div className="bg-surface border border-divider/80 rounded-2xl p-5 text-center text-[11px] text-secondary font-medium">
            You haven't registered for any departmental event yet.
          </div>
        ) : (
          <div className="space-y-1.5">
            {myRegs.map((reg) => {
              const ev = events.find(e => e.eventId === reg.eventId);
              if (!ev) return null;
              return (
                <div key={reg.registrationId} onClick={() => setActiveTicket({ event: ev, registration: reg })} className="bg-surface p-2.5 rounded-xl border border-divider/80 flex justify-between items-center gap-2.5 cursor-pointer hover:bg-surface-accent/40 transition-colors">
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-primary truncate">{ev.title}</h5>
                    <p className="font-mono text-[9px] text-secondary mt-0.5">{ev.date} • {ev.venue.split(',')[0]}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md font-mono ${
                    reg.status === 'Attended' 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                      : reg.status === 'Absent' 
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                  }`}>
                    {reg.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIGITAL E-CERTIFICATES LOG */}
      {user.role === 'student' && (
        <div className="space-y-3">
          {(() => {
            const certsWithStatus = attendedEvents.map((ev) => {
              const userCert = dbCertificates.find(c => 
                c.eventId === ev.eventId && 
                (c.studentId === user.uid || (user.rollNumber && c.rollNumber.toUpperCase() === user.rollNumber.toUpperCase()))
              );
              const isUnlocked = Boolean(userCert && userCert.status !== 'Revoked');
              const certId = userCert?.certificateId || '';
              const peersCount = dbCertificates.filter(c => c.eventId === ev.eventId).length;
              return { ev, userCert, isUnlocked, certId, peersCount };
            });

            const unlockedCerts = certsWithStatus.filter(c => c.isUnlocked);
            const lockedCerts = certsWithStatus.filter(c => !c.isUnlocked);

            return (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-divider pb-2 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-[10px] font-bold text-secondary tracking-wider uppercase font-mono flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Certificates ({unlockedCerts.length} Issued</span>
                      {lockedCerts.length > 0 && (
                        <span className="text-amber-400">• {lockedCerts.length} Locked</span>
                      )}
                      <span>)</span>
                    </h4>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyInitialId('');
                        setShowVerifyModal(true);
                      }}
                      className="text-[9px] font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
                      title="Verify any Certificate ID in institutional registry"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verify ID</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] font-mono">
                    <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      🟢 {unlockedCerts.length} Unlocked
                    </span>
                    {lockedCerts.length > 0 && (
                      <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                        🔒 {lockedCerts.length} Awaiting Admin Batch
                      </span>
                    )}
                    {!isCertificatesEnabled && (
                      <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        Feature Paused
                      </span>
                    )}
                  </div>
                </div>

                {!isCertificatesEnabled ? (
                  <div className="bg-surface border border-divider/80 rounded-2xl p-4 text-center text-xs text-secondary font-medium flex flex-col items-center gap-1.5 shadow-sm">
                    <FileBadge className="w-5 h-5 text-amber-400/80 mb-0.5" />
                    <span className="text-content font-bold text-xs">E-Certificates Temporarily Paused</span>
                    <p className="text-[10px] text-secondary max-w-xs">
                      The department administration has temporarily paused certificate viewing. Please check back soon.
                    </p>
                  </div>
                ) : attendedEvents.length === 0 ? (
                  <div className="bg-surface border border-divider/80 rounded-2xl p-5 text-center text-[11px] text-secondary font-medium flex flex-col items-center gap-1">
                    <FileBadge className="w-6 h-6 text-secondary mb-1" />
                    <span>Certificates are issued post attending events and admin authorization.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {certsWithStatus.map(({ ev, userCert, isUnlocked, certId, peersCount }) => {
                      if (!isUnlocked) {
                        // LOCKED STATE: Waiting for Admin batch release
                        return (
                          <div 
                            key={ev.eventId} 
                            className="bg-surface/80 border border-amber-500/20 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500/60" />

                            <div className="flex items-start gap-2.5 min-w-0 pl-1">
                              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/25 text-amber-400 shrink-0 mt-0.5">
                                <Lock className="w-4 h-4" />
                              </div>

                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="text-xs font-bold text-primary truncate font-display">{ev.title}</h5>
                                  <span className="text-[8.5px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" />
                                    <span>Locked</span>
                                  </span>
                                  <span className="text-[8.5px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                    Attended
                                  </span>
                                </div>

                                <p className="text-[10px] text-secondary leading-snug">
                                  Attendance verified. Waiting for department administration to generate the certificate batch.
                                </p>

                                <div className="text-[9px] text-tertiary">
                                  Event Date: {ev.date} • Venue: {ev.venue || 'Campus Auditorium'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              <button
                                disabled
                                title="The administrator must generate the certificate batch for this event before it can be viewed"
                                className="px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700/80 text-neutral-400 text-[10px] font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
                              >
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>Awaiting Admin Batch</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // UNLOCKED STATE: Officially generated by Admin in database
                      return (
                        <div 
                          key={ev.eventId} 
                          className="bg-surface hover:bg-surface-accent/80 p-3 rounded-2xl border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:border-emerald-500/40 shadow-xs relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500/70" />

                          <div className="flex items-start gap-2.5 min-w-0 pl-1">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/25 text-emerald-400 shrink-0 mt-0.5">
                              <FileBadge className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <h5 className="text-xs font-bold text-primary truncate font-display">{ev.title}</h5>
                                <span className="text-[8.5px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/25 flex items-center gap-1">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  <span>Official</span>
                                </span>
                              </div>
                              
                              {/* Certificate ID Pill */}
                              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(certId);
                                    setCopiedId(certId);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8.5px] font-mono font-bold bg-neutral-900 border border-neutral-700 hover:border-emerald-500/40 text-neutral-200 cursor-pointer transition-all active:scale-95"
                                  title="Click to copy Certificate ID"
                                >
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>ID: {certId}</span>
                                  {copiedId === certId ? (
                                    <span className="text-emerald-400 text-[8px] font-bold">Copied!</span>
                                  ) : (
                                    <Copy className="w-2 h-2 text-secondary" />
                                  )}
                                </button>

                                <span className="text-[9px] text-secondary">
                                  Date: {ev.date}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                            <button 
                              onClick={() => {
                                setActiveCertEvent(ev);
                                setShowPeersModal(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-surface-accent hover:bg-divider text-content text-[10px] font-semibold border border-divider transition-all cursor-pointer active:scale-95"
                              title="See who else got this certificate"
                            >
                              <Users className="w-3 h-3 text-indigo-400" />
                              <span>Recipients</span>
                              {peersCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[8px] font-bold">
                                  {peersCount}
                                </span>
                              )}
                            </button>

                            <button 
                              onClick={() => setActiveCertEvent(ev)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-xs"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      
      {/* DYNAMIC DEPARTMENT SUPPORT BOX */}
      <div className="bg-surface p-4 rounded-2xl border border-divider/80 space-y-3 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-divider pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-content font-display tracking-tight flex items-center gap-1.5">
                {currentSupportInfo.title || "Help & Support Desk"}
              </h4>
              <span className="text-[9px] font-mono text-indigo-400 font-semibold">
                {currentSupportInfo.badge || "OFFICIAL CHANNELS"}
              </span>
            </div>
          </div>

          {user.role === 'admin' && (
            <button
              onClick={() => setIsEditSupportModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 text-[10px] font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Admin: Edit dynamic Support Box details"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit Box</span>
            </button>
          )}
        </div>

        {currentSupportInfo.subtitle && (
          <p className="text-[11px] text-secondary leading-relaxed">
            {currentSupportInfo.subtitle}
          </p>
        )}

        {/* Contact channels grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          <a 
            href={`mailto:${currentSupportInfo.email}`}
            className="bg-surface-accent/50 hover:bg-surface-accent p-2.5 rounded-xl border border-divider/60 flex items-center gap-2.5 transition-colors group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-semibold text-secondary uppercase font-mono">Email Support</div>
              <div className="text-[11px] text-indigo-300 font-mono font-medium truncate group-hover:underline">
                {currentSupportInfo.email}
              </div>
            </div>
          </a>

          <a 
            href={`tel:${currentSupportInfo.phone.replace(/\s+/g, '')}`}
            className="bg-surface-accent/50 hover:bg-surface-accent p-2.5 rounded-xl border border-divider/60 flex items-center gap-2.5 transition-colors group cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] font-semibold text-secondary uppercase font-mono">Hotline</div>
              <div className="text-[11px] text-indigo-300 font-mono font-medium truncate group-hover:underline">
                {currentSupportInfo.phone}
              </div>
            </div>
          </a>
        </div>

        {(currentSupportInfo.location || currentSupportInfo.timing) && (
          <div className="bg-background/60 p-2.5 rounded-xl border border-divider/50 flex items-center gap-2 text-[10px] text-secondary">
            <MapPin className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="truncate">
              {currentSupportInfo.location}
              {currentSupportInfo.timing ? ` • ${currentSupportInfo.timing}` : ''}
            </span>
          </div>
        )}

        {/* Button to open full query desk modal */}
        <button
          onClick={() => onOpenSupportBox ? onOpenSupportBox() : null}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-accent hover:bg-surface-accent/80 text-content border border-divider text-[11px] font-semibold transition-all cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          <span>Open Full Support Desk & Submit Ticket</span>
          <ArrowRight className="w-3 h-3 text-secondary ml-1" />
        </button>
      </div>

      {/* GOOGLE ACCOUNT LINKING */}
      {true && (
        <div className="bg-surface p-4 rounded-2xl border border-divider/80 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between border-b border-divider pb-2">
            <h4 className="text-[9px] font-bold text-secondary tracking-wider uppercase font-mono">Connected Accounts</h4>
          </div>
          <div className="pt-1">
            {user.googleEmail ? (
              <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <div className="overflow-hidden">
                  <p className="text-[9px] text-secondary font-bold uppercase">Google Connected</p>
                  <p className="text-xs text-content truncate">{user.googleEmail}</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLinkGoogle}
                disabled={isLinkingGoogle}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-xl py-2.5 transition-all cursor-pointer"
              >
                {isLinkingGoogle ? (
                  <span className="w-4 h-4 rounded-full border-2 border-neutral-400 border-t-black animate-spin"></span>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    Connect Google Account
                  </>
                )}
              </button>
            )}
            <p className="text-[9px] text-tertiary mt-2 text-center">
              Link your Google account to enable easy sign-in.
            </p>
          </div>
        </div>
      )}

      {/* PWA & AUTO-UPDATE STATUS CARD */}
      <div className="bg-surface/70 border border-divider/80 rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-content font-display">PWA & APK Auto-Sync</span>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Active
                </span>
              </div>
              <p className="text-[10px] text-secondary truncate mt-0.5">
                {isStandalone ? 'Installed as Standalone App (Home Screen / APK)' : 'Running in Web Browser'}
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              setIsCheckingUpdate(true);
              setUpdateMessage(null);
              const res = await checkForAppUpdates();
              setIsCheckingUpdate(false);
              setUpdateMessage(res.message);
            }}
            disabled={isCheckingUpdate}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            Check
          </button>
        </div>

        {updateMessage && (
          <div className="text-[10px] text-content bg-surface-accent border border-divider/80 rounded-lg p-2 text-center animate-in fade-in duration-200">
            {updateMessage}
          </div>
        )}

        <div className="text-[9.5px] text-tertiary leading-relaxed border-t border-divider/60 pt-2.5 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-secondary font-medium">Automatic Live Updates:</strong> When updates are published on the website, this installed app (iOS Home Screen & Android PWA APK) automatically syncs new changes upon opening. No need to reinstall the APK or re-add the app to your home screen!
          </span>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <button 
        onClick={onLogout}
        className="w-full bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 hover:text-rose-300 font-bold text-xs uppercase tracking-wider rounded-xl py-2.5 border border-rose-500/20 shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
      >
        Sign Out Securely
      </button>

      {/* DIGITAL CERTIFICATE FULL SCREEN LIGHTBOX */}
      {activeCertEvent && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xs z-50 flex flex-col justify-center items-center p-4 select-none">
          <div className="w-full max-w-lg flex flex-col justify-between max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => setActiveCertEvent(null)}
                className="w-8 h-8 rounded-full bg-surface-accent flex items-center justify-center text-secondary hover:text-content border border-divider cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Digital Certificate */}
            <div className="w-full">
              {(() => {
                const userCert = dbCertificates.find(c => 
                  c.eventId === activeCertEvent.eventId && 
                  (c.studentId === user.uid || (user.rollNumber && c.rollNumber.toUpperCase() === user.rollNumber.toUpperCase()))
                );

                if (!userCert || userCert.status === 'Revoked') {
                  return (
                    <div className="bg-surface border border-amber-500/20 rounded-2xl p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-content font-display">Certificate is Locked</h4>
                      <p className="text-xs text-secondary max-w-sm mx-auto leading-relaxed">
                        The department administrator has not generated the batch certificates for <strong>{activeCertEvent.title}</strong> yet.
                        Certificates are authorized in batches by the administrator after verifying attendance.
                      </p>
                      <button
                        onClick={() => setActiveCertEvent(null)}
                        className="px-4 py-2 rounded-xl bg-surface-accent hover:bg-divider text-content text-xs font-bold border border-divider cursor-pointer transition-all"
                      >
                        Close
                      </button>
                    </div>
                  );
                }

                const certId = userCert.certificateId;
                const peersCount = dbCertificates.filter(c => c.eventId === activeCertEvent.eventId).length;

                return (
                  <div className="space-y-3">
                    <CertificateCard 
                      template={certificateTemplate || DEFAULT_CERTIFICATE_TEMPLATE}
                      studentName={user.name}
                      rollNumber={user.rollNumber || ''}
                      event={activeCertEvent}
                      certificateId={certId}
                      issueDate={userCert.issueDate || activeCertEvent.date}
                      onViewPeers={() => setShowPeersModal(true)}
                      peersCount={peersCount}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <button 
                        onClick={() => setShowPeersModal(true)}
                        className="w-full bg-surface-accent hover:bg-divider border border-divider text-content font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>See Who Else Got This</span>
                        {peersCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[9px]">
                            {peersCount}
                          </span>
                        )}
                      </button>

                      <button 
                        onClick={() => {
                          setVerifyInitialId(certId);
                          setShowVerifyModal(true);
                        }}
                        className="w-full bg-surface-accent hover:bg-divider border border-divider text-content font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verify Credential ID</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => window.print()}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
                    >
                      Download / Print PDF Certificate
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Recipients (Who Else Got This) Modal */}
      {showPeersModal && activeCertEvent && (
        <CertificateRecipientsModal
          isOpen={showPeersModal}
          onClose={() => setShowPeersModal(false)}
          eventTitle={activeCertEvent.title}
          eventDate={activeCertEvent.date}
          eventVenue={activeCertEvent.venue}
          certificates={dbCertificates.filter(c => c.eventId === activeCertEvent.eventId)}
          template={certificateTemplate || DEFAULT_CERTIFICATE_TEMPLATE}
        />
      )}

      {/* Certificate Verification Modal */}
      <CertificateVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        initialId={verifyInitialId}
        template={certificateTemplate || DEFAULT_CERTIFICATE_TEMPLATE}
      />

      {/* Avatar Gallery Modal */}
      <AvatarGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectAvatar={(url) => setProfilePic(url)}
        currentUrl={profilePic || defaultAvatar}
        userSeed={seed}
      />

      {activeTicket && (
        <EventTicketView
          event={activeTicket.event}
          registration={activeTicket.registration}
          user={user}
          onClose={() => setActiveTicket(null)}
          branding={branding}
        />
      )}

      {/* Edit Support Box Modal (Admin only) */}
      {user.role === 'admin' && (
        <EditSupportBoxModal
          isOpen={isEditSupportModalOpen}
          onClose={() => setIsEditSupportModalOpen(false)}
          currentInfo={currentSupportInfo}
          onSaved={(updated) => {
            setCurrentSupportInfo(updated);
            if (onSupportInfoUpdated) {
              onSupportInfoUpdated(updated);
            }
          }}
        />
      )}
    </div>
  );
}
