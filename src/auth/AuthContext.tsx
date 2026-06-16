import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { userProfilePath } from '../lib/firestorePaths';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  firebaseReady: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getMissingFirebaseMessage = () =>
  'Firebase is not configured. Add the VITE_FIREBASE_* values to your local environment before using authentication.';

const ensureUserProfile = async (user: User, displayName?: string) => {
  if (!db) return;

  const userRef = doc(db, userProfilePath(user.uid));
  const snapshot = await getDoc(userRef);
  const resolvedDisplayName = displayName || user.displayName || '';
  const profile = {
    uid: user.uid,
    email: user.email || '',
    displayName: resolvedDisplayName,
    updatedAt: serverTimestamp(),
  };

  if (snapshot.exists()) {
    await setDoc(userRef, profile, { merge: true });
    return;
  }

  await setDoc(userRef, {
    ...profile,
    createdAt: serverTimestamp(),
  });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          await ensureUserProfile(nextUser);
        } catch (error) {
          console.error('Unable to ensure Firestore user profile.', error);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string,
  ) => {
    if (!auth) throw new Error(getMissingFirebaseMessage());

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const cleanDisplayName = displayName?.trim();
    if (cleanDisplayName) {
      await updateProfile(credential.user, { displayName: cleanDisplayName });
    }
    try {
      await ensureUserProfile(credential.user, cleanDisplayName);
    } catch (error) {
      console.error('Unable to create Firestore user profile.', error);
    }
    setUser(credential.user);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error(getMissingFirebaseMessage());

    const credential = await signInWithEmailAndPassword(auth, email, password);
    try {
      await ensureUserProfile(credential.user);
    } catch (error) {
      console.error('Unable to ensure Firestore user profile.', error);
    }
    setUser(credential.user);
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    firebaseReady: isFirebaseConfigured,
    signUp,
    signIn,
    signOut,
  }), [loading, signIn, signOut, signUp, user]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}
