import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export const PLAN_LIMITS = {
  free: { maxEdits: 3, period: 'lifetime', price: 0, label: 'Free' },
  basic: { maxEdits: 10, period: 'daily', price: 99, label: 'Basic' },
  premium: { maxEdits: 25, period: 'daily', price: 169, label: 'Premium' },
  max: { maxEdits: 50, period: 'daily', price: 249, label: 'Max' },
};

export async function getUserProfile(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    return {
      id: snap.id,
      email: data.email || '',
      displayName: data.displayName || '',
      plan: data.plan || 'free',
      planExpiry: data.planExpiry || null,
      editsUsed: data.editsUsed ?? 0,
      lastEditDate: data.lastEditDate || null,
      createdAt: data.createdAt || null,
    };
  }
  return null;
}

export async function createUserProfile(uid, data) {
  const ref = doc(db, 'users', uid);
  const profile = {
    email: data.email || '',
    displayName: data.displayName || '',
    photoURL: data.photoURL || '',
    plan: 'free',
    planExpiry: null,
    editsUsed: 0,
    lastEditDate: null,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, profile);
  return profile;
}

export async function ensureUserProfile(uid, data) {
  const existing = await getUserProfile(uid);
  if (existing) return existing;
  return createUserProfile(uid, data);
}

export async function updateEditCount(uid, newCount) {
  const ref = doc(db, 'users', uid);
  const today = new Date().toISOString().split('T')[0];
  try {
    await updateDoc(ref, {
      editsUsed: newCount,
      lastEditDate: today,
    });
    console.log('✅ Firestore updated: editsUsed =', newCount);
  } catch (err) {
    console.error('❌ Firestore update failed:', err.message);
    // If doc doesn't exist, create it
    if (err.code === 'not-found') {
      await setDoc(ref, { editsUsed: newCount, lastEditDate: today }, { merge: true });
    }
  }
}

export async function updatePlan(uid, plan) {
  const ref = doc(db, 'users', uid);
  const expiry = plan === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await updateDoc(ref, {
    plan,
    planExpiry: expiry,
    editsUsed: 0,
    lastEditDate: null,
  });
}

export function canEdit(profile) {
  if (!profile) return { allowed: false, reason: 'not_logged_in' };

  const planKey = profile.plan || 'free';
  const plan = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;
  const editsUsed = profile.editsUsed ?? 0; // Default to 0 if undefined/null
  const today = new Date().toISOString().split('T')[0];

  // Check if paid plan has expired
  if (planKey !== 'free' && profile.planExpiry) {
    const expiry = profile.planExpiry.toDate ? profile.planExpiry.toDate() : new Date(profile.planExpiry);
    if (expiry < new Date()) {
      return { allowed: false, reason: 'plan_expired', plan };
    }
  }

  if (plan.period === 'lifetime') {
    // Free plan: lifetime limit
    if (editsUsed >= plan.maxEdits) {
      return { allowed: false, reason: 'lifetime_limit', plan };
    }
  } else {
    // Paid plan: daily limit — reset if new day
    if (profile.lastEditDate !== today) {
      return { allowed: true, plan, editsUsed: 0 };
    }
    if (editsUsed >= plan.maxEdits) {
      return { allowed: false, reason: 'daily_limit', plan };
    }
  }

  return { allowed: true, plan, editsUsed };
}
