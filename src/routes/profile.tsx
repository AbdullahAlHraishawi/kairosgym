import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Settings,
  ChevronRight,
  LogOut,
  BarChart3,
  Trophy,
  History,
  Users,
  Lock,
  Scale,
} from "lucide-react";
import { MobileShell } from "@/components/mobile-shell";
import { Avatar } from "@/components/avatar";
import { XpBar } from "@/components/xp-bar";
import { AtmoCard } from "@/components/atmo-card";
import { BadgeEmblem } from "@/components/badge-emblem";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { levelProgress, titleForLevel } from "@/lib/xp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import atmoBlade from "@/assets/atmo-blade.png";
import atmoWarrior from "@/assets/atmo-warrior.png";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — KAIROS" },
      { name: "description", content: "Your KAIROS profile, rank, and badges." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { profile, refresh } = useProfile(user?.id);
  const [weightOpen, setWeightOpen] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);
  const [badges, setBadges] = useState<
    { code: string; name: string; description: string; icon: string; unlocked: boolean }[]
  >([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: all } = await supabase.from("achievements").select("*");
      const { data: mine } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);
      const has = new Set((mine ?? []).map((m) => m.achievement_id));
      setBadges(
        (all ?? []).map((a) => ({
          code: a.code,
          name: a.name,
          description: a.description,
          icon: a.icon,
          unlocked: has.has(a.id),
        }))
      );
    })();
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    toast("Signed out");
    navigate({ to: "/auth" });
  };

  if (!profile) {
    return (
      <MobileShell>
        <div className="flex h-[60vh] items-center justify-center text-muted-foreground">
          <div className="animate-flame text-primary text-3xl">⚔</div>
        </div>
      </MobileShell>
    );
  }

  const lp = levelProgress(profile.total_xp);

  return (
    <MobileShell>
      {/* Header */}
      <AtmoCard
        image={atmoBlade}
        imageOpacity={0.12}
        className="p-6"
      >
        <div className="animate-fade-up flex flex-col items-center text-center">
          <Avatar seed={profile.avatar_seed} size={96} className="ring-4 ring-primary/40 shadow-glow" />
          <div className="text-display mt-3 text-2xl font-black">{profile.username}</div>
          <div className="text-primary text-xs font-bold uppercase tracking-[0.3em]">
            The {titleForLevel(lp.level)}
          </div>
        </div>
      </AtmoCard>

      {/* Level */}
      <AtmoCard
        variant="cinematic"
        image={atmoWarrior}
        imageOpacity={0.12}
        imagePosition="center top"
        glow
        className="animate-fade-up mt-5 p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Level</div>
            <div className="text-foreground text-display text-5xl font-black tabular-nums">{lp.level}</div>
          </div>
          <div className="text-right">
            <div className="text-foreground text-display text-lg font-bold tabular-nums">
              {profile.total_xp.toLocaleString()}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">XP</div>
          </div>
        </div>
        <div className="mt-3">
          <XpBar progress={lp.progress} />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span className="text-display">{lp.xpInLevel} / {lp.span}</span>
            <span className="text-display">Streak · {profile.streak} 🔥</span>
          </div>
        </div>
      </AtmoCard>

      {/* Rank */}
      <Link
        to="/ranks"
        className="press card-premium mt-4 flex items-center gap-3 rounded-2xl p-4 edge-red"
      >
        <div className="bg-primary/15 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
          <Trophy className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold">Rank · {titleForLevel(lp.level)}</div>
          <div className="text-[11px] text-muted-foreground">View all ranks</div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>

      {/* Badges */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider">Badges</h2>
          <span className="text-[11px] text-muted-foreground text-display">
            {badges.filter((b) => b.unlocked).length}/{badges.length}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.code}
              className={`card-premium flex flex-col items-center rounded-xl p-3 ${
                b.unlocked ? "edge-red" : "opacity-70"
              }`}
            >
              {b.unlocked ? (
                <BadgeEmblem icon={b.icon} size={56} />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </div>
              )}
              <div className="mt-2 text-center text-[11px] font-semibold leading-tight">
                {b.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Menu */}
      <section className="mt-6">
        <div className="card-premium divide-y divide-border overflow-hidden rounded-2xl">
          <MenuLink to="/progress" icon={<BarChart3 className="h-4 w-4" />} label="Stats" />
          <MenuLink to="/profile" icon={<History className="h-4 w-4" />} label="Workout history" disabled />
          <MenuLink to="/profile" icon={<Users className="h-4 w-4" />} label="Friends" badge="Soon" disabled />
          <MenuLink to="/profile" icon={<Settings className="h-4 w-4" />} label="Settings" disabled />
          <button
            onClick={signOut}
            className="press text-destructive flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            <span className="flex-1">Sign out</span>
          </button>
        </div>
      </section>
    </MobileShell>
  );
}

function MenuLink({
  to,
  icon,
  label,
  badge,
  disabled,
}: {
  to: "/progress" | "/profile";
  icon: React.ReactNode;
  label: string;
  badge?: string;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm font-semibold">{label}</span>
      {badge && (
        <span className="bg-secondary rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {badge}
        </span>
      )}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </>
  );
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-4 py-3.5 opacity-50">
        {inner}
      </div>
    );
  }
  return (
    <Link to={to} className="press flex items-center gap-3 px-4 py-3.5">
      {inner}
    </Link>
  );
}
