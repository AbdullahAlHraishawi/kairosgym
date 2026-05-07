import { supabase } from "@/integrations/supabase/client";
import { levelFromXp, XP_PER_SET, XP_PER_WORKOUT } from "./xp";

export interface LoggedExercise {
  exerciseId: string;
  sets: { weight: number; reps: number }[];
}

export interface FinishResult {
  workoutId: string;
  xpEarned: number;
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
  newStreak: number;
  unlockedAchievements: { code: string; name: string }[];
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
function isYesterday(prev: Date, today: Date) {
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  return isSameDay(prev, y);
}

export async function finishWorkout(exercises: LoggedExercise[]): Promise<FinishResult> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Not signed in");

  const validEx = exercises.filter((e) => e.sets.length > 0);
  if (validEx.length === 0) throw new Error("Add at least one set before finishing.");

  const totalSets = validEx.reduce((s, e) => s + e.sets.length, 0);
  const xpEarned = XP_PER_WORKOUT + totalSets * XP_PER_SET;

  // 1. create workout
  const { data: workout, error: wErr } = await supabase
    .from("workouts")
    .insert({ user_id: user.id, finished_at: new Date().toISOString(), xp_earned: xpEarned })
    .select()
    .single();
  if (wErr || !workout) throw wErr ?? new Error("Failed to create workout");

  // 2. exercises + sets
  for (let i = 0; i < validEx.length; i++) {
    const ex = validEx[i];
    const { data: we, error: weErr } = await supabase
      .from("workout_exercises")
      .insert({ workout_id: workout.id, exercise_id: ex.exerciseId, order_idx: i })
      .select()
      .single();
    if (weErr || !we) throw weErr ?? new Error("Failed to add exercise");
    const setsRows = ex.sets.map((s, idx) => ({
      workout_exercise_id: we.id,
      set_idx: idx + 1,
      weight: s.weight,
      reps: s.reps,
      completed: true,
    }));
    const { error: sErr } = await supabase.from("workout_sets").insert(setsRows);
    if (sErr) throw sErr;
  }

  // 3. fetch profile and update XP/level/streak
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, level, streak, last_workout_date")
    .eq("id", user.id)
    .single();

  const prevLevel = profile?.level ?? 0;
  const newTotalXp = (profile?.total_xp ?? 0) + xpEarned;
  const newLevel = levelFromXp(newTotalXp);
  const today = new Date();
  let newStreak = 1;
  if (profile?.last_workout_date) {
    const last = new Date(profile.last_workout_date);
    if (isSameDay(last, today)) newStreak = profile.streak ?? 1;
    else if (isYesterday(last, today)) newStreak = (profile.streak ?? 0) + 1;
    else newStreak = 1;
  }

  await supabase
    .from("profiles")
    .update({
      total_xp: newTotalXp,
      level: newLevel,
      streak: newStreak,
      last_workout_date: today.toISOString().slice(0, 10),
    })
    .eq("id", user.id);

  // 4. achievements
  const unlocked: { code: string; name: string }[] = [];
  const { count: workoutCount } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const checks: { code: string; ok: boolean }[] = [
    { code: "first_workout", ok: (workoutCount ?? 0) >= 1 },
    { code: "streak_3", ok: newStreak >= 3 },
    { code: "workouts_5", ok: (workoutCount ?? 0) >= 5 },
    { code: "workouts_10", ok: (workoutCount ?? 0) >= 10 },
    { code: "level_5", ok: newLevel >= 5 },
  ];
  const passing = checks.filter((c) => c.ok).map((c) => c.code);
  if (passing.length) {
    const { data: ach } = await supabase
      .from("achievements")
      .select("id, code, name")
      .in("code", passing);
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);
    const existingIds = new Set((existing ?? []).map((e) => e.achievement_id));
    const toInsert = (ach ?? []).filter((a) => !existingIds.has(a.id));
    if (toInsert.length) {
      await supabase
        .from("user_achievements")
        .insert(toInsert.map((a) => ({ user_id: user.id, achievement_id: a.id })));
      toInsert.forEach((a) => unlocked.push({ code: a.code, name: a.name }));
    }
  }

  return {
    xpEarned,
    newTotalXp,
    newLevel,
    leveledUp: newLevel > prevLevel,
    newStreak,
    unlockedAchievements: unlocked,
  };
}

export async function persistSessionXp(xpEarned: number): Promise<{
  newTotalXp: number;
  newLevel: number;
  leveledUp: boolean;
  newStreak: number;
}> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Not signed in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, level, streak, last_workout_date")
    .eq("id", user.id)
    .single();

  const prevLevel = profile?.level ?? 0;
  const newTotalXp = (profile?.total_xp ?? 0) + Math.max(0, xpEarned);
  const newLevel = levelFromXp(newTotalXp);

  const today = new Date();
  let newStreak = 1;
  if (profile?.last_workout_date) {
    const last = new Date(profile.last_workout_date);
    if (isSameDay(last, today)) newStreak = profile.streak ?? 1;
    else if (isYesterday(last, today)) newStreak = (profile.streak ?? 0) + 1;
    else newStreak = 1;
  }

  await supabase
    .from("profiles")
    .update({
      total_xp: newTotalXp,
      level: newLevel,
      streak: newStreak,
      last_workout_date: today.toISOString().slice(0, 10),
    })
    .eq("id", user.id);

  return { newTotalXp, newLevel, leveledUp: newLevel > prevLevel, newStreak };
}
