import { useRef, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { BottomNav } from "./bottom-nav";

const TAB_ORDER = ["/", "/workout", "/progress", "/leaderboard", "/profile"] as const;

function currentTabIndex(pathname: string): number {
  // exact match for "/" else longest prefix match
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

export function MobileShell({
  children,
  hideNav = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const tracking = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    if (hideNav || e.touches.length !== 1) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    tracking.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!tracking.current || startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    // cancel if scroll-like vertical movement dominates early
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
      tracking.current = false;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!tracking.current || startX.current === null || startY.current === null) {
      tracking.current = false;
      return;
    }
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX.current;
    const dy = endY - startY.current;
    tracking.current = false;
    startX.current = null;
    startY.current = null;

    const THRESHOLD = 60;
    if (Math.abs(dx) < THRESHOLD || Math.abs(dy) > Math.abs(dx)) return;

    const idx = currentTabIndex(pathname);
    if (idx === -1) return;
    const nextIdx = dx < 0 ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= TAB_ORDER.length) return;
    navigate({ to: TAB_ORDER[nextIdx] });
  };

  return (
    <div
      className="relative mx-auto min-h-screen w-full max-w-md bg-background"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="app-vignette" aria-hidden="true" />
      <main className={`relative z-10 px-5 pt-6 ${hideNav ? "pb-6" : "pb-28"}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
