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

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

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
      } catch {
        try {
          dbInstance = getFirestore(app, FIRESTORE_DB_ID);
        } catch {
          dbInstance = getFirestore(app);
        }
      }
    } else {
      try {
        dbInstance = initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
          experimentalAutoDetectLongPolling: true,
        });
      } catch {
        dbInstance = getFirestore(app);
      }
    }
  }
} catch (e) {
  // Graceful fallback to default instance or offline mock
  try {
    dbInstance = getFirestore(app);
  } catch {
    dbInstance = null;
  }
}
export const db = dbInstance;

// Non-blocking connection check (only executed when called explicitly)
export async function testConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch {
    return false;
  }
}

// Google Auth Provider & Gmail Workspace Scopes
export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing'
];

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
GMAIL_SCOPES.forEach(scope => {
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
 * Sync user profile to Firestore `/users/{userId}`
 */
export async function syncUserProfile(
  user: FirebaseUser, 
  role: UserRole = 'admin'
): Promise<FirebaseUserProfile | null> {
  if (!user || !user.uid) return null;

  let assignedRole: UserRole = role;
  let createdAt: any = serverTimestamp();

  try {
    const userRef = doc(db, 'users', user.uid);
    try {
      const existingSnap = await getDoc(userRef);
      if (existingSnap.exists()) {
        const data = existingSnap.data();
        if (data.role) {
          assignedRole = data.role as UserRole;
        }
        createdAt = data.createdAt || createdAt;
      }
    } catch {
      // If offline or cache miss during startup, keep default role and timestamp
    }

    const profileData: FirebaseUserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Agency Partner',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.uid)}`,
      role: assignedRole,
      createdAt,
      lastLoginAt: serverTimestamp()
    };

    // setDoc with persistent cache writes to local cache immediately and syncs to server
    await setDoc(userRef, profileData, { merge: true }).catch(writeErr => {
      console.warn('Queued profile sync locally (network reconnecting):', writeErr?.message || writeErr);
    });

    return profileData;
  } catch (error) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Agency Partner',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.uid)}`,
      role,
      lastLoginAt: new Date().toISOString()
    };
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  // Graceful log without throwing unhandled exceptions
  if (process.env.NODE_ENV === 'development') {
    console.debug('Firestore Operation Handled:', errInfo.operationType, path, errInfo.error);
  }
}

/**
 * Save user preferences to `/userData/{userId}`
 */
export async function saveUserPreferences(userId: string, prefs: UserPreferences): Promise<boolean> {
  if (!db || !userId || !auth.currentUser) return false;
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
    return false;
  }
}

/**
 * Get user preferences from `/userData/{userId}`
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!db || !userId || !auth.currentUser) return null;
  const pathForGet = `userData/${userId}`;
  try {
    const prefRef = doc(db, 'userData', userId);
    const snap = await getDoc(prefRef);
    if (snap.exists()) {
      return snap.data() as UserPreferences;
    }
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }
  return null;
}

/**
 * Load all project documents from Firestore `projects` collection
 */
export async function loadProjectsFromFirestore(): Promise<ProjectLead[]> {
  if (!db || !auth.currentUser) {
    return [];
  }
  const pathForGetDocs = 'projects';
  try {
    const projectsCol = collection(db, pathForGetDocs);
    const snapshot = await getDocs(projectsCol);
    if (snapshot.empty) {
      return [];
    }
    const projects: ProjectLead[] = [];
    snapshot.forEach(docSnap => {
      projects.push({
        id: docSnap.id,
        ...docSnap.data()
      } as ProjectLead);
    });
    return projects;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.LIST, pathForGetDocs);
    return [];
  }
}

/**
 * Save or update a project document in Firestore `projects/{projectId}`
 */
export async function saveProjectToFirestore(project: Partial<ProjectLead> & { id: string }): Promise<boolean> {
  if (!db || !project.id || !auth.currentUser) return false;
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
    return false;
  }
}

/**
 * Batch seed projects to Firestore if collection is empty
 */
export async function seedProjectsToFirestore(initialProjects: ProjectLead[]): Promise<boolean> {
  if (!db || !initialProjects || initialProjects.length === 0 || !auth.currentUser) return false;
  const pathForSeed = 'projects';
  try {
    const projectsCol = collection(db, pathForSeed);
    const existing = await getDocs(projectsCol);
    if (!existing.empty) {
      // Already has data in Firestore
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
 * Subscribe to real-time updates for projects from Firestore
 */
export function subscribeProjectsFromFirestore(
  onData: (projects: ProjectLead[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!db || !auth.currentUser) {
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
      onData(items);
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
 * Save chat message to Firestore `chatMessages` collection
 */
export async function saveChatMessageToFirestore(msg: {
  channel: string;
  sender: string;
  role: string;
  text: string;
  timestamp?: string;
}): Promise<boolean> {
  if (!db || !auth.currentUser) return false;
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
    return false;
  }
}

/**
 * Subscribe to channel messages in Firestore
 */
export function subscribeChatMessagesFromFirestore(
  channel: string,
  onData: (messages: any[]) => void
): () => void {
  if (!db || !auth.currentUser) {
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

