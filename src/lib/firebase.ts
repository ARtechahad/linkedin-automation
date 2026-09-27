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
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ProjectLead, UserRole } from '../types';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore with dedicated Database ID if configured
const configAny = firebaseConfig as any;
export const db = configAny.firestoreDatabaseId
  ? getFirestore(app, configAny.firestoreDatabaseId)
  : getFirestore(app);

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

  try {
    const userRef = doc(db, 'users', user.uid);
    const existingSnap = await getDoc(userRef);

    let assignedRole: UserRole = role;
    let createdAt = serverTimestamp();

    if (existingSnap.exists()) {
      const data = existingSnap.data();
      if (data.role) {
        assignedRole = data.role as UserRole;
      }
      createdAt = data.createdAt || createdAt;
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

    await setDoc(userRef, profileData, { merge: true });
    return profileData;
  } catch (error) {
    console.warn('Could not sync user profile to Firestore (may be offline):', error);
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

/**
 * Save user preferences to `/userData/{userId}`
 */
export async function saveUserPreferences(userId: string, prefs: UserPreferences): Promise<boolean> {
  if (!userId) return false;
  try {
    const prefRef = doc(db, 'userData', userId);
    await setDoc(prefRef, {
      ...prefs,
      userId,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (e) {
    console.warn('Failed to save user preferences to Firestore:', e);
    return false;
  }
}

/**
 * Get user preferences from `/userData/{userId}`
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!userId) return null;
  try {
    const prefRef = doc(db, 'userData', userId);
    const snap = await getDoc(prefRef);
    if (snap.exists()) {
      return snap.data() as UserPreferences;
    }
  } catch (e) {
    console.warn('Failed to load user preferences from Firestore:', e);
  }
  return null;
}

/**
 * Load all project documents from Firestore `projects` collection
 */
export async function loadProjectsFromFirestore(): Promise<ProjectLead[]> {
  try {
    const projectsCol = collection(db, 'projects');
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
  } catch (error) {
    console.warn('Error loading projects from Firestore:', error);
    return [];
  }
}

/**
 * Save or update a project document in Firestore `projects/{projectId}`
 */
export async function saveProjectToFirestore(project: Partial<ProjectLead> & { id: string }): Promise<boolean> {
  if (!project.id) return false;
  try {
    const projectRef = doc(db, 'projects', project.id);
    await setDoc(projectRef, {
      ...project,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving project to Firestore:', error);
    return false;
  }
}

/**
 * Batch seed projects to Firestore if collection is empty
 */
export async function seedProjectsToFirestore(initialProjects: ProjectLead[]): Promise<boolean> {
  if (!initialProjects || initialProjects.length === 0) return false;
  try {
    const projectsCol = collection(db, 'projects');
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
  } catch (error) {
    console.warn('Error seeding projects to Firestore:', error);
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
  try {
    const projectsCol = collection(db, 'projects');
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
      console.warn('Firestore projects subscription error:', err);
      if (onError) onError(err);
    });
    return unsubscribe;
  } catch (e: any) {
    console.warn('Could not set up Firestore projects listener:', e);
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
  try {
    const chatCol = collection(db, 'chatMessages');
    await addDoc(chatCol, {
      ...msg,
      timestamp: msg.timestamp || new Date().toISOString(),
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.warn('Could not save chat message to Firestore:', error);
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
  try {
    const chatCol = collection(db, 'chatMessages');
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
      console.warn('Firestore chat messages subscription warning:', err);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('Could not set up chat listener:', e);
    return () => {};
  }
}

