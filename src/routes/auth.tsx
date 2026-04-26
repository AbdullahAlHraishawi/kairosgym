import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/mobile-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — KAIROS" },
      { name: "description", content: "Sign in or create your KAIROS account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: username || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. Welcome to KAIROS.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      navigate({ to: "/" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell hideNav>
      <div className="flex min-h-[80vh] flex-col justify-center">
        <div className="mb-10 text-center">
          <div className="text-primary mx-auto mb-4 inline-block text-5xl font-black tracking-tight drop-shadow-[0_0_18px_var(--primary-glow)]">
            KAIROS
          </div>
          <p className="text-sm text-muted-foreground">Train. Level up. Become relentless.</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
          <div className="mb-5 flex rounded-lg bg-secondary p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`press flex-1 rounded-md py-2 text-sm font-semibold transition ${
                  mode === m
                    ? "bg-card text-foreground shadow"
                    : "text-muted-foreground"
                }`}
              >
                {m === "signin" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Username
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="warrior_01"
                  className="bg-input w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-input w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-input w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none ring-primary/40 focus:ring-2"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="press bg-primary text-primary-foreground shadow-glow mt-2 w-full rounded-xl py-3 text-sm font-bold uppercase tracking-wider disabled:opacity-60"
            >
              {loading ? "..." : mode === "signin" ? "Enter" : "Create account"}
            </button>
          </form>
        </div>

        <Link to="/" className="mt-6 text-center text-xs text-muted-foreground underline">
          Back
        </Link>
      </div>
    </MobileShell>
  );
}
