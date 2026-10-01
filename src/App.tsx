import React, { useState, useEffect } from 'react';
import { 
  Home as HomeIcon, 
  Calendar, 
  Image as GalleryIcon, 
  Volume2, 
  User as UserIcon, 
  Bell, 
  Sparkles, 
  Users, 
  PhoneCall, 
  HelpCircle,
  Loader2,
  Cpu,
  MessageSquare, RefreshCw, AlertTriangle, X
} from 'lucide-react';

import { onSnapshot, collection, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, DepartmentEvent, EventRegistration, Album, Announcement, UserInvitation, ChatRoom, AppConfig, SupportInfo, DEFAULT_SUPPORT_INFO, AppBranding, DEFAULT_BRANDING } from './types';
import BrandLogo, { ACCENT_THEMES, getCssAccent, getCssAccentFg } from './components/BrandLogo';
import { 
  fetchUsers, 
  fetchEvents, 
  fetchRegistrations, 
  fetchAlbums, 
  fetchAnnouncements, 
  fetchReceivedInvitations,
  getAppConfig,
  seedDatabaseIfEmpty,
  cleanupOrphanedData
} from './firebase';

// Views
import DashboardView from './components/DashboardView';

// Optimized Lazy-Loaded Views for Code-Splitting
const LoginView = React.lazy(() => import('./components/LoginView'));
const FirstTimeSetupView = React.lazy(() => import('./components/FirstTimeSetupView'));
const EventsView = React.lazy(() => import('./components/EventsView'));
const GalleryView = React.lazy(() => import('./components/GalleryView'));
const AnnouncementsView = React.lazy(() => import('./components/AnnouncementsView'));
const ProfileView = React.lazy(() => import('./components/ProfileView'));
const AdminPanelView = React.lazy(() => import('./components/AdminPanelView'));
const MembersView = React.lazy(() => import('./components/MembersView'));
const ContactView = React.lazy(() => import('./components/ContactView'));
const MessagesView = React.lazy(() => import('./components/MessagesView'));

const ViewLoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[280px] gap-3">
    <Loader2 className="w-6 h-6 text-[var(--nb-accent)] animate-spin" />
    <span className="nb-label">Loading…</span>
  </div>
);

import { PWAInstallButton } from './components/PWAInstallButton';
import { PWAUpdateToast } from './components/PWAUpdateToast';
import FloatingDockNav from './components/FloatingDockNav';

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="nb-offline-bar flex items-center justify-center gap-1.5">
      <AlertTriangle className="w-3.5 h-3.5" />
      <span>Offline Mode Active</span>
    </div>
  );
};

