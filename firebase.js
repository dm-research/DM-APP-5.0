// firebase.js - Dynamic Money Research App
// Roles: god_admin > admin > researcher > user

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyD08aJYKAmkNf9re2w_RQ45m_SQQDnIOWo',
  authDomain:        'dm-research.firebaseapp.com',
  projectId:         'dm-research',
  storageBucket:     'dm-research.firebasestorage.app',
  messagingSenderId: '722751389363',
  appId:             '1:722751389363:web:25d76f84852d81244afac6',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (_e) {
  auth = getAuth(app);
}

export { auth, onSnapshot };
export const db = getFirestore(app);

export const ADMIN_EMAIL     = 'admin@dmresearch.in';
export const GOD_ADMIN_EMAIL = 'godadmin@dmresearch.in';

// ── ROLE HELPERS ──────────────────────────────────────────────────────────────

export const ROLES = {
  GOD_ADMIN:  'god_admin',
  ADMIN:      'admin',
  RESEARCHER: 'researcher',
  USER:       'user',
};

export const RESEARCHER_INVITE_CODE = 'DMRA2025'; // ← Change this to your secret code

export const isGodAdmin   = (p) => p?.role === ROLES.GOD_ADMIN;
export const isAdmin      = (p) => p?.role === ROLES.ADMIN || p?.role === ROLES.GOD_ADMIN;
export const isResearcher = (p) => p?.role === ROLES.RESEARCHER;
export const isStaff      = (p) => ['god_admin','admin','researcher'].includes(p?.role);

// ── AUTH ──────────────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    return { user: cred.user, error: null };
  } catch (err) {
    return { user: null, error: friendlyAuthError(err.code) };
  }
}

export async function registerUser(email, password, profileData) {
  try {
    const cred = await createUserWithEmailAndPassword(
      auth, email.trim().toLowerCase(), password
    );
    const uid = cred.user.uid;
    await cred.user.sendEmailVerification();

    const configSnap = await getDoc(doc(db, 'config', 'settings'));
    const trialDays  = configSnap.exists() ? (configSnap.data().trialDays ?? 7) : 7;

    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + trialDays);

    await setDoc(doc(db, 'users', uid), {
      ...profileData,
      email:             email.trim().toLowerCase(),
      plan:              'Free Trial',
      segment:           '',
      subscribedSegments: ['Cash','Options','Futures','MCX','Index'],
      segments:           ['Cash','Options','Futures','MCX','Index'],
      isActive:          true,
      isTrial:           true,
      trialExpiry,
      planStart:         new Date(),
      planExpiry:        trialExpiry,
      role:              ROLES.USER,
      agreementAccepted: false,
      createdAt:         serverTimestamp(),
    });
    return { user: cred.user, error: null };
  } catch (err) {
    return { user: null, error: friendlyAuthError(err.code) };
  }
}

// ── RESEARCHER SELF-SIGNUP with invite code ───────────────────────────────────
export async function registerResearcher(email, password, profileData, inviteCode) {
  // Validate invite code first — never expose this check on client alone
  if (inviteCode?.trim().toUpperCase() !== RESEARCHER_INVITE_CODE) {
    return { user: null, error: 'Invalid invite code. Contact your administrator.' };
  }
  try {
    const cred = await createUserWithEmailAndPassword(
      auth, email.trim().toLowerCase(), password
    );
    const uid = cred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      name:        profileData.name        || '',
      email:       email.trim().toLowerCase(),
      phone:       profileData.phone       || '',
      speciality:  profileData.speciality  || 'Equity',
      bio:         profileData.bio         || '',
      role:        ROLES.RESEARCHER,
      isActive:    false,        // ← Pending approval by god_admin
      isTrial:     false,
      isDeleted:   false,
      plan:        'Staff',
      agreementAccepted: false,
      pendingApproval:   true,   // ← god_admin sees this and approves
      createdAt:   serverTimestamp(),
    });

    return { user: cred.user, error: null };
  } catch (err) {
    return { user: null, error: friendlyAuthError(err.code) };
  }
}

