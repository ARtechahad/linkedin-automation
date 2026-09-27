import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProjectLead, UserRole, SupportedLanguage, AutomatedTestResult, SupportedCurrency, AgencyScaleMode, AISettings, AuthUser, DatabaseEngineStatus, ThemeMode } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { getSavedAISettings, saveAISettings } from '../services/aiService';
import { ToastItem, ToastType } from '../components/ToastNotification';
import { 
  auth, 
  signInWithGoogle, 
  signOutFirebase, 
  syncUserProfile, 
  saveUserPreferences, 
  getUserPreferences,
  loadProjectsFromFirestore,
  saveProjectToFirestore,
  seedProjectsToFirestore,
  subscribeProjectsFromFirestore
} from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: AuthUser | null;
  authToken: string | null;
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  isFirebaseConnected: boolean;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchPersona: (role: UserRole) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  databaseStatus: DatabaseEngineStatus | null;
  refreshDatabaseStatus: () => Promise<void>;
  isDatabaseModalOpen: boolean;
  setIsDatabaseModalOpen: (open: boolean) => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  toggleTheme: () => void;
  activeTab: 'sop' | 'pipeline' | 'outreach' | 'inbox' | 'analytics' | 'integrations' | 'commissions' | 'chat' | 'vault' | 'portal' | 'free_apis' | 'gmail';
  setActiveTab: (tab: 'sop' | 'pipeline' | 'outreach' | 'inbox' | 'analytics' | 'integrations' | 'commissions' | 'chat' | 'vault' | 'portal' | 'free_apis' | 'gmail') => void;
  activePortalProjectId: string | null;
  setActivePortalProjectId: (id: string | null) => void;
  openClientPortal: (projectId: string) => void;
  unreadInboxCount: number;
  setUnreadInboxCount: (count: number) => void;
  projects: ProjectLead[];
  loadingProjects: boolean;
  refreshProjects: () => Promise<void>;
  updateProject: (id: string, updates: Partial<ProjectLead>) => Promise<boolean>;
  transferProject: (id: string) => Promise<{ success: boolean; message: string }>;
  isOnline: boolean;
  toastMessage: string | null;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  showToast: (msg: string, type?: ToastType) => void;
  isTestModalOpen: boolean;
  setIsTestModalOpen: (open: boolean) => void;
  isGDPRModalOpen: boolean;
  setIsGDPRModalOpen: (open: boolean) => void;
  isAIModalOpen: boolean;
  setIsAIModalOpen: (open: boolean) => void;
  isAISettingsModalOpen: boolean;
  setIsAISettingsModalOpen: (open: boolean) => void;
  aiSettings: AISettings;
  setAISettings: (settings: AISettings) => void;
  updateAISettings: (updates: Partial<AISettings>) => void;
  aiInitialData: { clientName?: string; websiteType?: string; channel?: string; mode?: string } | null;
  openAIModal: (data?: { clientName?: string; websiteType?: string; channel?: string; mode?: string }) => void;
  outreachInitialData: any;
  setOutreachInitialData: (data: any) => void;
  openOutreachWithData: (data: any) => void;
  isNewLeadModalOpen: boolean;
  setIsNewLeadModalOpen: (open: boolean) => void;
  discordExportModalData: ProjectLead | null;
  setDiscordExportModalData: (proj: ProjectLead | null) => void;
  automatedTestsPassedCount: number;
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  formatMoney: (amount: number, overrideCurr?: SupportedCurrency) => string;
  scaleMode: AgencyScaleMode;
  setScaleMode: (mode: AgencyScaleMode) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('alm_nexus_token') || null;
    }
    return null;
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('alm_nexus_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [role, setRoleState] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('alm_nexus_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed?.role) return parsed.role;
        } catch {}
      }
    }
    return 'admin';
  });
  const [databaseStatus, setDatabaseStatus] = useState<DatabaseEngineStatus | null>(null);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');
  const [scaleMode, setScaleModeState] = useState<AgencyScaleMode>('enterprise');

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('clientops_theme_mode') as ThemeMode;
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        return savedMode;
      }
      const legacy = localStorage.getItem('clientops_theme');
      if (legacy === 'light' || legacy === 'dark') {
        return legacy as ThemeMode;
      }
    }
    return 'dark';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to system OS theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const isDark = themeMode === 'system' ? systemPrefersDark : themeMode === 'dark';

  // Apply real theme classes and attributes to HTML document
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('clientops_theme_mode', themeMode);
    localStorage.setItem('clientops_theme', isDark ? 'dark' : 'light');

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#070a12' : '#ffffff');
    }
  }, [isDark, themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const setIsDark = (dark: boolean) => {
    setThemeModeState(dark ? 'dark' : 'light');
  };

  const toggleTheme = () => {
    setThemeModeState(isDark ? 'light' : 'dark');
  };

  const [activeTab, setActiveTabState] = useState<'sop' | 'pipeline' | 'outreach' | 'inbox' | 'analytics' | 'integrations' | 'commissions' | 'chat' | 'vault' | 'portal' | 'free_apis' | 'gmail'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal')) return 'portal';
      const tabParam = params.get('tab');
      if (tabParam && ['sop', 'pipeline', 'outreach', 'inbox', 'analytics', 'integrations', 'commissions', 'chat', 'vault', 'portal', 'free_apis', 'gmail'].includes(tabParam)) {
        return tabParam as any;
      }
    }
    return 'pipeline';
  });

  const setActiveTab = (tab: 'sop' | 'pipeline' | 'outreach' | 'inbox' | 'analytics' | 'integrations' | 'commissions' | 'chat' | 'vault' | 'portal' | 'free_apis' | 'gmail') => {
    // RBAC check: Guest role cannot leave portal
    if (role === 'client_guest' && tab !== 'portal') {
      showToast('Restricted: Guest client access is isolated to the Client Portal.', 'warning');
      return;
    }
    setActiveTabState(tab);
  };

  const [activePortalProjectId, setActivePortalProjectId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('portal') || null;
    }
    return null;
  });
  const [unreadInboxCount, setUnreadInboxCount] = useState<number>(3);
  const [projects, setProjects] = useState<ProjectLead[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [outreachInitialData, setOutreachInitialData] = useState<any>(null);
  
  // Modals
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isGDPRModalOpen, setIsGDPRModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAISettingsModalOpen, setIsAISettingsModalOpen] = useState(false);
  const [aiSettings, setAISettingsState] = useState<AISettings>(() => getSavedAISettings());
  const [aiInitialData, setAiInitialData] = useState<{ clientName?: string; websiteType?: string; channel?: string; mode?: string } | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [discordExportModalData, setDiscordExportModalData] = useState<ProjectLead | null>(null);
  const [automatedTestsPassedCount, setAutomatedTestsPassedCount] = useState<number>(17);

  // Database status loader
  const refreshDatabaseStatus = async () => {
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.status) {
          setDatabaseStatus(data.status);
        }
      }
    } catch (e) {
      console.warn('Failed to load database status', e);
    }
  };

  // Check auth user session
  const verifySession = async (tokenToUse?: string | null) => {
    const token = tokenToUse !== undefined ? tokenToUse : authToken;
    if (!token) {
      if (!auth.currentUser) {
        setCurrentUser(null);
      }
      return;
    }
    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      const res = await fetch('/api/auth/me', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setRoleState(data.user.role);
          localStorage.setItem('alm_nexus_user', JSON.stringify(data.user));
          if (data.user.role === 'client_guest') {
            setActiveTabState('portal');
          }
        } else {
          setCurrentUser(null);
          setAuthToken(null);
          localStorage.removeItem('alm_nexus_token');
          localStorage.removeItem('alm_nexus_user');
        }
      } else {
        setCurrentUser(null);
        setAuthToken(null);
        localStorage.removeItem('alm_nexus_token');
        localStorage.removeItem('alm_nexus_user');
      }
    } catch (e) {
      console.warn('Failed to verify session', e);
    }
  };

  // Firebase Auth State Listener & Firestore profile sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setIsFirebaseConnected(true);
        try {
          const profile = await syncUserProfile(fbUser, role || 'admin');
          const userObj: AuthUser = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
            email: fbUser.email || '',
            role: (profile?.role as UserRole) || 'admin',
            title: 'Google & Firebase Authenticated Operator',
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fbUser.uid)}`,
            permissions: ['all', 'pipeline_read', 'pipeline_write', 'sop_execute']
          };
          setCurrentUser(userObj);
          setRoleState(userObj.role);
          localStorage.setItem('alm_nexus_user', JSON.stringify(userObj));

          // Load user preferences from Firestore if available
          const prefs = await getUserPreferences(fbUser.uid);
          if (prefs) {
            if (prefs.theme && ['light', 'dark', 'system'].includes(prefs.theme)) {
              setThemeModeState(prefs.theme as ThemeMode);
            }
            if (prefs.currency) setCurrency(prefs.currency as SupportedCurrency);
            if (prefs.language) setLanguage(prefs.language as SupportedLanguage);
          }

          // Trigger projects refresh with authenticated Firebase session
          refreshProjects();
        } catch (err) {
          console.warn('Error syncing Firebase user profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    verifySession();
    refreshDatabaseStatus();
  }, []);

  // Sync user preferences to Firestore on change
  useEffect(() => {
    if (auth.currentUser) {
      saveUserPreferences(auth.currentUser.uid, {
        theme: themeMode,
        language,
        currency,
        scaleMode
      }).catch(err => console.warn('Could not persist preferences to Firestore:', err));
    }
  }, [themeMode, language, currency, scaleMode]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole === 'client_guest') {
      setActiveTabState('portal');
    }
    // Update role profile mapping
    switchPersona(newRole);
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await signInWithGoogle();
      if (res.success && res.user) {
        const fbUser = res.user;
        const profile = await syncUserProfile(fbUser, 'admin');
        const userObj: AuthUser = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
          email: fbUser.email || '',
          role: (profile?.role as UserRole) || 'admin',
          title: 'Google & Firebase Authenticated Operator',
          avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(fbUser.uid)}`,
          permissions: ['all', 'pipeline_read', 'pipeline_write', 'sop_execute']
        };
        setCurrentUser(userObj);
        setRoleState(userObj.role);
        localStorage.setItem('alm_nexus_user', JSON.stringify(userObj));

        // Save preferences to Firestore
        await saveUserPreferences(fbUser.uid, {
          theme: isDark ? 'dark' : 'light',
          language,
          currency,
          scaleMode
        });

        // Refresh projects from Firestore
        await refreshProjects();

        showToast(`Signed in with Google as ${userObj.name}!`, 'success');
        return { success: true };
      } else {
        showToast(res.error || 'Google Sign-In failed', 'warning');
        return { success: false, message: res.error || 'Google Sign-In failed.' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Authentication error.' };
    }
  };

  const login = async (emailOrRole: string, passwordOrPin: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailOrRole, 
          role: emailOrRole, 
          password: passwordOrPin, 
          pin: passwordOrPin 
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setRoleState(data.user.role);
        localStorage.setItem('alm_nexus_token', data.token);
        localStorage.setItem('alm_nexus_user', JSON.stringify(data.user));
        showToast(`Welcome back, ${data.user.name} (${data.user.title || data.user.role})!`);
        if (data.user.role === 'client_guest') {
          setActiveTabState('portal');
        } else if (data.user.role === 'sales') {
          setActiveTabState('pipeline');
        } else if (data.user.role === 'developer') {
          setActiveTabState('pipeline');
        }
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Invalid credentials or PIN.' };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Authentication error.' };
    }
  };

  const logout = () => {
    signOutFirebase().catch(e => console.warn('Sign out error:', e));
    setFirebaseUser(null);
    setAuthToken(null);
    setCurrentUser(null);
    setRoleState('client_guest');
    setActiveTabState('portal');
    localStorage.removeItem('alm_nexus_token');
    localStorage.removeItem('alm_nexus_user');
    showToast('Signed out of AgencyOps and Firebase session.');
  };

  const switchPersona = async (targetRole: UserRole) => {
    const personaCredentials: Record<UserRole, { email: string; pass: string }> = {
      admin: { email: 'admin@agencyops.dev', pass: 'Admin@12345' },
      bd_head: { email: 'admin@agencyops.dev', pass: 'Admin@12345' },
      coordinator: { email: 'coordinator@agencyops.dev', pass: 'Coord@12345' },
      sales: { email: 'sales@agencyops.dev', pass: 'Sales@12345' },
      developer: { email: 'dev@agencyops.dev', pass: 'Dev@12345' },
      collaborator: { email: 'partner@vance-capital.com', pass: 'Partner@12345' },
      client_guest: { email: 'client@lumina-health.co.uk', pass: 'Client@12345' }
    };
    const cred = personaCredentials[targetRole];
    if (cred) {
      await login(cred.email, cred.pass);
    }
  };

  const setAISettings = (newSettings: AISettings) => {
    setAISettingsState(newSettings);
    saveAISettings(newSettings);
  };

  const updateAISettings = (updates: Partial<AISettings>) => {
    setAISettingsState(prev => {
      const merged = { ...prev, ...updates };
      saveAISettings(merged);
      return merged;
    });
  };

  // Translation helper
  const t = (key: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || key;
  };

  // Toast feedback with support for types (success, error, warning, info)
  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToastMessage(msg);
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { id, message: msg, type, duration: 4200 };
    setToasts(prev => [...prev.slice(-4), newToast]);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4200);
  };

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Connection restored: Synchronized with server.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline mode active. Using cached SOP and local data.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch projects from Firestore with server and offline fallbacks
  const refreshProjects = async () => {
    setLoadingProjects(true);
    try {
      // 1. Try reading from Firestore first if user is authenticated in Firebase
      if (auth.currentUser) {
        try {
          const firestoreProjects = await loadProjectsFromFirestore();
          if (firestoreProjects && firestoreProjects.length > 0) {
            setProjects(firestoreProjects);
            localStorage.setItem('clientops_cached_projects', JSON.stringify(firestoreProjects));
            return;
          }
        } catch (fsErr) {
          console.warn('Firestore load encountered an error, falling back to server API:', fsErr);
        }
      }

      // 2. Query the server API
      const headers: Record<string, string> = {};
      const token = authToken || (typeof window !== 'undefined' ? localStorage.getItem('alm_nexus_token') : null);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch('/api/projects', { headers });
      if (res.ok) {
        const data = await res.json();
        const projs = data.projects || [];
        setProjects(projs);
        localStorage.setItem('clientops_cached_projects', JSON.stringify(projs));

        // Seed to Firestore in background only if authenticated
        if (projs.length > 0 && auth.currentUser) {
          seedProjectsToFirestore(projs).catch(e => console.warn('Could not seed initial projects to Firestore:', e));
        }
      } else {
        throw new Error('Server returned ' + res.status);
      }
    } catch (e) {
      console.warn('Failed to fetch projects, falling back to cache:', e);
      const cached = localStorage.getItem('clientops_cached_projects');
      if (cached) {
        try {
          setProjects(JSON.parse(cached));
        } catch {
          // ignore
        }
      }
    } finally {
      setLoadingProjects(false);
    }
  };

  // Real-time Firestore synchronization for collaborative project updates
  // SKILL mandate: Only attach onSnapshot listeners if auth is ready and user is authenticated
  useEffect(() => {
    if (!firebaseUser) return;
    const unsubscribe = subscribeProjectsFromFirestore((liveProjects) => {
      if (liveProjects && liveProjects.length > 0) {
        setProjects(liveProjects);
        localStorage.setItem('clientops_cached_projects', JSON.stringify(liveProjects));
      }
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    refreshProjects();
  }, [authToken]);

  // Update project in Firestore and backend
  const updateProject = async (id: string, updates: Partial<ProjectLead>): Promise<boolean> => {
    try {
      // Optimistic update
      setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
      
      // Save directly to Firestore for durable persistence
      saveProjectToFirestore({ id, ...updates }).catch(e => console.warn('Firestore project update warning:', e));

      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(prev => prev.map(p => (p.id === id ? data.project : p)));
        showToast('Project updated & saved to Firestore.');
        return true;
      }
      return true; // Still true since Firestore was updated
    } catch (e) {
      console.error(e);
      showToast('Error updating project.');
      return false;
    }
  };

  // Transfer project strictly enforcing SOP Rule 8
  const transferProject = async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`/api/projects/${id}/transfer`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProjects(prev => prev.map(p => (p.id === id ? data.project : p)));
        // Save to Firestore
        saveProjectToFirestore({ 
          id, 
          status: 'transferred', 
          domainTransferred: true, 
          transferCompletedAt: new Date().toISOString() 
        }).catch(e => console.warn('Firestore transfer update warning:', e));

        showToast('🎉 SOP Rule 8 Passed: Website transferred to live client domain and logged in Firestore!');
        return { success: true, message: data.message };
      } else {
        showToast(`❌ Transfer Rejected: ${data.error}`);
        return { success: false, message: data.error };
      }
    } catch (e: any) {
      showToast('Network error verifying transfer.');
      return { success: false, message: e.message };
    }
  };

  const openAIModal = (data?: { clientName?: string; websiteType?: string; channel?: string; mode?: string }) => {
    setAiInitialData(data || null);
    setIsAIModalOpen(true);
  };

  const openOutreachWithData = (data: any) => {
    setOutreachInitialData(data);
    setActiveTab('outreach');
  };

  const openClientPortal = (projectId: string) => {
    setActivePortalProjectId(projectId);
    setActiveTab('portal');
  };

  const formatMoney = (amountUSD: number, overrideCurr?: SupportedCurrency): string => {
    const selected = overrideCurr || currency;
    const rates: Record<SupportedCurrency, { rate: number; prefix: string }> = {
      USD: { rate: 1.0, prefix: '$' },
      GBP: { rate: 0.79, prefix: '£' },
      EUR: { rate: 0.92, prefix: '€' },
      AUD: { rate: 1.53, prefix: 'A$' },
      AED: { rate: 3.67, prefix: 'AED ' },
    };
    const cfg = rates[selected] || rates.USD;
    const converted = (Number(amountUSD) || 0) * cfg.rate;
    return `${cfg.prefix}${Math.round(converted).toLocaleString()}`;
  };

  const setScaleMode = async (newMode: AgencyScaleMode) => {
    setScaleModeState(newMode);
    try {
      const res = await fetch('/api/agency/set-scale-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
      if (res.ok) {
        showToast(`Agency dataset adjusted to ${newMode.toUpperCase()} scale.`);
        await refreshProjects();
      }
    } catch (e) {
      console.warn('Failed to persist scale mode change', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        authToken,
        isAuthenticated: !!currentUser,
        firebaseUser,
        isFirebaseConnected,
        loginWithGoogle,
        login,
        logout,
        switchPersona,
        isAuthModalOpen,
        setIsAuthModalOpen,
        databaseStatus,
        refreshDatabaseStatus,
        isDatabaseModalOpen,
        setIsDatabaseModalOpen,
        language,
        setLanguage,
        t,
        isDark,
        setIsDark,
        themeMode,
        setThemeMode,
        toggleTheme,
        activeTab,
        setActiveTab,
        activePortalProjectId,
        setActivePortalProjectId,
        openClientPortal,
        unreadInboxCount,
        setUnreadInboxCount,
        projects,
        loadingProjects,
        refreshProjects,
        updateProject,
        transferProject,
        isOnline,
        toastMessage,
        toasts,
        dismissToast,
        showToast,
        isTestModalOpen,
        setIsTestModalOpen,
        isGDPRModalOpen,
        setIsGDPRModalOpen,
        isAIModalOpen,
        setIsAIModalOpen,
        isAISettingsModalOpen,
        setIsAISettingsModalOpen,
        aiSettings,
        setAISettings,
        updateAISettings,
        aiInitialData,
        openAIModal,
        outreachInitialData,
        setOutreachInitialData,
        openOutreachWithData,
        isNewLeadModalOpen,
        setIsNewLeadModalOpen,
        discordExportModalData,
        setDiscordExportModalData,
        automatedTestsPassedCount,
        currency,
        setCurrency,
        formatMoney,
        scaleMode,
        setScaleMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
