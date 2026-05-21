import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { PLAN_LIMITS } from '../../services/firestoreService';

export default function UserProfile() {
  const { user, profile, signOut, setShowPricingModal } = useAuthStore();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const plan = PLAN_LIMITS[profile?.plan] || PLAN_LIMITS.free;
  const initial = (user.displayName || user.email || '?')[0].toUpperCase();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={styles.avatar}
        title={user.displayName || user.email}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" style={styles.avatarImg} />
        ) : (
          <span style={styles.avatarLetter}>{initial}</span>
        )}
      </button>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{user.displayName || 'User'}</div>
            <div style={styles.userEmail}>{user.email}</div>
          </div>

          <div style={styles.planBadge}>
            <span style={{
              ...styles.planTag,
              background: profile?.plan === 'free' ? '#f3f4f6' : '#dbeafe',
              color: profile?.plan === 'free' ? '#6b7280' : '#2563eb',
            }}>
              {plan.label} Plan
            </span>
          </div>

          <div style={styles.editInfo}>
            <div style={styles.editLabel}>Edits Used</div>
            <div style={styles.editCount}>
              {profile?.editsUsed || 0}
              {` / ${plan.maxEdits === Infinity ? 'Unlimited' : plan.maxEdits}`}
              {plan.period === 'daily' && <span style={styles.dailyTag}> today</span>}
              {plan.period === 'lifetime' && <span style={styles.dailyTag}> total</span>}
            </div>
          </div>

          <button
            style={styles.upgradeBtn}
            onClick={() => { setShowPricingModal(true); setOpen(false); }}
          >
            {profile?.plan === 'free' ? 'Upgrade Plan' : 'View Plans'}
          </button>

          <button style={styles.signOutBtn} onClick={signOut}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  avatar: {
    width: '36px', height: '36px', borderRadius: '50%',
    border: '2px solid #e5e7eb', cursor: 'pointer', overflow: 'hidden',
    background: '#3b82f6', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 0,
  },
  avatarImg: {
    width: '100%', height: '100%', objectFit: 'cover',
  },
  avatarLetter: {
    color: 'white', fontWeight: '600', fontSize: '15px',
  },
  dropdown: {
    position: 'absolute', top: '44px', right: 0,
    background: 'white', borderRadius: '10px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    border: '1px solid #e5e7eb', width: '260px',
    zIndex: 100, overflow: 'hidden',
  },
  userInfo: {
    padding: '14px 16px', borderBottom: '1px solid #f3f4f6',
  },
  userName: {
    fontWeight: '600', fontSize: '14px', color: '#111827',
  },
  userEmail: {
    fontSize: '13px', color: '#6b7280', marginTop: '2px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  planBadge: {
    padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
  },
  planTag: {
    display: 'inline-block', padding: '4px 10px', borderRadius: '6px',
    fontSize: '12px', fontWeight: '600',
  },
  editInfo: {
    padding: '10px 16px', borderBottom: '1px solid #f3f4f6',
  },
  editLabel: {
    fontSize: '12px', color: '#9ca3af', marginBottom: '2px',
  },
  editCount: {
    fontSize: '14px', fontWeight: '600', color: '#111827',
  },
  dailyTag: {
    fontSize: '12px', fontWeight: '400', color: '#9ca3af',
  },
  upgradeBtn: {
    width: '100%', padding: '10px 16px', background: '#3b82f6',
    color: 'white', border: 'none', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
  signOutBtn: {
    width: '100%', padding: '10px 16px', background: 'white',
    color: '#ef4444', border: 'none', fontSize: '14px',
    fontWeight: '500', cursor: 'pointer',
    borderTop: '1px solid #f3f4f6',
  },
};
