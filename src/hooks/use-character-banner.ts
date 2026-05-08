import { useEffect, useRef, useState } from "react";

const ROTATE_MS = 8000;
const FADE_MS = 1000;

/**
 * Returns a stable {current, next, showNext} tuple for a 2-layer crossfade.
 * Picks a random starting banner, advances every ROTATE_MS, fades over FADE_MS.
 * Pauses while the tab is hidden.
 */
export function useCharacterBanner(banners: string[]) {
  const [current, setCurrent] = useState(() =>
    banners.length ? Math.floor(Math.random() * banners.length) : 0,
  );
  const [next, setNext] = useState(current);
  const [showNext, setShowNext] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (banners.length <= 1) return;
    setCurrent((i) => (i >= banners.length ? 0 : i));

    const tick = () => {
      const n = (currentRef.current + 1) % banners.length;
      setNext(n);
      setShowNext(true);
      fadeTimer.current = setTimeout(() => {
        setCurrent(n);
        setShowNext(false);
      }, FADE_MS);
    };

    let interval: ReturnType<typeof setInterval> | null = setInterval(tick, ROTATE_MS);

    const onVisibility = () => {
      if (document.hidden) {
        if (interval) clearInterval(interval);
        interval = null;
      } else if (!interval) {
        interval = setInterval(tick, ROTATE_MS);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (interval) clearInterval(interval);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [banners]);

  // mirror current into a ref for the interval closure
  const currentRef = useRef(current);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  return {
    currentSrc: banners[current] ?? null,
    nextSrc: banners[next] ?? null,
    showNext,
    fadeMs: FADE_MS,
  };
}