export default function App() {
  const isOnline = useOnlineStatus();
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#F5F0EB');
    }
  }, []);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const storedUser = localStorage.getItem('notx_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as UserProfile;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('notx_active_tab') || 'home';
  });

  useEffect(() => {
    localStorage.setItem('notx_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('notx_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('notx_user');
    }
  }, [currentUser]);

  // Automatic database seeding on fresh project
  useEffect(() => {
    seedDatabaseIfEmpty().catch(err => console.error("Database seeding check:", err));
  }, []);

  // Firestore States
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<DepartmentEvent[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<UserInvitation[]>([]);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  
  // App states
  const [isBooting, setIsBooting] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<DepartmentEvent | null>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [messageTargetRoll, setMessageTargetRoll] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig>({ 
    isChatEnabled: true,
    supportInfo: DEFAULT_SUPPORT_INFO,
    branding: DEFAULT_BRANDING
  });

  const currentBranding = appConfig.branding || DEFAULT_BRANDING;
  const currentTheme = ACCENT_THEMES[currentBranding.accentColor || 'indigo'] || ACCENT_THEMES.indigo;

  // Inject --nb-accent CSS variable whenever branding changes so all
  // nb-* utility classes and inline var() references pick up the brand colour.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nb-accent', getCssAccent(currentBranding.accentColor));
    root.style.setProperty('--nb-accent-fg', getCssAccentFg(currentBranding.accentColor));
  }, [currentBranding.accentColor]);

  // Keep app config, branding, and support info synchronized in real-time across all devices
  useEffect(() => {
    const unsubscribeConfig = onSnapshot(doc(db, 'appSettings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppConfig;
        if (!data.supportInfo) {
          data.supportInfo = DEFAULT_SUPPORT_INFO;
        }
        if (!data.branding) {
          data.branding = DEFAULT_BRANDING;
        }
        setAppConfig(data);
      }
    }, (error) => {
      console.error("Realtime config sync error:", error);
    });

    return () => unsubscribeConfig();
  }, []);

  // Dynamically update document title and favicon based on admin branding
  useEffect(() => {
    const brandName = currentBranding.appName || 'NOTX';
    const tag = currentBranding.tagline ? ` ${currentBranding.tagline}` : ' Connect';
    const subtitle = currentBranding.subtitle ? ` • ${currentBranding.subtitle}` : '';
    document.title = `${brandName}${tag}${subtitle}`;

    // Update favicon if custom logo image exists
    if (currentBranding.logoType === 'custom' && currentBranding.logoImageUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = currentBranding.logoImageUrl;
    }
  }, [currentBranding]);

  // Initialize and Seed Database
  useEffect(() => {
    async function initializeApp() {
      try {
        setIsDataLoading(true);
        // Clean up any legacy orphaned records from previously deleted events
        await cleanupOrphanedData().catch(err => console.error("Initial orphan cleanup error:", err));
        // Fetch all elements
        await refreshAllData();
      } catch (err) {
        console.error("Initialization failed: ", err);
      } finally {
        setIsDataLoading(false);
        setIsBooting(false);
      }
    }
    initializeApp();
  }, []);

  const lastRefreshTimeRef = React.useRef<number>(Date.now());

  // Throttled refresh on tab navigation to prevent redundant Firestore queries
  useEffect(() => {
    if (currentUser && !isBooting) {
      const now = Date.now();
      if (now - lastRefreshTimeRef.current > 45000) {
        lastRefreshTimeRef.current = now;
        refreshAllData();
      }
    }
  }, [activeTab]);

  // Keep users synchronized in real-time across all devices
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as UserProfile);
      });
      if (users.length > 0) {
        setAllUsers(users);
      }

      if (currentUser) {
        const freshUser = users.find(u => u.uid === currentUser.uid);
        if (freshUser) {
          setCurrentUser(freshUser);
          localStorage.setItem('notx_user', JSON.stringify(freshUser));
        }
      }
    }, (error) => {
      console.error("Realtime users sync error:", error);
    });

    return () => unsubscribeUsers();
  }, [currentUser?.uid]);

  // Keep registrations & attendance synchronized in real-time across all devices
  useEffect(() => {
    const unsubscribeRegistrations = onSnapshot(collection(db, 'registrations'), (snapshot) => {
      const regs: EventRegistration[] = [];
      snapshot.forEach((docSnap) => {
        regs.push(docSnap.data() as EventRegistration);
      });
      setRegistrations(regs);
    }, (error) => {
      console.error("Realtime registrations sync error:", error);
    });

    return () => unsubscribeRegistrations();
  }, []);

  // Keep events synchronized in real-time across all devices
  useEffect(() => {
    const unsubscribeEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      const evs: DepartmentEvent[] = [];
      snapshot.forEach((docSnap) => {
        evs.push(docSnap.data() as DepartmentEvent);
      });
      evs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setEvents(evs);
    }, (error) => {
      console.error("Realtime events sync error:", error);
    });

    return () => unsubscribeEvents();
  }, []);

  // Keep announcements synchronized in real-time across all devices
  useEffect(() => {
    const unsubscribeAnnouncements = onSnapshot(collection(db, 'announcements'), (snapshot) => {
      const items: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as Announcement);
      });
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAnnouncements(items);
    }, (error) => {
      console.error("Realtime announcements sync error:", error);
    });

    return () => unsubscribeAnnouncements();
  }, []);

  // Keep team invitations synchronized in real-time
  useEffect(() => {
    if (!currentUser?.rollNumber) return;
    const qInvites = query(
      collection(db, 'invitations'),
      where('recipientRoll', '==', currentUser.rollNumber.trim().toUpperCase())
    );

    const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
      const list: UserInvitation[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as UserInvitation);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setReceivedInvitations(list);
    }, (error) => {
      console.error("Realtime invitations sync error:", error);
    });

    return () => unsubscribeInvites();
  }, [currentUser?.rollNumber]);

  useEffect(() => {
    if (!currentUser?.rollNumber) return;
    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.rollNumber.trim().toUpperCase())
    );

    const unsubscribe = onSnapshot(qChats, (snapshot) => {
      let unread = 0;
      const userRoll = currentUser.rollNumber!.trim().toUpperCase();
      snapshot.forEach((docSnap) => {
        const room = docSnap.data() as ChatRoom;
        if (room.messages) {
          const hasUnread = room.messages.some(m => m.recipientRoll.toUpperCase() === userRoll && m.type === 'chat' && !m.isRead);
          if (hasUnread) {
            // Count all unread messages in this room instead of just marking the room as having unread
            const roomUnreadCount = room.messages.filter(m => m.recipientRoll.toUpperCase() === userRoll && m.type === 'chat' && !m.isRead).length;
            unread += roomUnreadCount;
          }
        }
      });
      setUnreadChatsCount(unread);
    });
    return () => unsubscribe();
  }, [currentUser?.rollNumber]);

  const refreshAllData = async () => {
    try {
      setIsDataLoading(true);
      
      const invitesPromise = (currentUser && currentUser.rollNumber) 
        ? fetchReceivedInvitations(currentUser.rollNumber) 
        : Promise.resolve([]);

      const [u, e, r, g, a, invites, config] = await Promise.all([
        fetchUsers(),
        fetchEvents(),
        fetchRegistrations(),
        fetchAlbums(),
        fetchAnnouncements(),
        invitesPromise,
        getAppConfig()
      ]);
      setAllUsers(u);
      setEvents(e);
      setRegistrations(r);
      setAlbums(g);
      setAnnouncements(a);
      setReceivedInvitations(invites || []);
      setAppConfig(config);

      // If currentUser is logged in, refresh their profile state as well
      if (currentUser) {
        const freshUser = u.find(user => user.uid === currentUser.uid);
        if (freshUser) {
          setCurrentUser(freshUser);
          localStorage.setItem('notx_user', JSON.stringify(freshUser));
        }
      }
    } catch (err) {
      console.error("Data refresh failed: ", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('notx_user', JSON.stringify(user));
    setActiveTab('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('notx_user');
    localStorage.removeItem('notx_active_tab');
    setActiveTab('home');
  };

  const selectEventFromDashboard = (event: DepartmentEvent) => {
    setSelectedEvent(event);
    setActiveTab('events');
  };

  if (isBooting && !currentUser) {
    return (
      <div className="h-full w-full bg-[var(--nb-bg)] flex flex-col items-center justify-center p-6 text-center select-none">
        {/* Brand badge */}
        <BrandLogo branding={currentBranding} size="xl" className="mb-6" />

        <h2 className="nb-headline text-3xl text-[var(--nb-content)]">
          {currentBranding.appName || 'NOTX'}
        </h2>
        <p className="nb-label mt-1" style={{ color: 'var(--nb-tertiary)' }}>
          {currentBranding.tagline || 'Connect'}
          {currentBranding.subtitle ? ` · ${currentBranding.subtitle}` : ''}
        </p>

        {/* Loading row */}
        <div className="mt-8 flex items-center gap-2 px-4 py-2 border border-[var(--nb-divider)] rounded-md bg-[var(--nb-surface)]">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--nb-accent)' }} />
          <span className="nb-label" style={{ color: 'var(--nb-secondary)' }}>Syncing Cloud Services</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <PWAUpdateToast />
      {!currentUser ? (
        <React.Suspense fallback={<ViewLoadingFallback />}>
          <LoginView 
            branding={currentBranding}
            onLoginSuccess={handleLoginSuccess} 
            allUsers={allUsers}
            refreshUsers={refreshAllData}
          />
        </React.Suspense>
      ) : currentUser.isFirstLogin ? (
        <React.Suspense fallback={<ViewLoadingFallback />}>
          <FirstTimeSetupView 
            user={currentUser} 
            onComplete={(updatedUser) => setCurrentUser(updatedUser)} 
          />
        </React.Suspense>
      ) : (
        /* Authenticated Application shell */
        <div className="h-full w-full flex flex-col bg-[var(--nb-bg)] text-[var(--nb-content)] overflow-hidden">

          {/* ── Top Header ── flat, no blur, 2px ink border-bottom */}
          <header
            className="bg-[var(--nb-surface)] border-b-2 border-[var(--nb-ink)] px-4 sm:px-6 flex justify-center items-center flex-shrink-0 z-40 select-none"
            style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 0px))', paddingBottom: '8px' }}
          >
            <div className="w-full max-w-6xl flex justify-between items-center gap-3 min-w-0">

              {/* Brand wordmark */}
              <button
                onClick={() => setActiveTab('home')}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                title={`${currentBranding.appName || 'NOTX'} ${currentBranding.tagline || 'Connect'}`}
              >
                <BrandLogo branding={currentBranding} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-nowrap">
                    <h1 className="nb-headline text-base sm:text-lg text-[var(--nb-content)] truncate">
                      {currentBranding.appName || 'NOTX'}
                    </h1>
                    {currentBranding.subtitle && (
                      <span className="nb-pill-yellow text-xs font-mono font-bold hidden sm:inline-flex shadow-[1.5px_1.5px_0_var(--nb-ink)]">
                        {currentBranding.subtitle}
                      </span>
                    )}
                  </div>
                  <p className="nb-label text-[10px] mt-0.5 truncate" style={{ color: 'var(--nb-tertiary)' }}>
                    {currentBranding.tagline ? `${currentBranding.tagline} Portal` : 'Association Ecosystem'}
                  </p>
                </div>
              </button>

              {/* Right controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <PWAInstallButton />

                {/* Refresh */}
                <button
                  onClick={refreshAllData}
                  disabled={isDataLoading}
                  className="nb-btn-icon disabled:opacity-40"
                  aria-label="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${isDataLoading ? 'animate-spin' : ''}`} style={{ color: isDataLoading ? 'var(--nb-accent)' : undefined }} />
                </button>


                {/* Profile */}
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 h-11 pl-2 pr-3 border-[1.5px] border-[var(--nb-ink)] rounded-md bg-[var(--nb-surface)] shadow-[2px_2px_0_var(--nb-ink)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded overflow-hidden border-[1.5px] border-[var(--nb-ink)] bg-[var(--nb-surface-accent)] flex-shrink-0">
                    <img
                      src={currentUser.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${currentUser.rollNumber || currentUser.uid}`}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-[var(--nb-content)] leading-tight truncate max-w-[72px]">{currentUser.name.split(' ')[0]}</p>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded leading-none uppercase inline-block mt-0.5 ${
                      currentUser.role === 'admin' ? 'nb-pill-coral' :
                      currentUser.role === 'president' || currentUser.role === 'associate' ? 'nb-pill-purple' :
                      currentUser.role === 'coordinator' ? 'nb-pill-blue' : 'nb-pill-green'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </header>

          {/* Core View Display */}
          <div className="flex-1 flex flex-col min-h-0 relative w-full overflow-hidden" style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="flex-1 flex flex-col min-h-0 w-full max-w-6xl mx-auto">
            <React.Suspense fallback={<ViewLoadingFallback />}>
            {activeTab === 'home' && (
              <DashboardView 
                user={currentUser}
                allUsers={allUsers}
                events={events}
                announcements={announcements}
                registrations={registrations}
                onNavigate={setActiveTab}
                onSelectEvent={selectEventFromDashboard}
                isLoading={isDataLoading}
              />
            )}

            {activeTab === 'events' && (
              <EventsView 
                user={currentUser}
                allUsers={allUsers}
                events={events}
                registrations={registrations}
                refreshEvents={refreshAllData}
                refreshRegistrations={refreshAllData}
                selectedEvent={selectedEvent}
                setSelectedEvent={setSelectedEvent}
                isLoading={isDataLoading}
              />
            )}

            {activeTab === 'gallery' && (
              <GalleryView 
                user={currentUser}
                albums={albums}
                refreshData={refreshAllData}
              />
            )}

            {activeTab === 'announcements' && (
              <AnnouncementsView 
                user={currentUser}
                announcements={announcements}
                refreshAnnouncements={refreshAllData}
              />
            )}

            {activeTab === 'messages' && (
              appConfig.isChatEnabled ? (
                <MessagesView
                  user={currentUser}
                  allUsers={allUsers}
                  initialTargetRoll={messageTargetRoll}
                  onTargetHandled={() => setMessageTargetRoll(null)}
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                  <div className="nb-card-tinted w-16 h-16 flex items-center justify-center">
                    <MessageSquare className="w-8 h-8" style={{ color: 'var(--nb-tertiary)' }} />
                  </div>
                  <h3 className="nb-headline text-2xl" style={{ color: 'var(--nb-content)' }}>Chat Disabled</h3>
                  <p className="nb-body max-w-xs" style={{ color: 'var(--nb-secondary)' }}>
                    The peer-to-peer messaging system has been temporarily disabled by the administration.
                  </p>
                  <button onClick={() => setActiveTab('home')} className="nb-btn">
                    Return Home
                  </button>
                </div>
              )
            )}

            {activeTab === 'profile' && (
              <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
                {/* Embedded Profile screen */}
                <ProfileView 
                  user={currentUser}
                  setUser={setCurrentUser}
                  registrations={registrations}
                  events={events}
                  allUsers={allUsers}
                  onLogout={handleLogout}
                  refreshUsers={refreshAllData}
                  onOpenAdminPanel={() => setShowAdminModal(true)}
                  setActiveTab={setActiveTab}
                  supportInfo={appConfig?.supportInfo}
                  branding={currentBranding}
                  isCertificatesEnabled={appConfig?.isCertificatesEnabled ?? true}
                  certificateTemplate={appConfig?.certificateTemplate}
                  onOpenSupportBox={() => setShowContactModal(true)}
                  onOpenMembers={() => setShowMembersModal(true)}
                  onSupportInfoUpdated={(info) => setAppConfig(prev => prev ? ({ ...prev, supportInfo: info }) : null)}
                />
              </div>
            )}
            </React.Suspense>
            </div>
          </div>

          {/* Floating Dock Navigation Bar (React Bits Pro Mobile 3 Style) */}
          <FloatingDockNav
            activeTab={activeTab}
            onTabChange={(tabId) => {
              setActiveTab(tabId);
              setSelectedEvent(null);
            }}
            isChatEnabled={appConfig.isChatEnabled}
            unreadCount={unreadChatsCount}
            pendingInvitesCount={receivedInvitations.filter(i => i.status === 'Pending').length}
            isOffline={!isOnline}
          />

          {/* OVERLAY SLIDING SHEETS / DRAWER MODALS */}
          <React.Suspense fallback={<ViewLoadingFallback />}>
          {showMembersModal && (
            <div className="fixed inset-0 bg-black/55 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6">
              <div className="nb-sheet md:nb-modal max-h-[92dvh] md:max-h-[85vh] h-[92dvh] md:h-auto w-full md:max-w-3xl flex flex-col overflow-hidden">
                {/* Sheet handle */}
                <div className="pt-2.5 pb-0 flex justify-center md:hidden flex-shrink-0">
                  <div className="w-10 h-1 rounded-full bg-[var(--nb-divider)]" />
                </div>
                <div className="p-4 border-b-[1.5px] border-[var(--nb-divider)] flex justify-between items-center flex-shrink-0">
                  <span className="nb-tag">Directory</span>
                  <button
                    onClick={() => setShowMembersModal(false)}
                    className="nb-btn-icon"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <MembersView allUsers={allUsers} events={events} branding={currentBranding} />
                </div>
              </div>
            </div>
          )}

          {showContactModal && (
            <div className="fixed inset-0 bg-black/55 z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6">
              <div className="nb-sheet md:nb-modal max-h-[85dvh] md:max-h-[80vh] h-[85dvh] md:h-auto w-full md:max-w-2xl flex flex-col overflow-hidden">
                <div className="pt-2.5 pb-0 flex justify-center md:hidden flex-shrink-0">
                  <div className="w-10 h-1 rounded-full bg-[var(--nb-divider)]" />
                </div>
                <div className="p-4 border-b-[1.5px] border-[var(--nb-divider)] flex justify-between items-center flex-shrink-0">
                  <span className="nb-tag">Query Desk</span>
                  <button
                    onClick={() => setShowContactModal(false)}
                    className="nb-btn-icon"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <ContactView
                    user={currentUser}
                    supportInfo={appConfig.supportInfo}
                    onSupportInfoUpdated={(info) => setAppConfig(prev => ({ ...prev, supportInfo: info }))}
                  />
                </div>
              </div>
            </div>
          )}

          {showAdminModal && (
            <AdminPanelView 
              currentUser={currentUser}
              allUsers={allUsers}
              events={events}
              registrations={registrations}
              onClose={() => setShowAdminModal(false)}
              refreshData={refreshAllData}
            />
          )}
          </React.Suspense>

        </div>
      )}
    </>
  );
}
