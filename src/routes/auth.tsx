import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  Dumbbell,
  Trophy,
  Flame,
} from "lucide-react";
import hero1 from "@/assets/hero-1.png";
import hero2 from "@/assets/hero-2.png";
import hero3 from "@/assets/hero-3.png";
import krLogo from "@/assets/kr-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — KAIROS" },
      { name: "description", content: "Discipline meets timing. Sign in to KAIROS." },
    ],
  }),
  component: AuthPage,
});

const HEROES = [hero1, hero2, hero3];

function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HEROES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {HEROES.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          className="animate-ken-burns absolute inset-x-0 top-0 h-[72%] w-full object-cover object-top transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
      {/* Soft top-to-bottom fade — keeps art bright at top, dark at card */}
      <div
        className="absolute inset-x-0 top-0 h-[72%]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(15,17,21,0.15) 0%, rgba(15,17,21,0) 28%, rgba(15,17,21,0.25) 65%, rgba(15,17,21,0.9) 100%)",
        }}
      />
      {/* Solid background fill below the photo */}
      <div className="bg-background absolute inset-x-0 bottom-0 top-[68%]" />
    </div>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "choose-character">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username: email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Account created. Choose your warrior.");
        if (data.user) {
          setNewUserId(data.user.id);
          setMode("choose-character");
          return;
        }
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

  const forgot = async () => {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset link sent if the email exists.");
  };

  return (
    <div className="bg-background relative mx-auto min-h-screen w-full max-w-md overflow-hidden">
      {/* Background hero */}
      <HeroCarousel />

      {/* Foreground content */}
      <div className="animate-fade-up relative z-10 flex min-h-screen flex-col px-5 pb-6 pt-10">
        {/* Branding */}
        <div className="flex flex-col items-center pt-6 text-center">
          <img
            src={krLogo}
            alt="KAIROS"
            className="animate-glow-drop h-[216px] w-[216px] object-contain"
          />
          <h1
            className="mt-3 text-[34px] font-light text-foreground"
            style={{
              letterSpacing: "0.32em",
              textShadow:
                "0 0 14px rgba(255,255,255,0.25), 0 0 28px rgba(194,59,59,0.18)",
            }}
          >
            KAIROS
          </h1>
          <div className="mt-2 flex flex-col items-center">
            <p
              className="text-primary text-[11px] font-medium uppercase"
              style={{ letterSpacing: "0.34em" }}
            >
              Discipline meets timing.
            </p>
            <span className="bg-primary mt-2 h-[2px] w-10 rounded-full opacity-80" />
          </div>
        </div>

        {/* Card */}
        <div
          className="animate-slide-up-fade mt-8 rounded-2xl border border-white/5 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl"
          style={{ backgroundColor: "rgba(26, 29, 35, 0.82)" }}
        >
          <h2 className="text-center text-xl font-bold uppercase tracking-[0.18em] text-foreground">
            {mode === "signin"
              ? "Welcome Back"
              : mode === "signup"
                ? "Join Kairos"
                : "Choose Your Warrior"}
          </h2>
          <p className="text-muted-foreground mt-1.5 text-center text-sm">
            {mode === "signin"
              ? "Sign in to continue your journey."
              : mode === "signup"
                ? "Create your account to begin."
                : "Pick the face of your journey. You can change this later."}
          </p>

          {mode === "choose-character" && newUserId ? (
            <div className="mt-5">
              <CharacterPicker
                userId={newUserId}
                currentKey={null}
                variant="onboarding"
                onContinue={() => navigate({ to: "/" })}
              />
            </div>
          ) : (

          <form onSubmit={submit} className="mt-5 space-y-4">
            {/* Email */}
            <div>
              <label
                className="text-muted-foreground mb-2 block text-[11px] font-semibold uppercase"
                style={{ letterSpacing: "0.18em" }}
              >
                Email
              </label>
              <div className="group focus-within:border-primary/70 focus-within:shadow-[0_0_0_3px_rgba(194,59,59,0.18),0_0_18px_-2px_rgba(194,59,59,0.45)] flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 transition-all">
                <Mail className="text-muted-foreground group-focus-within:text-primary h-4 w-4 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="text-foreground placeholder:text-muted-foreground/70 w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="text-muted-foreground mb-2 block text-[11px] font-semibold uppercase"
                style={{ letterSpacing: "0.18em" }}
              >
                Password
              </label>
              <div className="group focus-within:border-primary/70 focus-within:shadow-[0_0_0_3px_rgba(194,59,59,0.18),0_0_18px_-2px_rgba(194,59,59,0.45)] flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-3.5 py-3 transition-all">
                <Lock className="text-muted-foreground group-focus-within:text-primary h-4 w-4 transition-colors" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="text-foreground placeholder:text-muted-foreground/70 w-full bg-transparent text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-muted-foreground hover:text-primary press transition-colors"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "signin" && (
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={forgot}
                    className="text-muted-foreground hover:text-primary active:text-primary text-xs font-medium underline-offset-4 transition-colors hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            {/* Primary button */}
            <button
              type="submit"
              disabled={loading}
              className="press bg-primary text-primary-foreground relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold uppercase tracking-[0.22em] shadow-[0_0_28px_-4px_rgba(194,59,59,0.85),inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-shadow disabled:opacity-60"
            >
              <span>{loading ? "..." : mode === "signin" ? "Login" : "Create"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-muted-foreground text-[11px] tracking-[0.3em]">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Secondary button */}
            <button
              type="button"
              onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
              className="press border-primary/70 text-foreground hover:bg-primary/10 flex w-full items-center justify-center gap-2.5 rounded-xl border bg-transparent py-3 text-sm font-bold uppercase tracking-[0.18em] transition-colors"
            >
              <UserPlus className="text-primary h-4 w-4" />
              <span>{mode === "signin" ? "Create Account" : "Back to Sign In"}</span>
            </button>
          </form>
        </div>

        {/* Footer brand strip */}
        <div className="mt-auto grid grid-cols-3 gap-2 pt-8">
          {[
            { Icon: Dumbbell, label: "TRACK" },
            { Icon: Trophy, label: "ACHIEVE" },
            { Icon: Flame, label: "EVOLVE" },
          ].map(({ Icon, label }, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 border-white/5 py-1"
              style={{
                borderLeftWidth: i === 0 ? 0 : 1,
              }}
            >
              <Icon
                className="text-primary h-6 w-6"
                style={{ filter: "drop-shadow(0 0 8px rgba(194,59,59,0.55))" }}
              />
              <span
                className="text-foreground/85 text-[10px] font-semibold"
                style={{ letterSpacing: "0.28em" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
