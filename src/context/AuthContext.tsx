import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { Profile } from '@/types';

export type Plan = 'free' | 'member';
type AppUser = FirebaseUser & { id: string };

interface AuthContextValue {
  user: AppUser | null;
  profile: Profile | null;
  loading: boolean;
  plan: Plan;
  signInWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const googleProvider = new GoogleAuthProvider();
const profileRequests = new Map<string, Promise<{ plan: Plan; profile: Profile }>>();

function withLegacyId(user: FirebaseUser): AppUser {
  return new Proxy(user, {
    get(target, property, receiver) {
      return property === 'id' ? target.uid : Reflect.get(target, property, receiver);
    },
  }) as AppUser;
}

function toProfile(
  user: FirebaseUser,
  data: { name?: string; plan?: Plan; createdAt?: Timestamp }
): Profile {
  const createdAt = data.createdAt?.toDate().toISOString() ?? new Date().toISOString();
  return {
    id: user.uid,
    full_name: data.name || user.displayName || '',
    avatar_url: user.photoURL || '',
    role: data.plan || 'free',
    bio: '',
    created_at: createdAt,
    updated_at: createdAt,
  };
}

async function loadUserProfile(user: FirebaseUser, name?: string) {
  const pending = profileRequests.get(user.uid);
  if (pending) return pending;

  const request = (async () => {
    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);
    let data: { name?: string; plan?: Plan; createdAt?: Timestamp };

    if (snapshot.exists()) {
      data = snapshot.data() as typeof data;
    } else {
      data = { name: name?.trim() || user.displayName || '', plan: 'free' };
      await setDoc(userRef, {
        email: user.email || '',
        name: data.name,
        plan: 'free',
        createdAt: serverTimestamp(),
      });
    }

    return {
      plan: data.plan === 'member' ? 'member' as const : 'free' as const,
      profile: toProfile(user, data),
    };
  })();
  profileRequests.set(user.uid, request);
  try {
    return await request;
  } finally {
    profileRequests.delete(user.uid);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan>('free');
  const pendingRegistrationName = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active) return;
      setLoading(true);
      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setPlan('free');
        setLoading(false);
        return;
      }

      setUser(withLegacyId(firebaseUser));
      try {
        const result = await loadUserProfile(firebaseUser, pendingRegistrationName.current || undefined);
        if (!active) return;
        setProfile(result.profile);
        setPlan(result.plan);
      } catch (error) {
        console.error('Could not load Firebase user profile:', error);
        if (active) {
          setProfile(toProfile(firebaseUser, { name: firebaseUser.displayName || '', plan: 'free' }));
          setPlan('free');
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const registerWithEmail = async (email: string, password: string, name?: string) => {
    pendingRegistrationName.current = name?.trim() || null;
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (name?.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      const result = await loadUserProfile(credential.user, name);
      setProfile(result.profile);
      setPlan(result.plan);
    } finally {
      pendingRegistrationName.current = null;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const result = await loadUserProfile(credential.user);
    setProfile(result.profile);
    setPlan(result.plan);
  };

  const logout = () => firebaseSignOut(auth);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    const result = await loadUserProfile(auth.currentUser);
    setProfile(result.profile);
    setPlan(result.plan);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, plan, signInWithGoogle, registerWithEmail, signInWithEmail, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
