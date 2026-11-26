'use client';

import React, { useEffect, useState } from 'react';

interface BrandSplashLoaderProps {
  /** 'initial' for first-load full splash (~1.85s), 'transition' for crisp login transition (~1.05s) */
  variant?: 'initial' | 'transition';
  subtitle?: string;
  onComplete?: () => void;
}

/**
 * Fullscreen TumbuhLayak brand loading splash:
 * Centered Opsi 2 Emblem + "TumbuhLayak" wordmark starting monochrome (uncolored)
 * and smoothly filling left-to-right into full BTN Royal Blue & Crimson color.
 */
export const BrandSplashLoader: React.FC<BrandSplashLoaderProps> = ({
  variant = 'initial',
  subtitle = 'Bank BTN · Housing Innovation',
  onComplete,
}) => {
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const holdMs = prefersReduced ? 220 : variant === 'initial' ? 1600 : 900;
    const exitMs = prefersReduced ? 120 : 380;

    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, holdMs);

    const doneTimer = window.setTimeout(() => {
      setMounted(false);
      onComplete?.();
    }, holdMs + exitMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [variant, onComplete]);

  if (!mounted) return null;

  const isFast = variant === 'transition';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat portal btn TumbuhLayak"
      className={`fixed inset-0 z-[100] bg-frame flex flex-col items-center justify-center px-6 transition-all duration-[380ms] ease-out ${
        exiting ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Soft ambient warm BTN glow behind centered logo */}
      <div
        className="pointer-events-none absolute w-[360px] h-[360px] rounded-full bg-brand/[0.07] blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute w-[220px] h-[220px] translate-x-20 -translate-y-10 rounded-full bg-btnred/[0.06] blur-3xl"
        aria-hidden="true"
      />

      {/* Centered Logo Lockup: Monochrome Base + Full-Color Animated Sweep Overlay */}
      <div className="relative z-10 flex flex-col items-center gap-6 select-none">
        <div className="relative inline-flex items-center gap-3.5 sm:gap-4">
          {/* Layer 1: Base Uncolored / Monochrome Ghost Logo & Wordmark */}
          <div
            className="inline-flex items-center gap-3.5 sm:gap-4 grayscale opacity-25"
            aria-hidden="true"
          >
            <img
              src="/brand/tumbuhlayak-mark.svg"
              alt=""
              width={64}
              height={64}
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0 block"
            />
            <div className="font-display font-extrabold text-3xl sm:text-[42px] tracking-[-0.025em] leading-none text-ink">
              TumbuhLayak
            </div>
          </div>

          {/* Layer 2: Vivid BTN Full-Color Overlay Sweeping Left -> Right */}
          <div
            className={`absolute inset-0 inline-flex items-center gap-3.5 sm:gap-4 ${
              isFast ? 'animate-brand-color-fill-fast' : 'animate-brand-color-fill'
            }`}
          >
            <img
              src="/brand/tumbuhlayak-mark.svg"
              alt="Logo TumbuhLayak"
              width={64}
              height={64}
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain flex-shrink-0 block"
            />
            <div className="font-display font-extrabold text-3xl sm:text-[42px] tracking-[-0.025em] leading-none">
              <span className="text-brand">Tumbuh</span>
              <span className="text-[#162B52]">Layak</span>
            </div>
          </div>
        </div>

        {/* Sleek Synchronized Loading Progress Hairline & Caption */}
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-44 sm:w-52 h-1 rounded-full bg-hairline overflow-hidden">
            <div
              className={`h-full w-full rounded-full bg-gradient-to-r from-brand via-brand to-btnred ${
                isFast ? 'animate-brand-progress-fast' : 'animate-brand-progress'
              }`}
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
            <img
              src="/btn-logo.png"
              alt="Bank BTN"
              className="h-3.5 w-auto object-contain opacity-85"
            />
            <span className="text-hairline">|</span>
            <span>{subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
