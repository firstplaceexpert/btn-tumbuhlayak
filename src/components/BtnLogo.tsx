'use client';

import React from 'react';

interface BtnLogoProps {
  inverted?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

/**
 * Official Bank BTN wordmark asset (standard blue+red & inverted white+red)
 */
export const BtnLogo: React.FC<BtnLogoProps> = ({
  inverted = false,
  size = 'md',
  showTagline = false,
}) => {
  const heightClass =
    size === 'sm' ? 'h-5' : size === 'lg' ? 'h-8 sm:h-9' : 'h-7';

  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      <img
        src={inverted ? '/btn-logo-white.png' : '/btn-logo.png'}
        alt="Logo Bank BTN"
        width={426}
        height={240}
        className={`${heightClass} w-auto object-contain flex-shrink-0 block`}
        decoding="async"
      />

      {showTagline && (
        <div
          className={`border-l pl-2.5 leading-tight ${
            inverted ? 'border-white/25' : 'border-hairline'
          }`}
        >
          <div
            className={`font-display font-semibold text-[15px] tracking-tight ${
              inverted ? 'text-white' : 'text-ink'
            }`}
          >
            TumbuhLayak
          </div>
          <div
            className={`text-xs font-medium ${
              inverted ? 'text-blue-100' : 'text-brand'
            }`}
          >
            Housing Innovation
          </div>
        </div>
      )}
    </div>
  );
};
