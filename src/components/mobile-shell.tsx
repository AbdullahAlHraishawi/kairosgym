import { type ReactNode } from "react";
import { BottomNav } from "./bottom-nav";

export function MobileShell({
  children,
  hideNav = false,
}: {
  children: ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md bg-background">
      <main className={`px-5 pt-6 ${hideNav ? "pb-6" : "pb-28"}`}>{children}</main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
