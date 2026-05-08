import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { BottomNav } from "./bottom-nav";
import { HomeContent } from "@/routes/index";
import { WorkoutContent } from "@/routes/workout.index";
import { ProgressContent } from "@/routes/progress";
import { LeaderboardContent } from "@/routes/leaderboard";
import { ProfileContent } from "@/routes/profile";

const TAB_PATHS = ["/", "/workout", "/progress", "/leaderboard", "/profile"] as const;
type TabPath = (typeof TAB_PATHS)[number];

export function isTabPath(pathname: string): boolean {
  return (TAB_PATHS as readonly string[]).includes(pathname);
}

function indexFromPath(pathname: string): number {
  if (pathname === "/") return 0;
  let best = 0;
  let bestLen = 0;
  TAB_PATHS.forEach((p, i) => {
    if (p === "/") return;
    if (pathname === p || pathname.startsWith(p + "/")) {
      if (p.length > bestLen) {
        best = i;
        bestLen = p.length;
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
const DURATION = 280;
const COMMIT_RATIO = 0.22;
const VELOCITY_COMMIT = 0.5;
const DIRECTION_THRESHOLD = 8;

const PANELS = [
  { path: "/", render: () => <HomeContent /> },
  { path: "/workout", render: () => <WorkoutContent /> },
  { path: "/progress", render: () => <ProgressContent /> },
  { path: "/leaderboard", render: () => <LeaderboardContent /> },
  { path: "/profile", render: () => <ProfileContent /> },
] as const;

export function TabsShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const initialIdx = indexFromPath(pathname);
  const [activeIndex, setActiveIndex] = useState(initialIdx);
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollSaved = useRef<number[]>([0, 0, 0, 0, 0]);

  // Sync when URL changes externally (back btn, link click outside swipe)
  useEffect(() => {
    const idx = indexFromPath(pathname);
    setActiveIndex((cur) => (cur === idx ? cur : idx));
  }, [pathname]);

  // Apply translate based on activeIndex
  useLayoutEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    strip.style.transition = `transform ${DURATION}ms ${EASE}`;
    strip.style.transform = `translate3d(${-activeIndex * 100}%, 0, 0)`;
  }, [activeIndex]);

  // Touch swipe handling
  useEffect(() => {
    const root = rootRef.current;
    const strip = stripRef.current;
    if (!root || !strip) return;

    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;
    let active = false;
    let locked: "h" | "v" | null = null;
    let ignored = false;
    let dx = 0;
    let width = root.clientWidth || window.innerWidth;
    let baseTx = 0;

    const setStrip = (px: number, animated: boolean) => {
      strip.style.transition = animated ? `transform ${DURATION}ms ${EASE}` : "none";
      strip.style.transform = `translate3d(${px}px, 0, 0)`;
    };

    const rubber = (over: number) => Math.sign(over) * Math.sqrt(Math.abs(over)) * 8;

    const reset = () => {
      active = false;
      locked = null;
      ignored = false;
      dx = 0;
    };

    const onStart = (e: TouchEvent) => {
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
      width = root.clientWidth || window.innerWidth;
      startX = lastX = t.clientX;
      startY = t.clientY;
      lastT = performance.now();
      velocity = 0;
      dx = 0;
      active = true;
      locked = null;
      ignored = false;
      baseTx = -activeIndex * width;
    };

    const onMove = (e: TouchEvent) => {
      if (!active || ignored) return;
      if (e.touches.length !== 1) {
        ignored = true;
        setStrip(baseTx, true);
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

      if (e.cancelable) e.preventDefault();

      const now = performance.now();
      const dt = Math.max(1, now - lastT);
      velocity = (t.clientX - lastX) / dt;
      lastX = t.clientX;
      lastT = now;

      let move = cdx;
      const goingPrev = cdx > 0;
      const canPrev = activeIndex > 0;
      const canNext = activeIndex < PANELS.length - 1;
      if ((goingPrev && !canPrev) || (!goingPrev && !canNext)) {
        move = rubber(cdx);
      }
      dx = cdx;
      setStrip(baseTx + move, false);
    };

    const finish = () => {
      if (!active || ignored || locked !== "h") {
        if (locked === "h") setStrip(baseTx, true);
        reset();
        return;
      }
      const absDx = Math.abs(dx);
      const goingPrev = dx > 0;
      const direction = goingPrev ? -1 : 1;
      const canPrev = activeIndex > 0;
      const canNext = activeIndex < PANELS.length - 1;
      const blocked = (goingPrev && !canPrev) || (!goingPrev && !canNext);
      const meets =
        !blocked && (absDx > width * COMMIT_RATIO || Math.abs(velocity) > VELOCITY_COMMIT);

      if (meets) {
        const next = activeIndex + direction;
        // Animate strip via setActiveIndex (useLayoutEffect handles transform)
        setActiveIndex(next);
        navigate({ to: PANELS[next].path, replace: true });
      } else {
        setStrip(baseTx, true);
      }
      reset();
    };

    const onEnd = () => finish();
    const onCancel = () => {
      if (locked === "h") setStrip(baseTx, true);
      reset();
    };

    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("touchmove", onMove, { passive: false });
    root.addEventListener("touchend", onEnd, { passive: true });
    root.addEventListener("touchcancel", onCancel, { passive: true });

    return () => {
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchmove", onMove);
      root.removeEventListener("touchend", onEnd);
      root.removeEventListener("touchcancel", onCancel);
    };
  }, [activeIndex, navigate]);

  // Save/restore scroll positions per panel
  useEffect(() => {
    return () => {
      panelRefs.current.forEach((el, i) => {
        if (el) scrollSaved.current[i] = el.scrollTop;
      });
    };
  }, []);

  const handleTabClick = (idx: number) => {
    if (idx === activeIndex) {
      const el = panelRefs.current[activeIndex];
      el?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setActiveIndex(idx);
    navigate({ to: PANELS[idx].path, replace: true });
  };

  return (
    <div
      ref={rootRef}
      className="relative mx-auto w-full max-w-md overflow-hidden bg-background"
      style={{ height: "100dvh", touchAction: "pan-y" }}
    >
      <div className="app-vignette" aria-hidden="true" />
      <div
        ref={stripRef}
        className="relative z-10 flex h-full will-change-transform"
        style={{ width: `${PANELS.length * 100}%` }}
      >
        {PANELS.map((p, i) => (
          <div
            key={p.path}
            ref={(el) => {
              panelRefs.current[i] = el;
            }}
            className="h-full overflow-y-auto overflow-x-hidden px-5 pt-6 pb-28"
            style={{ width: `${100 / PANELS.length}%`, WebkitOverflowScrolling: "touch" }}
            aria-hidden={i !== activeIndex}
          >
            {p.render()}
          </div>
        ))}
      </div>
      <BottomNav onTabClick={handleTabClick} />
    </div>
  );
}
