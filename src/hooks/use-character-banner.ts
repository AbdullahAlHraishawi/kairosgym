import { useEffect, useRef, useState } from "react";

const ROTATE_MS = 8000;
const FADE_MS = 1200;

export interface BannerLayer {
  src: string | null;
  visible: boolean;
}

/**
 * True alternating two-layer crossfade.
 *
 * Layer A and Layer B each hold their own image. Each tick we load the next
 * banner into the layer that is currently INVISIBLE, wait for it to decode,
 * then flip the visible flag — so the visible layer's `src` never changes
 * while it is on screen (no flash, no abrupt swap).
 */
export function useCharacterBanner(banners: string[]) {
  const initial = banners[0] ?? null;
  const [layerA, setLayerA] = useState<BannerLayer>({ src: initial, visible: true });
  const [layerB, setLayerB] = useState<BannerLayer>({ src: null, visible: false });

  const indexRef = useRef(0);
  const activeRef = useRef<"A" | "B">("A");
  const bannersRef = useRef(banners);

  useEffect(() => {
    bannersRef.current = banners;
    indexRef.current = 0;
    if (banners.length === 0) {
      setLayerA({ src: null, visible: true });
      setLayerB({ src: null, visible: false });
      return;
    }
    // Reset to first banner on the active layer.
    if (activeRef.current === "A") {
      setLayerA({ src: banners[0], visible: true });
      setLayerB({ src: null, visible: false });
    } else {
      setLayerB({ src: banners[0], visible: true });
      setLayerA({ src: null, visible: false });
    }
  }, [banners]);

  useEffect(() => {
    if (banners.length <= 1) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      if (cancelled) return;
      timeoutId = setTimeout(tick, ROTATE_MS);
    };

    const preload = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      });

    const tick = async () => {
      if (cancelled || document.hidden) {
        scheduleNext();
        return;
      }
      const list = bannersRef.current;
      if (list.length <= 1) return;
      const nextIndex = (indexRef.current + 1) % list.length;
      const nextSrc = list[nextIndex];
      const inactive: "A" | "B" = activeRef.current === "A" ? "B" : "A";

      // Stage the next image on the inactive layer (still invisible).
      if (inactive === "A") {
        setLayerA({ src: nextSrc, visible: false });
      } else {
        setLayerB({ src: nextSrc, visible: false });
      }

      await preload(nextSrc);
      if (cancelled) return;

      // Flip visibility — both layers transition opacity simultaneously.
      requestAnimationFrame(() => {
        if (cancelled) return;
        setLayerA((p) => ({ ...p, visible: inactive === "A" ? true : false }));
        setLayerB((p) => ({ ...p, visible: inactive === "B" ? true : false }));
        activeRef.current = inactive;
        indexRef.current = nextIndex;
        scheduleNext();
      });
    };

    scheduleNext();

    const onVisibility = () => {
      if (!document.hidden && !timeoutId) scheduleNext();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [banners]);

  return { layerA, layerB, fadeMs: FADE_MS };
}
