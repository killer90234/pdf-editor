import React from 'react';

export default function PricingCard({ name, price, features, isCurrent, isPopular, onSelect }) {
  // Calculate "original" price (20% higher) for display only
  const originalPrice = price > 0 ? Math.round(price / 0.8) : 0;

  return (
    <>
      <style>{`
        .pricing-card {
          background: white; border-radius: 12px; padding: 24px 20px;
          position: relative; display: flex; flex-direction: column;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          min-width: 0;
        }
        .pricing-card-badge {
          position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
          color: white; padding: 3px 12px; border-radius: 20px;
          font-size: 11px; font-weight: 600; white-space: nowrap;
        }
        .pricing-card-discount {
          position: absolute; top: 10px; right: 10px;
          background: #ef4444; color: white; padding: 2px 8px;
          border-radius: 4px; font-size: 11px; font-weight: 700;
        }
        .pricing-card-name {
          font-size: 17px; font-weight: 700; color: #111827;
          margin: 0 0 10px 0; text-align: center;
        }
        .pricing-card-price {
          text-align: center; margin-bottom: 20px;
        }
        .pricing-card-original {
          font-size: 14px; color: #9ca3af; text-decoration: line-through;
          margin-bottom: 2px;
        }
        .pricing-card-currency {
          font-size: 18px; font-weight: 600; color: #374151;
          vertical-align: top;
        }
        .pricing-card-amount {
          font-size: 36px; font-weight: 700; color: #111827;
        }
        .pricing-card-period {
          font-size: 13px; color: #6b7280;
        }
        .pricing-card-features {
          list-style: none; padding: 0; margin: 0 0 20px 0;
          flex: 1;
        }
        .pricing-card-feature {
          font-size: 13px; color: #374151; padding: 5px 0;
          display: flex; align-items: center; gap: 6px;
        }
        .pricing-card-check {
          color: #10b981; font-weight: 700; font-size: 13px; flex-shrink: 0;
        }
        .pricing-card-btn {
          width: 100%; padding: 9px 16px; color: white;
          border: none; border-radius: 8px; font-size: 14px;
          font-weight: 600; cursor: pointer;
        }
      `}</style>

      <div
        className="pricing-card"
        style={{
          border: isCurrent ? '2px solid #3b82f6' : isPopular ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
        }}
      >
        {isPopular && (
          <div className="pricing-card-badge" style={{ background: '#8b5cf6' }}>Most Popular</div>
        )}
        {isCurrent && (
          <div className="pricing-card-badge" style={{ background: '#3b82f6' }}>Current Plan</div>
        )}
        {price > 0 && (
          <div className="pricing-card-discount">20% OFF</div>
        )}

        <h3 className="pricing-card-name">{name}</h3>
        <div className="pricing-card-price">
          {price > 0 && (
            <div className="pricing-card-original">&#8377;{originalPrice}/mo</div>
          )}
          <span className="pricing-card-currency">{price === 0 ? '' : '\u20B9'}</span>
          <span className="pricing-card-amount">{price === 0 ? 'Free' : price}</span>
          {price > 0 && <span className="pricing-card-period">/month</span>}
        </div>

        <ul className="pricing-card-features">
          {features.map((f, i) => (
            <li key={i} className="pricing-card-feature">
              <span className="pricing-card-check">&#10003;</span>
              {f}
            </li>
          ))}
        </ul>

        {!isCurrent && (
          <button
            className="pricing-card-btn"
            style={{ background: isPopular ? '#8b5cf6' : '#3b82f6' }}
            onClick={onSelect}
          >
            {price === 0 ? 'Get Started' : 'Upgrade'}
          </button>
        )}
      </div>
    </>
  );
}
