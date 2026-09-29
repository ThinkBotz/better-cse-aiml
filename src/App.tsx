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
  MessageSquare, Moon, Sun, RefreshCw
} from 'lucide-react';

import { onSnapshot, collection, doc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, DepartmentEvent, EventRegistration, Album, Announcement, UserInvitation, ChatRoom, AppConfig, SupportInfo, DEFAULT_SUPPORT_INFO, AppBranding, DEFAULT_BRANDING } from './types';
import BrandLogo, { ACCENT_THEMES } from './components/BrandLogo';
import { 
  fetchUsers, 
  fetchEvents, 
  fetchRegistrations, 
  fetchAlbums, 
  fetchAnnouncements, 
  fetchReceivedInvitations,
  getAppConfig,
  seedDatabaseIfEmpty
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
  <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[280px]">
    <div className="w-10 h-10 rounded-2xl bg-surface-accent border border-divider/60 flex items-center justify-center shadow-lg">
      <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
    </div>
    <span className="mt-3 text-xs font-semibold text-secondary animate-pulse">Loading view...</span>
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
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-500/90 backdrop-blur-md px-4 py-2 text-xs font-bold text-white shadow-xl border border-amber-400">
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      Offline Mode Active
    </div>
  );
};

export default function App() {
  const isOnline = useOnlineStatus();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('notx_theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('notx_theme', theme);
    const themeColor = theme === 'dark' ? '#09090E' : '#F6F6F9';
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

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
        // Seed if first time
        
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
      <div className="h-full w-full bg-background flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative mb-6">
          <BrandLogo branding={currentBranding} size="xl" />
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-r from-indigo-500 to-violet-400 border-2 border-[#000000]"></span>
          </span>
        </div>
        <h2 className="text-xl font-display font-bold text-content tracking-tight">
          {currentBranding.appName || 'NOTX'} {currentBranding.tagline || 'Connect'}
        </h2>
        <p className="text-xs text-secondary mt-1 max-w-xs">
          {currentBranding.subtitle ? `Department of ${currentBranding.subtitle} • Association Ecosystem` : 'Association Ecosystem'}
        </p>
        <div className="flex items-center gap-2 bg-surface/90 px-4 py-2 rounded-xl border border-divider mt-6 shadow-xl backdrop-blur-md">
          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
          <span className="text-[11px] text-secondary font-mono font-medium">Syncing Cloud Services</span>
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
        <div className="h-full w-full flex flex-col bg-background text-content overflow-hidden">
          
          {/* Top Header / Brand bar */}
          <header 
            style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 0px))' }}
            className="bg-background/85 backdrop-blur-xl border-b border-divider/60 py-2.5 px-4 sm:px-6 flex justify-center items-center flex-shrink-0 z-40 select-none"
          >
            <div className="w-full max-w-6xl flex justify-between items-center gap-2 min-w-0">
              <div 
                onClick={() => setActiveTab('home')}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
                title={`${currentBranding.appName || 'NOTX'} ${currentBranding.tagline || 'Connect'}`}
              >
                <BrandLogo branding={currentBranding} size="md" />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <h4 className="text-xs sm:text-sm font-display font-extrabold text-content tracking-tight truncate group-hover:text-rose-400 transition-colors">
                      {currentBranding.appName || 'NOTX'}
                    </h4>
                    {currentBranding.subtitle && (
                      <span className="text-[8px] sm:text-[9px] font-sans font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full flex-shrink-0">
                        {currentBranding.subtitle}
                      </span>
                    )}
                  </div>
                  <p className="text-[8px] sm:text-[9px] text-secondary font-medium leading-none mt-0.5 flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse flex-shrink-0"></span>
                    {currentBranding.tagline ? `${currentBranding.tagline} Portal` : 'Connected Portal'}
                  </p>
                </div>
              </div>

              {/* Quick Navigation Profile Toggles */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <PWAInstallButton />
                
                <button
                  onClick={refreshAllData}
                  disabled={isDataLoading}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-full bg-surface-accent/70 hover:bg-rose-500/20 border border-divider/80 hover:border-rose-500/40 transition-all cursor-pointer text-secondary hover:text-rose-400 disabled:opacity-50 shadow-sm"
                  aria-label="Refresh Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isDataLoading ? 'animate-spin text-rose-400' : ''}`} />
                </button>

                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 flex items-center justify-center rounded-full bg-surface-accent/70 hover:bg-rose-500/20 border border-divider/80 hover:border-rose-500/40 transition-all cursor-pointer text-secondary hover:text-rose-400 shadow-sm"
                  aria-label="Toggle Theme"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>

                <button 
                  onClick={() => { setActiveTab('profile'); }}
                  className="flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full bg-surface-accent/70 hover:bg-surface-accent border border-divider/80 hover:border-rose-500/40 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-bold text-content leading-tight truncate max-w-[80px]">{currentUser.name.split(' ')[0]}</p>
                    <p className="text-[8px] text-rose-400 uppercase font-bold tracking-wide">{currentUser.role}</p>
                  </div>
                  <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-rose-500/40 group-hover:border-rose-400 transition-colors bg-surface shadow-inner">
                    <img 
                      src={currentUser.profile_pic || `https://api.dicebear.com/9.x/notionists/svg?seed=${currentUser.rollNumber || currentUser.uid}`} 
                      alt={currentUser.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              </div>
            </div>
          </header>

          {/* Core View Display */}
          <div className="flex-1 flex flex-col min-h-0 relative w-full overflow-hidden">
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
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-surface-accent flex items-center justify-center border border-divider/60 mb-4">
                    <MessageSquare className="w-8 h-8 text-secondary opacity-50" />
                  </div>
                  <h3 className="text-lg font-display font-bold text-content">Chat Disabled</h3>
                  <p className="text-sm text-secondary mt-2 max-w-xs">
                    The peer-to-peer messaging system has been temporarily disabled by the administration.
                  </p>
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                  >
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
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 transition-all">
              <div className="bg-background rounded-t-[28px] md:rounded-[28px] border-t md:border border-divider/80 max-h-[92dvh] md:max-h-[85vh] h-[92dvh] md:h-auto w-full md:max-w-3xl flex flex-col overflow-hidden shadow-2xl">
                <div className="p-3.5 sm:p-4 border-b border-divider/80 flex justify-between items-center flex-shrink-0 bg-surface">
                  <span className="text-[11px] font-bold text-indigo-400 bg-indigo-500/15 px-3 py-1 rounded-full border border-indigo-500/30 font-mono">
                    Directory
                  </span>
                  <button 
                    onClick={() => setShowMembersModal(false)}
                    className="w-8 h-8 rounded-full bg-surface-accent flex items-center justify-center text-secondary hover:text-content border border-divider/80 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-semibold">✕</span>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  <MembersView allUsers={allUsers} events={events} branding={currentBranding} />
                </div>
              </div>
            </div>
          )}

          {showContactModal && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex flex-col justify-end md:justify-center md:items-center p-0 md:p-6 transition-all">
              <div className="bg-background rounded-t-[28px] md:rounded-[28px] border-t md:border border-divider/80 max-h-[85dvh] md:max-h-[80vh] h-[85dvh] md:h-auto w-full md:max-w-2xl flex flex-col overflow-hidden shadow-2xl">
                <div className="p-3.5 sm:p-4 border-b border-divider/80 flex justify-between items-center flex-shrink-0 bg-surface">
                  <span className="text-[11px] font-bold text-violet-400 bg-violet-500/15 px-3 py-1 rounded-full border border-violet-500/30 font-mono">
                    Query Desk
                  </span>
                  <button 
                    onClick={() => setShowContactModal(false)}
                    className="w-8 h-8 rounded-full bg-surface-accent flex items-center justify-center text-secondary hover:text-content border border-divider/80 cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-semibold">✕</span>
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
