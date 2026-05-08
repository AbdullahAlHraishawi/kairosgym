
# Add PWA + Update Prompt to KAIROS

Port the Serein Wear update flow into KAIROS, restyled with semantic tokens. Wire up a real service worker via `vite-plugin-pwa` so the prompt actually triggers on new deploys.

## Heads-up (will mention to user after build)

- PWA only activates in the **published** build, not the editor preview. The editor will show the app exactly as today.
- Service worker is guarded against iframes and preview hostnames so it never registers in the Lovable editor (prevents stale-cache bugs).
- KAIROS already has `manifest.webmanifest` + theme color + apple meta tags — those stay as-is.

## Files

### 1. `vite.config.ts` — register `vite-plugin-pwa`
```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false, // we register manually with iframe guard
        devOptions: { enabled: false },
        manifest: false, // keep existing public/manifest.webmanifest
        workbox: {
          navigateFallbackDenylist: [/^\/api/, /^\/~oauth/],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "html", networkTimeoutSeconds: 3 },
            },
            {
              urlPattern: ({ request }) =>
                ["style", "script", "worker", "image", "font"].includes(request.destination),
              handler: "StaleWhileRevalidate",
              options: { cacheName: "assets" },
            },
          ],
        },
      }),
    ],
  },
});
```

### 2. `src/components/PWAUpdatePrompt.tsx` — new, KAIROS-styled

Same logic as Serein Wear:
- `useRegisterSW` from `virtual:pwa-register/react`
- Auto check for updates every 60s via `registration.update()`
- Stuck detection after 3 failures → shows "Cache stuck — tap to fix" with Clear Cache button
- Update available state → shows "Update available" with Update button that calls `updateServiceWorker(true)`

Restyled with KAIROS tokens:
- Container: `bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-glow`
- Update icon `text-primary`, label `text-foreground`
- Update button: existing primary button styling (`bg-primary text-primary-foreground`)
- Stuck state: `border-destructive/40 bg-destructive/10`, destructive button
- Position: `fixed bottom-24 left-1/2 -translate-x-1/2 z-50` (above bottom nav, within `max-w-md`)
- Animation: `animate-in slide-in-from-bottom-4 fade-in duration-300`

Iframe/preview guard inside the component: if `window.self !== window.top` OR hostname includes `id-preview--` / `lovableproject.com`, return `null` without calling `useRegisterSW`. (Hook still called via early-return via `if` before; we'll structure as a tiny wrapper component so hook order is preserved.)

Pattern:
```tsx
export const PWAUpdatePrompt = () => {
  if (!isPWAEligible()) return null;
  return <PWAUpdatePromptInner />;
};
```

### 3. `src/routes/__root.tsx` — mount the prompt

Add `<PWAUpdatePrompt />` next to `<Toaster />` in `RootShell`.

### 4. `package.json` — add dep

`bun add -d vite-plugin-pwa workbox-window`

### 5. TypeScript module declaration

Add `src/vite-env.d.ts` (or extend if exists) with:
```ts
/// <reference types="vite-plugin-pwa/react" />
```

## Verification

- `bun install` succeeds, no type errors on `virtual:pwa-register/react`.
- In editor preview: prompt never appears, no SW registers (verify in console: no "Service Worker registered" log, no `/sw.js` request).
- Build output includes `dist/sw.js` and `dist/workbox-*.js`.
- After publish + a follow-up deploy, the prompt appears on next visit.

## Out of scope

- No changes to manifest, icons, or theme color.
- No offline data sync, no background sync.
- No push notifications.
