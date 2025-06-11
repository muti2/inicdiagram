import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  settings: {
    darkMode: boolean;
    defaultExportFormat: 'csv' | 'xlsx' | 'json';
    autoSaveEnabled: boolean;
    notificationsEnabled: boolean;
  };
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Create user profile in Firestore
  const createUserProfile = async (user: User, additionalData: any = {}) => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();
      
      // Log photo URL for debugging
      console.log('Creating user profile with photoURL:', photoURL);
      
      const defaultProfile: UserProfile = {
        uid: user.uid,
        email: email || '',
        displayName: displayName || additionalData.displayName || '',
        photoURL: photoURL || undefined,
        createdAt,
        lastLoginAt: createdAt,
        settings: {
          darkMode: false,
          defaultExportFormat: 'csv',
          autoSaveEnabled: true,
          notificationsEnabled: true,
        },
        ...additionalData,
      };

      try {
        await setDoc(userRef, defaultProfile);
        setUserProfile(defaultProfile);
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    } else {
      // User exists, sync with Firebase Auth data
      const profileData = userSnap.data() as UserProfile;
      let needsUpdate = false;
      const updates: any = {
        lastLoginAt: new Date(),
      };

      // Sync photoURL from Firebase Auth if different
      if (user.photoURL && user.photoURL !== profileData.photoURL) {
        updates.photoURL = user.photoURL;
        needsUpdate = true;
        console.log('Updating photoURL from Firebase Auth:', user.photoURL);
      }

      // Sync displayName from Firebase Auth if different  
      if (user.displayName && user.displayName !== profileData.displayName) {
        updates.displayName = user.displayName;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await updateDoc(userRef, updates);
        setUserProfile({ ...profileData, ...updates });
      } else {
        await updateDoc(userRef, { lastLoginAt: new Date() });
        setUserProfile(profileData);
      }
    }
  };

  // Load user profile from Firestore
  const loadUserProfile = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const profileData = userSnap.data() as UserProfile;
        
        // Check if Firebase Auth has newer profile data (especially photoURL)
        let needsUpdate = false;
        const updates: any = {
          lastLoginAt: new Date(),
        };

        // Sync photoURL from Firebase Auth if different
        if (user.photoURL && user.photoURL !== profileData.photoURL) {
          updates.photoURL = user.photoURL;
          needsUpdate = true;
        }

        // Sync displayName from Firebase Auth if different
        if (user.displayName && user.displayName !== profileData.displayName) {
          updates.displayName = user.displayName;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await updateDoc(userRef, updates);
          setUserProfile({ ...profileData, ...updates });
        } else {
          await updateDoc(userRef, { lastLoginAt: new Date() });
          setUserProfile(profileData);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const signup = async (email: string, password: string, displayName: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(user, {
      displayName: displayName,
    });
    
    // Create user profile in Firestore
    await createUserProfile(user, { displayName });
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    setUserProfile(null);
    return signOut(auth);
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Request additional scopes to ensure we get the profile photo
    provider.addScope('profile');
    provider.addScope('email');
    
    const { user } = await signInWithPopup(auth, provider);
    
    // Log the user data for debugging
    console.log('Google sign-in user data:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      providerData: user.providerData
    });
    
    await createUserProfile(user);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const updatedProfile = { ...userProfile, ...updates };
    
    await updateDoc(userRef, updates);
    setUserProfile(updatedProfile);

    // Update Firebase Auth profile if display name or photo changed
    if (updates.displayName || updates.photoURL) {
      await updateProfile(currentUser, {
        displayName: updates.displayName || currentUser.displayName,
        photoURL: updates.photoURL || currentUser.photoURL,
      });
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!currentUser || !currentUser.email) {
      throw new Error('No authenticated user');
    }

    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    
    // Update password
    await updatePassword(currentUser, newPassword);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserPassword,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};