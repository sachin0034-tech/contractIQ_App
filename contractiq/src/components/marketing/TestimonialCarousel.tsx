'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface TestimonialCard {
  className: string;
  brand: string;
  quote: string;
  cite: string;
}

export function TestimonialCarousel({ cards }: { cards: TestimonialCard[] }) {
  const [active, setActive] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (n: number, userInitiated = false) => {
      const idx = ((n % cards.length) + cards.length) % cards.length;
      setActive(idx);

      const track = trackRef.current;
      if (track) {
        const box = track.parentElement?.clientWidth ?? 0;
        const card = track.children[idx] as HTMLElement | undefined;
        if (card) {
          const off = card.offsetLeft - (box - card.offsetWidth) / 2;
          track.style.transform = `translateX(${-Math.max(0, off)}px)`;
        }
      }

      if (userInitiated && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    },
    [cards.length],
  );

  useEffect(() => {
    go(1);
    timerRef.current = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % cards.length;
        go(next);
        return next;
      });
    }, 5000);

    const handleResize = () => go(active);
    window.addEventListener('resize', handleResize);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="quotes" style={{ overflow: 'hidden' }}>
      <div className="track" ref={trackRef}>
        {cards.map((card, k) => (
          <figure
            key={k}
            className={`q ${card.className}${active === k ? ' on' : ''}`}
            onClick={() => go(k, true)}
          >
            <span className="brand">{card.brand}</span>
            <blockquote>{card.quote}</blockquote>
            <cite>{card.cite}</cite>
          </figure>
        ))}
      </div>
      <div className="dots">
        {cards.map((_, k) => (
          <button
            key={k}
            aria-label={`Show testimonial ${k + 1}`}
            aria-current={active === k ? 'true' : undefined}
            onClick={() => go(k, true)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}