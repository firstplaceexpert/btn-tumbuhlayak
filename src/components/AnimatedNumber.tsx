'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Lightweight IntersectionObserver hook that flips to true once the element
 * enters the viewport (immediately true if reduced-motion is preferred).
 */
export function useInViewOnce(
  ref: React.RefObject<Element | null>,
  threshold = 0.12
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setInView(true);
      return;
    }

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const el = ref.current;
    if (!el) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}

interface AnimatedNumberProps {
  value: number;
  format: (n: number) => string;
  duration?: number;
  updateDuration?: number;
  className?: string;
}

/**
 * Smooth count-up / interpolation component for KPI figures.
 * Counts from 0 -> target on mount (once visible), then smoothly interpolates
 * between previous and next values when interactive controls change.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  format,
  duration = 680,
  updateDuration = 320,
  className,
}) => {
  const spanRef = useRef<HTMLSpanElement>(null);
  const inView = useInViewOnce(spanRef, 0.05);
  const safeTarget = Number.isFinite(value) ? value : 0;

  const [displayValue, setDisplayValue] = useState<number>(safeTarget);
  const hasAnimatedInitial = useRef(false);
  const currentRef = useRef<number>(safeTarget);

  useEffect(() => {
    if (!inView) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      currentRef.current = safeTarget;
      hasAnimatedInitial.current = true;
      setDisplayValue(safeTarget);
      return;
    }

    const startVal = hasAnimatedInitial.current ? currentRef.current : 0;
    const activeDuration = hasAnimatedInitial.current ? updateDuration : duration;
    hasAnimatedInitial.current = true;

    if (Math.abs(safeTarget - startVal) < 1e-6) {
      currentRef.current = safeTarget;
      setDisplayValue(safeTarget);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / Math.max(1, activeDuration));
      // Smooth easeOutExpo-like curve (fast acceleration, crisp deceleration)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const next = startVal + (safeTarget - startVal) * eased;
      currentRef.current = next;
      setDisplayValue(next);

      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        currentRef.current = safeTarget;
        setDisplayValue(safeTarget);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [safeTarget, inView, duration, updateDuration]);

  return (
    <span ref={spanRef} className={className}>
      {format(displayValue)}
    </span>
  );
};
