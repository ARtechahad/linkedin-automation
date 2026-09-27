import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  addDoc,
  where,
  limit,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ProjectLead, UserRole } from '../types';
import { localDatabase } from '../services/localDatabaseFallback';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// State tracking for Firestore availability
let isFirestoreAvailable = false;
let isFirestoreDisabled = false;

// Initialize Cloud Firestore with graceful fallback and bypass
const configAny = firebaseConfig as any;
const FIRESTORE_DB_ID = configAny?.firestoreDatabaseId;

let dbInstance: any = null;

try {
  if (configAny?.projectId) {
    if (FIRESTORE_DB_ID && FIRESTORE_DB_ID !== '(default)') {
      try {
        dbInstance = initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
          experimentalAutoDetectLongPolling: true,
        }, FIRESTORE_DB_ID);
        isFirestoreAvailable = true;
      } catch {
        try {
          dbInstance = getFirestore(app, FIRESTORE_DB_ID);
          isFirestoreAvailable = true;
        } catch {
          dbInstance = null;
        }
      }
    } else {
      try {
        dbInstance = initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
          experimentalAutoDetectLongPolling: true,
        });
        isFirestoreAvailable = true;
      } catch {
        try {
          dbInstance = getFirestore(app);
          isFirestoreAvailable = true;
        } catch {
          dbInstance = null;
        }
      }
    }
  }
} catch {
  dbInstance = null;
  isFirestoreAvailable = false;
}

export const db = dbInstance;

/**
 * Check if a Firestore error indicates a non-existent database
 */
export function isDatabaseNotFoundError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return (
    msg.includes("Database '(default)' not found") ||
    msg.includes('not found') ||
    msg.includes('NOT_FOUND') ||
    msg.includes('does not exist') ||
    (error as any)?.code === 'not-found'
  );
}

/**
 * Mark Firestore as unavailable to suppress further network attempts
 * and seamlessly transition to local storage fallback
 */
export function markFirestoreUnavailable(reason?: string) {
  if (!isFirestoreDisabled) {
    isFirestoreDisabled = true;
    isFirestoreAvailable = false;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('clientops_storage_mode', 'local_storage_fallback');
      } catch {}
    }
  }
}

// Non-blocking connection check (only executed when called explicitly)
export async function testConnection(): Promise<boolean> {
  if (!db || isFirestoreDisabled) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (err) {
    if (isDatabaseNotFoundError(err)) {
      markFirestoreUnavailable('Database not provisioned');
    }
    return false;
  }
}

// Google Auth Provider & Workspace Scopes (Gmail, Sheets, Drive, Tasks, Calendar, Docs)
export const GOOGLE_WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send'
];

export const GMAIL_SCOPES = GOOGLE_WORKSPACE_SCOPES;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
GOOGLE_WORKSPACE_SCOPES.forEach(scope => {
  googleProvider.addScope(scope);
});

// In-memory token cache (strictly NOT stored in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Clear cached token on auth state change if signed out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

export const hasGmailAccess = (): boolean => {
  return !!cachedAccessToken;
};

export const hasGoogleSheetsAccess = (): boolean => {
  return !!cachedAccessToken;
};

export const hasGoogleWorkspaceAccess = (): boolean => {
  return !!cachedAccessToken;
};

export const hasGoogleTasksAccess = (): boolean => {
  return !!cachedAccessToken;
};

export const hasGoogleCalendarAccess = (): boolean => {
  return !!cachedAccessToken;
};

export const hasGoogleDocsAccess = (): boolean => {
  return !!cachedAccessToken;
};

export interface FirebaseUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt?: any;
  lastLoginAt: any;
}

export interface UserPreferences {
  theme?: 'dark' | 'light';
  language?: string;
  currency?: string;
  scaleMode?: string;
  updatedAt?: any;
}

/**
 * Sign in using Google Sign-In popup with Firebase Auth and Gmail Workspace scopes
 */
