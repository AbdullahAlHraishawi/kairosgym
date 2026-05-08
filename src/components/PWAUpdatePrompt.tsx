import { useState, useRef, useCallback } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

function isPWAEligible() {
  if (typeof window === "undefined") return false;
  try {
    if (window.self !== window.top) return false;
  } catch {
    return false;
  }
  const host = window.location.hostname;
  if (
    host.includes("id-preview--") ||
    host.includes("preview--") ||
    host.includes("lovableproject.com") ||
    host.includes("lovableproject-dev.com")
  ) {
    return false;
  }
  if (!("serviceWorker" in navigator)) return false;
  return true;
}

export const PWAUpdatePrompt = () => {
  const { pathname } = useLocation();
  if (pathname !== "/") return null;
  if (!isPWAEligible()) return null;
  return <PWAUpdatePromptInner />;
};

const PWAUpdatePromptInner = () => {
  const [swStuck, setSwStuck] = useState(false);
  const failCount = useRef(0);

  const handleClearCache = useCallback(async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch {
      // ignore cleanup errors
    }
    location.reload();
  }, []);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        setInterval(async () => {
          try {
            await registration.update();
            failCount.current = 0;
          } catch {
            failCount.current += 1;
            if (failCount.current >= 3) {
              setSwStuck(true);
            }
          }
        }, 60 * 1000);
      }
    },
  });

  if (swStuck) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-5 animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="pointer-events-auto flex w-auto max-w-sm items-center justify-center gap-3 rounded-2xl border border-destructive/40 bg-card/80 px-4 py-3 shadow-glow backdrop-blur-xl backdrop-saturate-150">
          <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
          <span className="text-sm font-medium text-foreground">
            Cache stuck — tap to fix
          </span>
          <Button size="sm" variant="destructive" onClick={handleClearCache}>
            Clear
          </Button>
        </div>
      </div>
    );
  }

  if (!needRefresh) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-5 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="pointer-events-auto flex w-auto max-w-sm items-center justify-center gap-3 rounded-2xl border border-border/50 bg-card/80 px-4 py-3 shadow-glow backdrop-blur-xl backdrop-saturate-150">
        <RefreshCw className="h-4 w-4 shrink-0 text-primary" />
        <span className="text-sm font-medium text-foreground">
          Update available
        </span>
        <Button
          size="sm"
          onClick={() => updateServiceWorker(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Update
        </Button>
      </div>
    </div>
  );
};
