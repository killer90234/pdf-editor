import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { ensureUserProfile, canEdit, updateEditCount, PLAN_LIMITS } from '../services/firestoreService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  showLoginModal: false,
  showSignupModal: false,
  showPricingModal: false,

  setShowLoginModal: (show) => set({ showLoginModal: show, authError: null }),
  setShowSignupModal: (show) => set({ showSignupModal: show, authError: null }),
  setShowPricingModal: (show) => set({ showPricingModal: show }),

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await ensureUserProfile(user.uid, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
        set({ user, profile, loading: false });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    });
    return unsubscribe;
  },

  signInWithEmail: async (email, password) => {
    set({ authError: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      set({ showLoginModal: false });
    } catch (err) {
      let message = 'Login failed';
      if (err.code === 'auth/user-not-found') message = 'No account found with this email';
      if (err.code === 'auth/wrong-password') message = 'Incorrect password';
      if (err.code === 'auth/invalid-email') message = 'Invalid email address';
      if (err.code === 'auth/too-many-requests') message = 'Too many attempts. Try again later.';
      set({ authError: message });
    }
  },

  signUpWithEmail: async (email, password, displayName) => {
    set({ authError: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await ensureUserProfile(cred.user.uid, {
        email,
        displayName,
        photoURL: null,
      });
      set({ showSignupModal: false });
    } catch (err) {
      let message = 'Sign up failed';
      if (err.code === 'auth/email-already-in-use') message = 'Email already registered';
      if (err.code === 'auth/weak-password') message = 'Password must be at least 6 characters';
      if (err.code === 'auth/invalid-email') message = 'Invalid email address';
      set({ authError: message });
    }
  },

  signInWithGoogle: async () => {
    set({ authError: null });
    try {
      await signInWithPopup(auth, googleProvider);
      set({ showLoginModal: false, showSignupModal: false });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        set({ authError: 'Google sign-in failed. Please try again.' });
      }
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth);
    set({ user: null, profile: null });
  },

  checkAndIncrementEdit: async () => {
    const { user, profile } = get();

    // Guest user: handled by App.jsx, not here
    if (!user) {
      return { allowed: true, isGuest: true };
    }

    // Ensure profile is loaded
    let currentProfile = profile;
    if (!currentProfile) {
      await new Promise(r => setTimeout(r, 500));
      currentProfile = get().profile;
      if (!currentProfile) {
        console.error('❌ Profile still null after wait');
        return { allowed: false, reason: 'profile_loading' };
      }
    }

    // Ensure editsUsed is a number
    const editsUsed = currentProfile.editsUsed ?? 0;
    const planKey = currentProfile.plan || 'free';

    console.log('📊 Edit check:', { plan: planKey, editsUsed, limit: PLAN_LIMITS[planKey]?.maxEdits });

    // Check limit
    const result = canEdit({ ...currentProfile, editsUsed });
    if (!result.allowed) {
      console.log('🚫 LIMIT REACHED - blocking edit');
      set({ showPricingModal: true });
      return { allowed: false, reason: result.reason };
    }

    // Increment count
    const today = new Date().toISOString().split('T')[0];
    const plan = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
    let newCount;
    if (plan.period === 'lifetime') {
      newCount = editsUsed + 1;
    } else {
      newCount = (currentProfile.lastEditDate === today) ? editsUsed + 1 : 1;
    }

    console.log('✏️ Charging edit:', editsUsed, '->', newCount);

    // Update Firestore
    try {
      await updateEditCount(user.uid, newCount);
    } catch (err) {
      console.error('❌ Failed to update edit count:', err);
    }

    // Update local state
    set({
      profile: {
        ...currentProfile,
        editsUsed: newCount,
        lastEditDate: today,
      },
    });

    return { allowed: true, isGuest: false };
  },
}));
