import { useEffect, useRef, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { BottomNav } from "./bottom-nav";

const TAB_ORDER = ["/", "/workout", "/progress", "/leaderboard", "/profile"] as const;

function currentTabIndex(pathname: string): number {
  if (pathname === "/") return 0;
  let best = -1;
  let bestLen = 0;
  TAB_ORDER.forEach((t, i) => {
    if (t === "/") return;
    if (pathname === t || pathname.startsWith(t + "/")) {
      if (t.length > bestLen) {
        best = i;
        bestLen = t.length;
      }
    }
  });
  return best;
}

function isHorizontallyScrollable(el: Element, root: Element): boolean {
  let node: Element | null = el;
  while (node && node !== root) {
    if (node instanceof HTMLElement) {
      if (node.dataset.noSwipe !== undefined) return true;
      const style = window.getComputedStyle(node);
      const ox = style.overflowX;
      if ((ox === "auto" || ox === "scroll") && node.scrollWidth > node.clientWidth + 1) {
        return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const COMMIT_RATIO = 0.25;
const VELOCITY_COMMIT = 0.5; // px/ms
const DIRECTION_THRESHOLD = 8;

export function MobileShell({
  children,
  hideNav = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const main = mainRef.current;
    if (!root || !main || hideNav) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let active = false; // touch in progress + eligible
    let locked: "h" | "v" | null = null;
    let ignored = false;
    let dx = 0;
    let width = root.clientWidth || window.innerWidth;
    let canPrev = false;
    let canNext = false;

    const setTransform = (x: number, withTransition = false) => {
      main.style.transition = withTransition ? `transform 260ms ${EASE}` : "none";
      main.style.transform = x === 0 ? "" : `translate3d(${x}px, 0, 0)`;
    };

    const rubber = (over: number) => {
      const sign = Math.sign(over);
      return sign * Math.sqrt(Math.abs(over)) * 8;
    };

    const reset = () => {
      active = false;
      locked = null;
      ignored = false;
      dx = 0;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        ignored = true;
        return;
      }
      const t = e.touches[0];
      const target = t.target as Element | null;
      if (target && isHorizontallyScrollable(target, root)) {
        ignored = true;
        active = false;
        return;
      }
      const idx = currentTabIndex(pathname);
      if (idx === -1) {
        ignored = true;
        return;
      }
      width = root.clientWidth || window.innerWidth;
      canPrev = idx > 0;
      canNext = idx < TAB_ORDER.length - 1;
      startX = lastX = t.clientX;
      startY = t.clientY;
      startTime = lastT = performance.now();
      velocity = 0;
      dx = 0;
      active = true;
      locked = null;
      ignored = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!active || ignored) return;
      if (e.touches.length !== 1) {
        ignored = true;
        setTransform(0, true);
        return;
      }
      const t = e.touches[0];
      const cdx = t.clientX - startX;
      const cdy = t.clientY - startY;

      if (locked === null) {
        if (Math.abs(cdy) > Math.abs(cdx) && Math.abs(cdy) > DIRECTION_THRESHOLD) {
          locked = "v";
          ignored = true;
          return;
        }
        if (Math.abs(cdx) > Math.abs(cdy) && Math.abs(cdx) > DIRECTION_THRESHOLD) {
          locked = "h";
        } else {
          return;
        }
      }

      if (locked !== "h") return;

      // prevent native horizontal scroll/refresh
      if (e.cancelable) e.preventDefault();

      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      velocity = (t.clientX - lastX) / dt;
      lastX = t.clientX;
      lastT = now;

      let display = cdx;
      // edge resistance
      if ((cdx > 0 && !canPrev) || (cdx < 0 && !canNext)) {
        display = rubber(cdx);
      }
      dx = cdx;
      setTransform(display, false);
    };

    const finish = () => {
      if (!active || ignored || locked !== "h") {
        if (locked === "h") setTransform(0, true);
        reset();
        return;
      }
      const absDx = Math.abs(dx);
      const goingPrev = dx > 0;
      const direction = goingPrev ? -1 : 1; // tab index delta
      const blocked = (goingPrev && !canPrev) || (!goingPrev && !canNext);
      const meetsCommit =
        !blocked && (absDx > width * COMMIT_RATIO || Math.abs(velocity) > VELOCITY_COMMIT);

      if (meetsCommit) {
        const idx = currentTabIndex(pathname);
        const nextIdx = idx + direction;
        const target = goingPrev ? width : -width;
        const onEnd = () => {
          main.removeEventListener("transitionend", onEnd);
          // navigate; reset transform so new page starts at rest
          main.style.transition = "none";
          main.style.transform = "";
          navigate({ to: TAB_ORDER[nextIdx] });
        };
        main.addEventListener("transitionend", onEnd);
        setTransform(target, true);
      } else {
        setTransform(0, true);
      }
      reset();
    };

    const onTouchEnd = () => finish();
    const onTouchCancel = () => {
      if (locked === "h") setTransform(0, true);
      reset();
    };

    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    root.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchCancel);
      main.style.transition = "";
      main.style.transform = "";
    };
  }, [pathname, hideNav, navigate]);

  return (
    <div
      ref={rootRef}
      className="relative mx-auto min-h-screen w-full max-w-md bg-background"
      style={{ touchAction: "pan-y" }}
    >
      <div className="app-vignette" aria-hidden="true" />
      <main
        ref={mainRef}
        className={`relative z-10 px-5 pt-6 ${hideNav ? "pb-6" : "pb-28"} will-change-transform`}
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