export async function logoutUser() {
  try { await signOut(auth); return { error: null }; }
  catch (err) { return { error: err.message }; }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    return { error: null };
  } catch (err) { return { error: friendlyAuthError(err.code) }; }
}

export function listenAuthState(cb) { return onAuthStateChanged(auth, cb); }

// ── USER PROFILE ──────────────────────────────────────────────────────────────

export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists()
      ? { profile: snap.data(), error: null }
      : { profile: null, error: 'not_found' };
  } catch (err) { return { profile: null, error: err.message }; }
}

export async function checkTrialStatus(uid, profile) {
  if (!profile?.isTrial) return profile;
  try {
    const expiry = profile.trialExpiry?.toDate
      ? profile.trialExpiry.toDate() : new Date(profile.trialExpiry);
    if (new Date() > expiry) {
      await updateDoc(doc(db, 'users', uid), { isTrial: false, isActive: false });
      return { ...profile, isTrial: false, isActive: false };
    }
    return profile;
  } catch (_e) { return profile; }
}

export async function acceptAgreement(uid) {
  try {
    await setDoc(doc(db, 'users', uid),
      { agreementAccepted: true, agreementDate: serverTimestamp() },
      { merge: true });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

export async function updateProfile(uid, data) {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

// ── PUSH TOKEN ────────────────────────────────────────────────────────────────

export async function savePushToken(uid, token) {
  try {
    await setDoc(doc(db, 'pushTokens', uid), { token, updatedAt: serverTimestamp() });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

// ── CALLS ─────────────────────────────────────────────────────────────────────

export function buildCallsQuery(filters = {}, maxResults = 100) {
  const constraints = [];
  constraints.push(where('isHidden', '==', false));
  if (filters.segment)   constraints.push(where('segment',   '==', filters.segment));
  if (filters.timeframe) constraints.push(where('timeframe', '==', filters.timeframe));
  constraints.push(orderBy('postedAt', 'desc'));
  constraints.push(limit(maxResults));
  return query(collection(db, 'calls'), ...constraints);
}

export async function getCalls(filters = {}) {
  try {
    const snap = await getDocs(buildCallsQuery(filters));
    return { calls: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (err) { return { calls: [], error: err.message }; }
}

export function listenCalls(filters, callback, onError, maxResults = 100) {
  const q = buildCallsQuery(filters, maxResults);
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err)  => onError?.(err.message),
  );
}

export async function addCall(data) {
  try {
    await addDoc(collection(db, 'calls'), {
      ...data,
      postedAt: serverTimestamp(),
      isHidden: false,
    });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

export async function updateCall(id, data) {
  try { await updateDoc(doc(db, 'calls', id), data); return { error: null }; }
  catch (err) { return { error: err.message }; }
}

export async function deleteCall(id) {
  try { await deleteDoc(doc(db, 'calls', id)); return { error: null }; }
  catch (err) { return { error: err.message }; }
}

// ── ARTICLES ──────────────────────────────────────────────────────────────────

export function buildArticlesQuery(category = null) {
  const constraints = category
    ? [where('category', '==', category), orderBy('createdAt', 'desc'), limit(50)]
    : [orderBy('createdAt', 'desc'), limit(50)];
  return query(collection(db, 'articles'), ...constraints);
}

export async function getArticles(category = null) {
  try {
    const snap = await getDocs(buildArticlesQuery(category));
    return { articles: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (err) { return { articles: [], error: err.message }; }
}

export function listenArticles(category, callback, onError) {
  const q = buildArticlesQuery(category);
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err)  => onError?.(err.message),
  );
}

export async function addArticle(data) {
  try {
    await addDoc(collection(db, 'articles'), { ...data, createdAt: serverTimestamp() });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

export async function deleteArticle(id) {
  try { await deleteDoc(doc(db, 'articles', id)); return { error: null }; }
  catch (err) { return { error: err.message }; }
}

// ── USER MANAGEMENT ───────────────────────────────────────────────────────────

// ✅ FIXED: Fetch ALL users ordered by createdAt — no role filter
// This catches users with role:'user', role missing, or any edge case
export function listenAllUsers(callback, onError) {
  const q = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc'),
    limit(500),
  );
  return onSnapshot(
    q,
    (snap) => {
      // Filter out staff roles client-side — more reliable than Firestore query
      const users = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => !['god_admin','admin','researcher'].includes(u.role));
      callback(users);
    },
    (err) => onError?.(err.message),
  );
}

export async function getAllUsers() {
  try {
    const snap = await getDocs(
      query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    );
    return { users: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (err) { return { users: [], error: err.message }; }
}

export async function toggleUserActive(uid, isActive) {
  try {
    await updateDoc(doc(db, 'users', uid), { isActive, updatedAt: serverTimestamp() });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

export async function updateUserPlan(uid, planData) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...planData,
      isTrial:   false,
      isActive:  true,
      updatedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

export async function adminUpdateUser(uid, data) {
  try {
    await updateDoc(doc(db, 'users', uid), data);
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

// ── RESEARCHER MANAGEMENT ─────────────────────────────────────────────────────

export async function createResearcher(email, password, profileData) {
  try {
    const cred = await createUserWithEmailAndPassword(
      auth, email.trim().toLowerCase(), password
    );
    const uid = cred.user.uid;

    await setDoc(doc(db, 'users', uid), {
      name:        profileData.name        || '',
      email:       email.trim().toLowerCase(),
      phone:       profileData.phone       || '',
      speciality:  profileData.speciality  || '',
      bio:         profileData.bio         || '',
      role:        ROLES.RESEARCHER,
      isActive:    true,
      isTrial:     false,
      isDeleted:   false,
      pendingApproval: false,
      plan:        'Staff',
      createdAt:   serverTimestamp(),
      createdBy:   profileData.createdBy   || '',
    });

    return { uid, error: null };
  } catch (err) {
    return { uid: null, error: friendlyAuthError(err.code) };
  }
}

// ✅ FIXED: Listen to researchers — includes pendingApproval ones
export function listenResearchers(callback, onError) {
  const q = query(
    collection(db, 'users'),
    where('role', '==', ROLES.RESEARCHER),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err)  => onError?.(err.message),
  );
}

export async function approveResearcher(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isActive:        true,
      pendingApproval: false,
      approvedAt:      serverTimestamp(),
    });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

export async function toggleResearcherActive(uid, isActive) {
  try {
    await updateDoc(doc(db, 'users', uid), { isActive, updatedAt: serverTimestamp() });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

export async function updateResearcher(uid, data) {
  try {
    await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

export async function deleteResearcher(uid) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      isActive:  false,
      isDeleted: true,
      deletedAt: serverTimestamp(),
    });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

export async function getResearcherCalls(researcherUid) {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'calls'),
        where('postedBy', '==', researcherUid),
        orderBy('postedAt', 'desc'),
        limit(50),
      )
    );
    return { calls: snap.docs.map(d => ({ id: d.id, ...d.data() })), error: null };
  } catch (err) { return { calls: [], error: err.message }; }
}

// ── CONFIG ────────────────────────────────────────────────────────────────────

export async function getConfig() {
  try {
    const snap = await getDoc(doc(db, 'config', 'settings'));
    return snap.exists() ? snap.data() : { trialDays: 7 };
  } catch (_e) { return { trialDays: 7 }; }
}

export async function updateConfig(data) {
  try {
    await setDoc(doc(db, 'config', 'settings'), data, { merge: true });
    return { error: null };
  } catch (err) { return { error: err.message }; }
}

// ── ERROR MAP ─────────────────────────────────────────────────────────────────

function friendlyAuthError(code) {
  const map = {
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password.',
    'auth/invalid-email':          'Please enter a valid email.',
    'auth/email-already-in-use':   'An account with this email already exists.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/user-disabled':          'Account disabled. Contact support.',
    'auth/too-many-requests':      'Too many attempts. Try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential':     'Incorrect email or password.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
