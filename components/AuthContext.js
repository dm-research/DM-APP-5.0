// components/AuthContext.js — v2
// Reads role from Firestore profile — supports god_admin, admin, researcher, user

import React, { createContext, useContext, useState, useEffect } from 'react';
import { listenAuthState, getUserProfile, checkTrialStatus } from '../firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = listenAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const { profile: p } = await getUserProfile(firebaseUser.uid);
        if (p) {
          if (p.role === 'user' || !p.role) {
            const updated = await checkTrialStatus(firebaseUser.uid, p);
            setProfile(updated);
          } else {
            setProfile(p);
          }
        } else {
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const role         = profile?.role ?? 'user';
  const isGodAdmin   = role === 'god_admin';
  const isAdmin      = role === 'admin' || role === 'god_admin';
  const isResearcher = role === 'researcher';
  const isStaff      = isAdmin || isResearcher;
  const isTrial      = profile?.isTrial === true;
  const isPaid       = profile?.isActive === true && !isTrial && !isStaff;
  const hasAgreed    = profile?.agreementAccepted === true;
  const hasAccess    = isPaid || isStaff;
  const trialActive  = isTrial && profile?.isActive === true;
  const emailVerified = user?.emailVerified === true;

  return (
    <AuthContext.Provider value={{
      user, profile, setProfile, loading,
      role, isGodAdmin, isAdmin, isResearcher, isStaff,
      isTrial, isPaid, hasAccess, hasAgreed, trialActive, emailVerified,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
