import React from 'react';
import PricingCard from './PricingCard';
import { useAuthStore } from '../../store/authStore';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      '3 PDF edits (lifetime)',
      'Basic text editing',
      'Download edited PDFs',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    features: [
      '10 PDF edits per day',
      'All editing tools',
      'Priority support',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 169,
    isPopular: true,
    features: [
      '25 PDF edits per day',
      'All editing tools',
      'Priority support',
      'Early access to features',
    ],
  },
  {
    id: 'max',
    name: 'Max',
    price: 249,
    features: [
      '50 PDF edits per day',
      'All editing tools',
      'Dedicated support',
      'Early access to features',
    ],
  },
];

export default function PricingPage({ onClose }) {
  const { profile, setShowLoginModal } = useAuthStore();

  const handleSelect = (planId) => {
    if (!profile) {
      setShowLoginModal(true);
      if (onClose) onClose();
      return;
    }
    window.open('https://inforium-alliance.netlify.app/contact', '_blank');
  };

  return (
    <>
      <style>{`
        .pricing-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6); display: flex; align-items: center;
          justify-content: center; z-index: 1000; padding: 16px;
          overflow-y: auto;
        }
        .pricing-container {
          background: #f9fafb; border-radius: 16px; padding: 36px 24px;
          width: 100%; max-width: 1080px; position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3); margin: auto;
        }
        .pricing-close {
          position: absolute; top: 12px; right: 16px;
          background: none; border: none; font-size: 28px;
          cursor: pointer; color: #6b7280; line-height: 1;
        }
        .pricing-title {
          font-size: 24px; font-weight: 700; color: #111827;
          text-align: center; margin: 0 0 6px 0;
        }
        .pricing-subtitle {
          font-size: 14px; color: #6b7280; text-align: center;
          margin: 0 0 28px 0;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          max-width: 960px;
          margin: 0 auto;
        }
        .pricing-note {
          text-align: center; margin-top: 20px; font-size: 13px;
          color: #9ca3af;
        }
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 500px) {
          .pricing-grid { grid-template-columns: 1fr; }
          .pricing-container { padding: 28px 16px; }
          .pricing-title { font-size: 20px; }
          .pricing-subtitle { font-size: 13px; }
        }
      `}</style>

      <div className="pricing-overlay" onClick={onClose}>
        <div className="pricing-container" onClick={(e) => e.stopPropagation()}>
          <button className="pricing-close" onClick={onClose}>&times;</button>
          <h2 className="pricing-title">Choose Your Plan</h2>
          <p className="pricing-subtitle">Unlock more PDF edits with a plan that fits your needs</p>

          <div className="pricing-grid">
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                name={plan.name}
                price={plan.price}
                features={plan.features}
                isCurrent={profile?.plan === plan.id}
                isPopular={plan.isPopular}
                onSelect={() => handleSelect(plan.id)}
              />
            ))}
          </div>

          <p className="pricing-note">
            All paid plans are billed monthly. Payment integration coming soon.
          </p>
        </div>
      </div>
    </>
  );
}
