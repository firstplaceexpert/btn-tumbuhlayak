'use client';

import React from 'react';

interface BtnLogoProps {
  inverted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

/**
 * Official Bank BTN wordmark paired with the TumbuhLayak Monogram TL + NFC Emblem (Opsi 2)
 */
export const BtnLogo: React.FC<BtnLogoProps> = ({
  inverted = false,
  size = 'md',
  showTagline = false,
}) => {
  const btnHeightClass =
    size === 'sm' ? 'h-5' : size === 'lg' ? 'h-8 sm:h-9' : 'h-7';
  const markSizeClass =
    size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <img
        src={inverted ? '/btn-logo-white.png' : '/btn-logo.png'}
        alt="Logo Bank BTN"
        width={426}
        height={240}
        className={`${btnHeightClass} w-auto object-contain flex-shrink-0 block`}
        decoding="async"
      />

      <div
        className={`inline-flex items-center gap-2 border-l pl-2.5 ${
          inverted ? 'border-white/25' : 'border-hairline'
        }`}
      >
        <img
          src={inverted ? '/brand/tumbuhlayak-mark-white.svg' : '/brand/tumbuhlayak-mark.svg'}
          alt="Logo TumbuhLayak"
          width={40}
          height={40}
          className={`${markSizeClass} object-contain flex-shrink-0 block`}
          decoding="async"
        />

        {showTagline && (
          <div className="leading-tight">
            <div className="font-display font-bold text-[15px] tracking-tight">
              <span className={inverted ? 'text-white' : 'text-brand'}>Tumbuh</span>
              <span className={inverted ? 'text-blue-100' : 'text-[#162B52]'}>Layak</span>
            </div>
            <div
              className={`text-[11px] font-medium ${
                inverted ? 'text-blue-100/90' : 'text-ink-secondary'
              }`}
            >
              Housing Innovation
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
