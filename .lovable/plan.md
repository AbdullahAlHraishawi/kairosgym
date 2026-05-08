## Goal

Make the PWA update button visible and reliable on KAIROS, scoped only to the Home tab.

## Root cause

`PWAUpdatePrompt` currently uses `registerType: "autoUpdate"` in `vite.config.ts`. With autoUpdate, the new service worker activates immediately on next load — so `needRefresh` is rarely (if ever) set to `true`, and the prompt almost never shows. The component is also rendered globally in `__root.tsx` with no route gating, so when it does appear it would show on every screen including active sessions.

Additionally, the prompt is positioned with `bottom-24` and `justify-center` — that should land above the bottom nav, but inside the `TabsShell` (which has `overflow-hidden` and `max-w-md` centered), a `fixed` element rendered outside the shell still works. So the position itself is fine; visibility is the real problem.

## Changes

### 1. `vite.config.ts`
- Switch `registerType: "autoUpdate"` → `registerType: "prompt"`. This makes the new SW wait for `updateServiceWorker(true)` before activating, so the button reliably appears when a new build is published.

### 2. `src/components/PWAUpdatePrompt.tsx`
- Add a route check using `useLocation()` from `@tanstack/react-router`. Only render when `pathname === "/"` (Home tab). This automatically hides it on `/workout/log` (active session), `/workout/complete` (summary), and every other screen.
- Keep existing iframe / preview-host guard.
- Re-center content: button container already uses `justify-center` and `max-w-sm`; ensure inner flex uses `justify-center` so the icon + text + button group sits centered, and bump bottom offset to `bottom-20` so it sits clearly above the nav within the mobile shell.
- Keep `swStuck` fallback gated by the same route check.

### 3. No changes to `__root.tsx`
The component stays mounted globally; gating happens inside the component so it works whether the user is in `TabsShell` or a standalone route.

## Behavior after fix

- New build pushed → user opens the app on Home → button slides in above bottom nav, centered.
- User taps "Update" → SW activates and page reloads with the new version.
- During a workout session (`/workout/log`) or on the summary (`/workout/complete`) → button is hidden, no interruption.
- On any non-home tab → button is hidden; reappears when the user returns to Home.
- Preview / editor iframe → still suppressed (existing guard).

## Out of scope

- No design system changes.
- No swipe / tab logic changes.
- No service worker behavior changes beyond registration mode.