export async function signInWithGoogle(): Promise<{ success: boolean; user?: FirebaseUser; accessToken?: string; error?: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { success: true, user: result.user, accessToken: cachedAccessToken || undefined };
  } catch (error: any) {
    console.error('Firebase Google Sign-In error:', error);
    let errorMessage = 'Google Sign-In failed. Please try again.';
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled: The Google sign-in window was closed.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
    } else if (error.code === 'auth/unauthorized-domain') {
      errorMessage = 'This domain is not authorized for OAuth operations in Firebase console.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  } finally {
    isSigningIn = false;
  }
}

/**
 * Sign out from Firebase Authentication and flush in-memory access token
 */
export async function signOutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase sign-out error:', error);
  } finally {
    cachedAccessToken = null;
  }
}

/**
 * Sync user profile to Firestore `/users/{userId}` with local storage persistence
 */
export async function syncUserProfile(
  user: FirebaseUser, 
  role: UserRole = 'admin'
): Promise<FirebaseUserProfile | null> {
  if (!user || !user.uid) return null;

  let assignedRole: UserRole = role;
  const now = new Date().toISOString();

  // Construct standard profile
  const profileData: FirebaseUserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Agency Partner',
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.uid)}`,
    role: assignedRole,
    createdAt: now,
    lastLoginAt: now
  };

  // Always mirror profile locally
  localDatabase.savePreferences(`profile_${user.uid}`, profileData);

  if (!db || isFirestoreDisabled) {
    return profileData;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    try {
      const existingSnap = await getDoc(userRef);
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        if (data.role) {
          assignedRole = data.role as UserRole;
          profileData.role = assignedRole;
        }
      }
    } catch (e) {
      if (isDatabaseNotFoundError(e)) {
        markFirestoreUnavailable();
        return profileData;
      }
    }

    await setDoc(userRef, {
      ...profileData,
      lastLoginAt: serverTimestamp()
    }, { merge: true }).catch(() => {});

    return profileData;
  } catch {
    return profileData;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (isDatabaseNotFoundError(error)) {
    markFirestoreUnavailable('Database not provisioned');
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  // Silent graceful handling without throwing or spamming
  if (process.env.NODE_ENV === 'development' && !isFirestoreDisabled) {
    console.debug('Firestore Operation Handled:', errInfo.operationType, path, errInfo.error);
  }
}

/**
 * Save user preferences to `/userData/{userId}` with localStorage fallback
 */
export async function saveUserPreferences(userId: string, prefs: UserPreferences): Promise<boolean> {
  // Always mirror to local storage first
  localDatabase.savePreferences(userId, prefs);

  if (!db || isFirestoreDisabled || !userId || !auth.currentUser) {
    return true;
  }
  const pathForWrite = `userData/${userId}`;
  try {
    const prefRef = doc(db, 'userData', userId);
    await setDoc(prefRef, {
      ...prefs,
      userId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
    return true;
  }
}

/**
 * Get user preferences from `/userData/{userId}` with localStorage fallback
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const localPrefs = localDatabase.getPreferences(userId) as UserPreferences | null;

  if (!db || isFirestoreDisabled || !userId || !auth.currentUser) {
    return localPrefs;
  }
  const pathForGet = `userData/${userId}`;
  try {
    const prefRef = doc(db, 'userData', userId);
    const snap = await getDoc(prefRef);
    if (snap.exists()) {
      const data = snap.data() as UserPreferences;
      localDatabase.savePreferences(userId, data);
      return data;
    }
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }
  return localPrefs;
}

/**
 * Load all project documents from Firestore `projects` collection with localStorage fallback
 */
export async function loadProjectsFromFirestore(): Promise<ProjectLead[]> {
  const localProjects = localDatabase.getProjects();

  if (!db || isFirestoreDisabled || !auth.currentUser) {
    return localProjects;
  }
  const pathForGetDocs = 'projects';
  try {
    const projectsCol = collection(db, pathForGetDocs);
    const snapshot = await getDocs(projectsCol);
    if (snapshot.empty) {
      return localProjects;
    }
    const projects: ProjectLead[] = [];
    snapshot.forEach(docSnap => {
      projects.push({
        id: docSnap.id,
        ...docSnap.data()
      } as ProjectLead);
    });
    if (projects.length > 0) {
      localDatabase.saveProjects(projects);
      return projects;
    }
    return localProjects;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, pathForGetDocs);
    return localProjects;
  }
}

/**
 * Save or update a project document in Firestore `projects/{projectId}` with localStorage fallback
 */
export async function saveProjectToFirestore(project: Partial<ProjectLead> & { id: string }): Promise<boolean> {
  // Always update local storage first
  localDatabase.saveProject(project);

  if (!db || isFirestoreDisabled || !project.id || !auth.currentUser) {
    return true;
  }
  const pathForWrite = `projects/${project.id}`;
  try {
    const projectRef = doc(db, 'projects', project.id);
    await setDoc(projectRef, {
      ...project,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
    return true;
  }
}

/**
 * Batch seed projects to Firestore if collection is empty with localStorage fallback
 */
export async function seedProjectsToFirestore(initialProjects: ProjectLead[]): Promise<boolean> {
  if (!initialProjects || initialProjects.length === 0) return false;
  localDatabase.saveProjects(initialProjects);

  if (!db || isFirestoreDisabled || !auth.currentUser) {
    return true;
  }
  const pathForSeed = 'projects';
  try {
    const projectsCol = collection(db, pathForSeed);
    const existing = await getDocs(projectsCol);
    if (!existing.empty) {
      return false;
    }

    const batch = writeBatch(db);
    initialProjects.forEach(proj => {
      const docRef = doc(db, 'projects', proj.id);
      batch.set(docRef, {
        ...proj,
        createdAt: proj.createdAt || new Date().toISOString(),
        updatedAt: proj.updatedAt || new Date().toISOString()
      });
    });
    await batch.commit();
    return true;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, pathForSeed);
    return false;
  }
}

/**
 * Subscribe to real-time updates for projects from Firestore with localStorage fallback
 */
export function subscribeProjectsFromFirestore(
  onData: (projects: ProjectLead[]) => void,
  onError?: (err: Error) => void
): () => void {
  // Immediately provide cached data from local storage
  const cached = localDatabase.getProjects();
  if (cached.length > 0) {
    onData(cached);
  }

  if (!db || isFirestoreDisabled || !auth.currentUser) {
    return () => {};
  }
  const pathForSubscribe = 'projects';
  try {
    const projectsCol = collection(db, pathForSubscribe);
    const unsubscribe = onSnapshot(projectsCol, (snapshot) => {
      const items: ProjectLead[] = [];
      snapshot.forEach(docSnap => {
        items.push({
          id: docSnap.id,
          ...docSnap.data()
        } as ProjectLead);
      });
      if (items.length > 0) {
        localDatabase.saveProjects(items);
        onData(items);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, pathForSubscribe);
      if (onError) onError(err);
    });
    return unsubscribe;
  } catch (e: any) {
    return () => {};
  }
}

/**
 * Save chat message to Firestore `chatMessages` collection with localStorage fallback
 */
export async function saveChatMessageToFirestore(msg: {
  channel: string;
  sender: string;
  role: string;
  text: string;
  timestamp?: string;
}): Promise<boolean> {
  // Always save to local storage
  localDatabase.saveChatMessage(msg);

  if (!db || isFirestoreDisabled || !auth.currentUser) {
    return true;
  }
  const pathForAdd = 'chatMessages';
  try {
    const chatCol = collection(db, pathForAdd);
    await addDoc(chatCol, {
      ...msg,
      senderId: auth.currentUser.uid,
      timestamp: msg.timestamp || new Date().toISOString(),
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, pathForAdd);
    return true;
  }
}

/**
 * Subscribe to channel messages in Firestore with localStorage fallback
 */
export function subscribeChatMessagesFromFirestore(
  channel: string,
  onData: (messages: any[]) => void
): () => void {
  // Immediately provide cached local messages for this channel
  const localMsgs = localDatabase.getChatMessages(channel);
  if (localMsgs.length > 0) {
    onData(localMsgs);
  }

  if (!db || isFirestoreDisabled || !auth.currentUser) {
    return () => {};
  }
  const pathForChatQuery = 'chatMessages';
  try {
    const chatCol = collection(db, pathForChatQuery);
    const q = query(
      chatCol,
      where('channel', '==', channel),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: any[] = [];
      snapshot.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (msgs.length > 0) {
        onData(msgs);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, pathForChatQuery);
    });
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

