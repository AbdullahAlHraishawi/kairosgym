import { supabase } from "@/integrations/supabase/client";
import { levelFromXp, xpForSet } from "./xp";

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

export interface DraftSet {
  id: string;
  setIdx: number;
  weight: number;
  reps: number;
  done: boolean;
}

export interface DraftExercise {
  workoutExerciseId: string;
  info: { id: string; name: string; muscle_group: string };
  sets: DraftSet[];
}

export interface DraftWorkout {
  workoutId: string;
  startedAt: string; // ISO
  entries: DraftExercise[];
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}
function isYesterday(prev: Date, today: Date) {
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  return isSameDay(prev, y);
}

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

async function buildDraft(workoutId: string, startedAt: string): Promise<DraftWorkout> {
  const { data: wex } = await supabase
    .from("workout_exercises")
    .select("id, order_idx, exercise_id")
    .eq("workout_id", workoutId)
    .order("order_idx");

  const exRows = wex ?? [];
  const wexIds = exRows.map((e) => e.id);
  const exerciseIds = Array.from(new Set(exRows.map((e) => e.exercise_id)));

  const exerciseMap = new Map<string, { id: string; name: string; muscle_group: string }>();
  if (exerciseIds.length) {
    const { data: exs } = await supabase
      .from("exercises")
      .select("id, name, muscle_group")
      .in("id", exerciseIds);
    (exs ?? []).forEach((e) => exerciseMap.set(e.id, e));
  }

  const setsByWex = new Map<string, DraftSet[]>();
  if (wexIds.length) {
    const { data: sets } = await supabase
      .from("workout_sets")
      .select("id, workout_exercise_id, set_idx, weight, reps, completed")
      .in("workout_exercise_id", wexIds)
      .order("set_idx");
    (sets ?? []).forEach((s) => {
      const arr = setsByWex.get(s.workout_exercise_id) ?? [];
      arr.push({
        id: s.id,
        setIdx: s.set_idx,
        weight: Number(s.weight ?? 0),
        reps: s.reps ?? 0,
        done: !!s.completed,
      });
      setsByWex.set(s.workout_exercise_id, arr);
    });
  }

  const entries: DraftExercise[] = exRows.map((row) => ({
    workoutExerciseId: row.id,
    info: exerciseMap.get(row.exercise_id) ?? {
      id: row.exercise_id,
      name: "Exercise",
      muscle_group: "",
    },
    sets: setsByWex.get(row.id) ?? [],
  }));

  return { workoutId, startedAt, entries };
}

/** Returns the user's most recent unfinished workout, or null. */
export async function loadOpenWorkout(): Promise<DraftWorkout | null> {
  const userId = await requireUserId();
  const { data: workout } = await supabase
    .from("workouts")
    .select("id, started_at")
    .eq("user_id", userId)
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!workout) return null;
  return buildDraft(workout.id, workout.started_at);
}

/** Creates a new draft workout with the given exercises and 3 placeholder sets each. */
export async function openWorkout(exerciseIds: string[]): Promise<DraftWorkout> {
  const userId = await requireUserId();
  const startedAt = new Date().toISOString();

  const { data: workout, error: wErr } = await supabase
    .from("workouts")
    .insert({ user_id: userId, started_at: startedAt, xp_earned: 0 })
    .select("id, started_at")
    .single();
  if (wErr || !workout) throw wErr ?? new Error("Failed to create workout");

  if (exerciseIds.length) {
    const exRows = exerciseIds.map((exerciseId, i) => ({
      workout_id: workout.id,
      exercise_id: exerciseId,
      order_idx: i,
    }));
    const { data: inserted, error: weErr } = await supabase
      .from("workout_exercises")
      .insert(exRows)
      .select("id, order_idx");
    if (weErr || !inserted) throw weErr ?? new Error("Failed to add exercises");

    const setRows = inserted.flatMap((we) =>
      [1, 2, 3].map((idx) => ({
        workout_exercise_id: we.id,
        set_idx: idx,
        weight: 0,
        reps: 0,
        completed: false,
      })),
    );
    if (setRows.length) {
      const { error: sErr } = await supabase.from("workout_sets").insert(setRows);
      if (sErr) throw sErr;
    }
  }

  return buildDraft(workout.id, workout.started_at);
}

