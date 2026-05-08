import { Outlet, createRootRoute, HeadContent, Scripts, Link, useLocation } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { TabsShell, isTabPath } from "@/components/tabs-shell";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Off the path</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist. Get back to training.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="press inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      },
      { name: "theme-color", content: "#0F1115" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "KAIROS" },
      { title: "KAIROS — Train. Level up." },
      {
        name: "description",
        content:
          "KAIROS is a fitness gamification app. Log workouts, gain XP, level up, and become relentless.",
      },
      { property: "og:title", content: "KAIROS — Train. Level up." },
      {
        property: "og:description",
        content: "Fitness gamified. Earn XP, climb ranks, and stay on streak.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "KAIROS — Train. Level up." },
      { name: "description", content: "Log Your Workout & Level Up" },
      { property: "og:description", content: "Log Your Workout & Level Up" },
      { name: "twitter:description", content: "Log Your Workout & Level Up" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9daaf732-2c58-4bc7-9ba8-1360dbd42218/id-preview-4fcc68a3--9cc3554a-a8ac-4cca-9e07-15cffb4090d5.lovable.app-1778222994095.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9daaf732-2c58-4bc7-9ba8-1360dbd42218/id-preview-4fcc68a3--9cc3554a-a8ac-4cca-9e07-15cffb4090d5.lovable.app-1778222994095.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", href: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "icon", href: "/icon-512.png", type: "image/png", sizes: "512x512" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--card)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
        <PWAUpdatePrompt />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { pathname } = useLocation();
  return isTabPath(pathname) ? <TabsShell /> : <Outlet />;
}
