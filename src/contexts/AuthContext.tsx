import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkUserMethods: (email: string) => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!db) return;
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Real-time listener for user document
        const unsubscribeSnapshot = onSnapshot(userDocRef, async (docSnapshot) => {
          let role: 'user' | 'admin' = 'user';
          let userData = {};

          if (docSnapshot.exists()) {
            userData = docSnapshot.data();
            role = (userData as any).role || 'user';
            
            // Force admin role for specific email if not already set
            if (firebaseUser.email === 'admin@example.com' && role !== 'admin') {
              role = 'admin';
              // Update firestore asynchronously to fix it for next time
              setDoc(userDocRef, { role: 'admin' }, { merge: true }).catch(console.error);
            }
          } else {
            // Create user doc if it doesn't exist
            if (firebaseUser.email === 'admin@example.com') {
              role = 'admin';
            }
            await setDoc(userDocRef, {
              email: firebaseUser.email,
              role,
              createdAt: new Date(),
              profileCompleted: false
            });
            userData = { role, profileCompleted: false };
          }

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: (userData as any).displayName || firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            role,
            phoneNumber: (userData as any).phoneNumber || null,
            profileCompleted: (userData as any).profileCompleted || false
          });
          setIsAdmin(role === 'admin');
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    if (!auth || !db) throw new Error("Firebase not configured");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Create user document in Firestore
    // Check if it's the admin email
    const role = email === 'admin@example.com' ? 'admin' : 'user';
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email,
      displayName: name,
      role, 
      createdAt: new Date(),
      profileCompleted: false
    });
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    if (!auth || !db) throw new Error("Firebase not configured");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if user doc exists, if not create it
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName,
        role: 'user',
        createdAt: new Date(),
        profileCompleted: false
      });
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) throw new Error("Firebase not configured");
    await sendPasswordResetEmail(auth, email);
  };

  const checkUserMethods = async (email: string) => {
    if (!auth) throw new Error("Firebase not configured");
    return await fetchSignInMethodsForEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout, loginWithGoogle, resetPassword, checkUserMethods }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