export async function updateDraftSet(
  setId: string,
  patch: Partial<{ weight: number; reps: number; done: boolean }>,
): Promise<void> {
  const dbPatch: { weight?: number; reps?: number; completed?: boolean } = {};
  if (patch.weight !== undefined) dbPatch.weight = patch.weight;
  if (patch.reps !== undefined) dbPatch.reps = patch.reps;
  if (patch.done !== undefined) dbPatch.completed = patch.done;
  if (Object.keys(dbPatch).length === 0) return;
  const { error } = await supabase.from("workout_sets").update(dbPatch).eq("id", setId);
  if (error) throw error;
}

export async function addDraftSet(
  workoutExerciseId: string,
  seed: { weight: number; reps: number },
): Promise<DraftSet> {
  const { data: existing } = await supabase
    .from("workout_sets")
    .select("set_idx")
    .eq("workout_exercise_id", workoutExerciseId)
    .order("set_idx", { ascending: false })
    .limit(1);
  const nextIdx = (existing?.[0]?.set_idx ?? 0) + 1;
  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      workout_exercise_id: workoutExerciseId,
      set_idx: nextIdx,
      weight: seed.weight,
      reps: seed.reps,
      completed: false,
    })
    .select("id, set_idx, weight, reps, completed")
    .single();
  if (error || !data) throw error ?? new Error("Failed to add set");
  return {
    id: data.id,
    setIdx: data.set_idx,
    weight: Number(data.weight ?? 0),
    reps: data.reps ?? 0,
    done: !!data.completed,
  };
}

/** Discards the draft entirely (workout + cascade via app-level cleanup). */
export async function discardDraftWorkout(workoutId: string): Promise<void> {
  // Fetch we ids
  const { data: wex } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("workout_id", workoutId);
  const wexIds = (wex ?? []).map((w) => w.id);
  if (wexIds.length) {
    await supabase.from("workout_sets").delete().in("workout_exercise_id", wexIds);
    await supabase.from("workout_exercises").delete().eq("workout_id", workoutId);
  }
  await supabase.from("workouts").delete().eq("id", workoutId);
}

/** Finalises an existing draft workout: computes XP, updates profile, awards achievements. */
export async function finalizeWorkout(workoutId: string): Promise<FinishResult> {
  const userId = await requireUserId();

  // Pull all completed sets for this workout
  const { data: wex } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("workout_id", workoutId);
  const wexIds = (wex ?? []).map((w) => w.id);

  let xpEarned = 0;
  let totalCompletedSets = 0;
  if (wexIds.length) {
    const { data: sets } = await supabase
      .from("workout_sets")
      .select("reps, completed")
      .in("workout_exercise_id", wexIds)
      .eq("completed", true);
    (sets ?? []).forEach((s) => {
      if ((s.reps ?? 0) > 0) {
        xpEarned += xpForSet(s.reps ?? 0);
        totalCompletedSets += 1;
      }
    });
  }

  if (totalCompletedSets === 0) {
    // Nothing logged — discard the draft instead of finalising.
    await discardDraftWorkout(workoutId);
    throw new Error("No completed sets — session discarded.");
  }

  const finishedAt = new Date();
  const { error: uErr } = await supabase
    .from("workouts")
    .update({ finished_at: finishedAt.toISOString(), xp_earned: xpEarned })
    .eq("id", workoutId);
  if (uErr) throw uErr;

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, level, streak, last_workout_date")
    .eq("id", userId)
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
    .eq("id", userId);

  // Achievements
  const unlocked: { code: string; name: string }[] = [];
  const { count: workoutCount } = await supabase
    .from("workouts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .not("finished_at", "is", null);

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
      .eq("user_id", userId);
    const existingIds = new Set((existing ?? []).map((e) => e.achievement_id));
    const toInsert = (ach ?? []).filter((a) => !existingIds.has(a.id));
    if (toInsert.length) {
      await supabase
        .from("user_achievements")
        .insert(toInsert.map((a) => ({ user_id: userId, achievement_id: a.id })));
      toInsert.forEach((a) => unlocked.push({ code: a.code, name: a.name }));
    }
  }

  return {
    workoutId,
    xpEarned,
    newTotalXp,
    newLevel,
    leveledUp: newLevel > prevLevel,
    newStreak,
    unlockedAchievements: unlocked,
  };
}
