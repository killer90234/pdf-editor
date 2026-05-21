import React from 'react';
import { useAuthStore } from '../store/authStore';

export default function PlanGuard({ onAllow, children }) {
  const { user, profile, checkAndIncrementEdit, setShowLoginModal, setShowPricingModal } = useAuthStore();

  const handleClick = async () => {
    // If not logged in, show login modal
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const result = await checkAndIncrementEdit();

    if (result.allowed) {
      onAllow();
    } else if (result.reason === 'not_logged_in') {
      setShowLoginModal(true);
    } else {
      // Limit exceeded - pricing modal is already shown by checkAndIncrementEdit
    }
  };

  return (
    <div onClick={handleClick} style={{ cursor: 'pointer' }}>
      {children}
    </div>
  );
}
