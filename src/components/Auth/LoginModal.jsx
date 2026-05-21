import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function LoginModal() {
  const { showLoginModal, setShowLoginModal, setShowSignupModal, signInWithEmail, signInWithGoogle, authError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!showLoginModal) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    signInWithEmail(email, password);
  };

  const switchToSignup = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };

  return (
    <div style={styles.overlay} onClick={() => setShowLoginModal(false)}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={() => setShowLoginModal(false)}>&times;</button>
        <h2 style={styles.title}>Sign In</h2>
        <p style={styles.subtitle}>Sign in to track your edits and manage your plan</p>

        {authError && <div style={styles.error}>{authError}</div>}

        <button style={styles.googleBtn} onClick={signInWithGoogle}>
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
            <path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerLine}></span>
          <span style={styles.dividerText}>or</span>
          <span style={styles.dividerLine}></span>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="your@email.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Your password"
              required
            />
          </div>
          <button type="submit" style={styles.submitBtn}>Sign In</button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{' '}
          <button style={styles.switchBtn} onClick={switchToSignup}>Sign Up</button>
        </p>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: 'white', borderRadius: '12px', padding: '32px',
    width: '100%', maxWidth: '400px', position: 'relative',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  closeBtn: {
    position: 'absolute', top: '12px', right: '16px',
    background: 'none', border: 'none', fontSize: '24px',
    cursor: 'pointer', color: '#6b7280',
  },
  title: {
    fontSize: '24px', fontWeight: '700', color: '#111827',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px', color: '#6b7280', marginBottom: '24px',
  },
  error: {
    padding: '10px 14px', background: '#fee2e2', color: '#dc2626',
    borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
  },
  googleBtn: {
    width: '100%', padding: '10px 16px', border: '1px solid #d1d5db',
    borderRadius: '8px', background: 'white', cursor: 'pointer',
    fontSize: '15px', fontWeight: '500', display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
    color: '#374151',
  },
  divider: {
    display: 'flex', alignItems: 'center', marginBottom: '16px',
  },
  dividerLine: {
    flex: 1, height: '1px', background: '#e5e7eb',
  },
  dividerText: {
    padding: '0 12px', fontSize: '13px', color: '#9ca3af',
  },
  field: {
    marginBottom: '14px',
  },
  label: {
    display: 'block', fontSize: '14px', fontWeight: '500',
    color: '#374151', marginBottom: '6px',
  },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid #d1d5db',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%', padding: '10px 16px', background: '#3b82f6',
    color: 'white', border: 'none', borderRadius: '8px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    marginTop: '8px',
  },
  switchText: {
    textAlign: 'center', marginTop: '16px', fontSize: '14px',
    color: '#6b7280',
  },
  switchBtn: {
    background: 'none', border: 'none', color: '#3b82f6',
    fontWeight: '600', cursor: 'pointer', fontSize: '14px',
  },
};
