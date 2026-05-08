import { supabase } from "@/integrations/supabase/client";

export interface PlanSummary {
  id: string;
  name: string;
  updatedAt: string;
  dayCount: number;
  exerciseCount: number;
}

export interface PlanSet {
  id: string;
  setIdx: number;
  weight: number;
  reps: number;
}

export interface PlanExercise {
  id: string;
  exerciseId: string;
  orderIdx: number;
  info: { id: string; name: string; muscle_group: string };
  sets: PlanSet[];
}

export interface PlanDay {
  id: string;
  dayIndex: number;
  name: string | null;
  exerciseCount: number;
}

export interface PlanFull {
  id: string;
  name: string;
  days: PlanDay[];
}

export interface DayFull {
  id: string;
  planId: string;
  dayIndex: number;
  name: string | null;
  exercises: PlanExercise[];
}

export function dayDisplayName(d: { name: string | null; dayIndex: number }) {
  return d.name?.trim() || `Day ${d.dayIndex + 1}`;
}

async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export async function listPlans(): Promise<PlanSummary[]> {
  const userId = await requireUserId();
  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, name, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!plans?.length) return [];

  const ids = plans.map((p) => p.id);
  const { data: days } = await supabase
    .from("plan_days")
    .select("id, plan_id")
    .in("plan_id", ids);
  const dayIds = (days ?? []).map((d) => d.id);
  const { data: exs } = dayIds.length
    ? await supabase.from("plan_exercises").select("id, day_id").in("day_id", dayIds)
    : { data: [] as { id: string; day_id: string }[] };

  const dayToPlan = new Map((days ?? []).map((d) => [d.id, d.plan_id]));
  const planDays = new Map<string, number>();
  const planExs = new Map<string, number>();
  (days ?? []).forEach((d) => planDays.set(d.plan_id, (planDays.get(d.plan_id) ?? 0) + 1));
  (exs ?? []).forEach((e) => {
    const planId = dayToPlan.get(e.day_id);
    if (planId) planExs.set(planId, (planExs.get(planId) ?? 0) + 1);
  });

  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    updatedAt: p.updated_at,
    dayCount: planDays.get(p.id) ?? 0,
    exerciseCount: planExs.get(p.id) ?? 0,
  }));
}

export async function createPlan(name: string, dayCount: number): Promise<string> {
  const userId = await requireUserId();
  const { data: plan, error } = await supabase
    .from("plans")
    .insert({ user_id: userId, name: name.trim() || "My Plan" })
    .select("id")
    .single();
  if (error || !plan) throw error ?? new Error("Failed to create plan");

  const days = Array.from({ length: Math.max(1, dayCount) }, (_, i) => ({
    plan_id: plan.id,
    day_index: i,
    name: null,
  }));
  const { error: dErr } = await supabase.from("plan_days").insert(days);
  if (dErr) throw dErr;
  return plan.id;
}

export async function renamePlan(planId: string, name: string) {
  const { error } = await supabase
    .from("plans")
    .update({ name: name.trim() || "My Plan" })
    .eq("id", planId);
  if (error) throw error;
}

export async function deletePlan(planId: string) {
  const { error } = await supabase.from("plans").delete().eq("id", planId);
  if (error) throw error;
}

async function touchPlan(planId: string) {
  // Trigger updates updated_at on any UPDATE; rewrite name to itself.
  const { data } = await supabase.from("plans").select("name").eq("id", planId).single();
  if (data) await supabase.from("plans").update({ name: data.name }).eq("id", planId);
}

export async function getPlan(planId: string): Promise<PlanFull | null> {
  const { data: plan } = await supabase
    .from("plans")
    .select("id, name")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return null;
  const { data: days } = await supabase
    .from("plan_days")
    .select("id, day_index, name")
    .eq("plan_id", planId)
    .order("day_index");
  const dayList = days ?? [];
  const dayIds = dayList.map((d) => d.id);
  const counts = new Map<string, number>();
  if (dayIds.length) {
    const { data: exs } = await supabase
      .from("plan_exercises")
      .select("day_id")
      .in("day_id", dayIds);
    (exs ?? []).forEach((e) => counts.set(e.day_id, (counts.get(e.day_id) ?? 0) + 1));
  }
  return {
    id: plan.id,
    name: plan.name,
    days: dayList.map((d) => ({
      id: d.id,
      dayIndex: d.day_index,
      name: d.name,
      exerciseCount: counts.get(d.id) ?? 0,
    })),
  };
}

export async function addDay(planId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("plan_days")
    .select("day_index")
    .eq("plan_id", planId)
    .order("day_index", { ascending: false })
    .limit(1);
  const nextIdx = (existing?.[0]?.day_index ?? -1) + 1;
  const { data, error } = await supabase
    .from("plan_days")
    .insert({ plan_id: planId, day_index: nextIdx, name: null })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Failed to add day");
  void touchPlan(planId);
  return data.id;
}

export async function renameDay(dayId: string, name: string | null) {
  const trimmed = name?.trim() || null;
  const { error } = await supabase
    .from("plan_days")
    .update({ name: trimmed })
    .eq("id", dayId);
  if (error) throw error;
}

export async function deleteDay(dayId: string) {
  const { error } = await supabase.from("plan_days").delete().eq("id", dayId);
  if (error) throw error;
}

export async function duplicateDay(dayId: string): Promise<string> {
  const { data: src } = await supabase
    .from("plan_days")
    .select("plan_id, name")
    .eq("id", dayId)
    .single();
  if (!src) throw new Error("Day not found");
  const newDayId = await addDay(src.plan_id);
  if (src.name) await renameDay(newDayId, `${src.name} (copy)`);

  const { data: exs } = await supabase
    .from("plan_exercises")
    .select("id, exercise_id, order_idx")
    .eq("day_id", dayId)
    .order("order_idx");
  if (!exs?.length) return newDayId;

  const exMap = new Map<string, string>(); // old id -> new id
  for (const ex of exs) {
    const { data: ne } = await supabase
      .from("plan_exercises")
      .insert({ day_id: newDayId, exercise_id: ex.exercise_id, order_idx: ex.order_idx })
      .select("id")
      .single();
    if (ne) exMap.set(ex.id, ne.id);
  }
  const oldExIds = Array.from(exMap.keys());
  const { data: sets } = await supabase
    .from("plan_sets")
    .select("plan_exercise_id, set_idx, weight, reps")
    .in("plan_exercise_id", oldExIds);
  const setRows = (sets ?? [])
    .map((s) => {
      const newId = exMap.get(s.plan_exercise_id);
      return newId
        ? { plan_exercise_id: newId, set_idx: s.set_idx, weight: s.weight, reps: s.reps }
        : null;
    })
    .filter(Boolean) as { plan_exercise_id: string; set_idx: number; weight: number; reps: number }[];
  if (setRows.length) await supabase.from("plan_sets").insert(setRows);
  return newDayId;
}

export async function getDay(dayId: string): Promise<DayFull | null> {
  const { data: day } = await supabase
    .from("plan_days")
    .select("id, plan_id, day_index, name")
    .eq("id", dayId)
    .maybeSingle();
  if (!day) return null;
  const { data: exs } = await supabase
    .from("plan_exercises")
    .select("id, exercise_id, order_idx")
    .eq("day_id", dayId)
    .order("order_idx");
  const exList = exs ?? [];
  const exIds = exList.map((e) => e.id);
  const exerciseIds = Array.from(new Set(exList.map((e) => e.exercise_id)));

  const exerciseMap = new Map<string, { id: string; name: string; muscle_group: string }>();
  if (exerciseIds.length) {
    const { data: info } = await supabase
      .from("exercises")
      .select("id, name, muscle_group")
      .in("id", exerciseIds);
    (info ?? []).forEach((e) => exerciseMap.set(e.id, e));
  }

  const setsByEx = new Map<string, PlanSet[]>();
  if (exIds.length) {
    const { data: sets } = await supabase
      .from("plan_sets")
      .select("id, plan_exercise_id, set_idx, weight, reps")
      .in("plan_exercise_id", exIds)
      .order("set_idx");
    (sets ?? []).forEach((s) => {
      const arr = setsByEx.get(s.plan_exercise_id) ?? [];
      arr.push({
        id: s.id,
        setIdx: s.set_idx,
        weight: Number(s.weight ?? 0),
        reps: s.reps ?? 0,
      });
      setsByEx.set(s.plan_exercise_id, arr);
    });
  }

  return {
    id: day.id,
    planId: day.plan_id,
    dayIndex: day.day_index,
    name: day.name,
    exercises: exList.map((e) => ({
      id: e.id,
      exerciseId: e.exercise_id,
      orderIdx: e.order_idx,
      info: exerciseMap.get(e.exercise_id) ?? {
        id: e.exercise_id,
        name: "Exercise",
        muscle_group: "",
      },
      sets: setsByEx.get(e.id) ?? [],
    })),
  };
}

export async function addPlanExercise(
  dayId: string,
  exerciseId: string,
): Promise<PlanExercise> {
  const { data: existing } = await supabase
    .from("plan_exercises")
    .select("order_idx")
    .eq("day_id", dayId)
    .order("order_idx", { ascending: false })
    .limit(1);
  const nextIdx = (existing?.[0]?.order_idx ?? -1) + 1;
  const { data: pe, error } = await supabase
    .from("plan_exercises")
    .insert({ day_id: dayId, exercise_id: exerciseId, order_idx: nextIdx })
    .select("id, exercise_id, order_idx")
    .single();
  if (error || !pe) throw error ?? new Error("Failed to add exercise");

  const setRows = [1, 2, 3].map((idx) => ({
    plan_exercise_id: pe.id,
    set_idx: idx,
    weight: 0,
    reps: 0,
  }));
  const { data: sets } = await supabase
    .from("plan_sets")
    .insert(setRows)
    .select("id, set_idx, weight, reps");

  const { data: info } = await supabase
    .from("exercises")
    .select("id, name, muscle_group")
    .eq("id", exerciseId)
    .single();

  return {
    id: pe.id,
    exerciseId: pe.exercise_id,
    orderIdx: pe.order_idx,
    info: info ?? { id: exerciseId, name: "Exercise", muscle_group: "" },
    sets: (sets ?? []).map((s) => ({
      id: s.id,
      setIdx: s.set_idx,
      weight: Number(s.weight ?? 0),
      reps: s.reps ?? 0,
    })),
  };
}

export async function removePlanExercise(planExerciseId: string) {
  const { error } = await supabase
    .from("plan_exercises")
    .delete()
    .eq("id", planExerciseId);
  if (error) throw error;
}

export async function reorderPlanExercises(dayId: string, orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("plan_exercises").update({ order_idx: idx }).eq("id", id),
    ),
  );
  void touchDayPlan(dayId);
}

async function touchDayPlan(dayId: string) {
  const { data } = await supabase
    .from("plan_days")
    .select("plan_id")
    .eq("id", dayId)
    .single();
  if (data) void touchPlan(data.plan_id);
}

export async function addPlanSet(
  planExerciseId: string,
  seed: { weight: number; reps: number },
): Promise<PlanSet> {
  const { data: existing } = await supabase
    .from("plan_sets")
    .select("set_idx")
    .eq("plan_exercise_id", planExerciseId)
    .order("set_idx", { ascending: false })
    .limit(1);
  const nextIdx = (existing?.[0]?.set_idx ?? 0) + 1;
  const { data, error } = await supabase
    .from("plan_sets")
    .insert({
      plan_exercise_id: planExerciseId,
      set_idx: nextIdx,
      weight: seed.weight,
      reps: seed.reps,
    })
    .select("id, set_idx, weight, reps")
    .single();
  if (error || !data) throw error ?? new Error("Failed to add set");
  return {
    id: data.id,
    setIdx: data.set_idx,
    weight: Number(data.weight ?? 0),
    reps: data.reps ?? 0,
  };
}

export async function updatePlanSet(
  setId: string,
  patch: Partial<{ weight: number; reps: number }>,
) {
  const { error } = await supabase.from("plan_sets").update(patch).eq("id", setId);
  if (error) throw error;
}

export async function removePlanSet(setId: string) {
  const { error } = await supabase.from("plan_sets").delete().eq("id", setId);
  if (error) throw error;
}

/** Lists other days in the same plan (for copy-from picker). */
export async function listSiblingDays(
  planId: string,
  excludeDayId: string,
): Promise<{ id: string; dayIndex: number; name: string | null }[]> {
  const { data } = await supabase
    .from("plan_days")
    .select("id, day_index, name")
    .eq("plan_id", planId)
    .neq("id", excludeDayId)
    .order("day_index");
  return (data ?? []).map((d) => ({
    id: d.id,
    dayIndex: d.day_index,
    name: d.name,
  }));
}

/** Copies all exercises + sets from sourceDayId into targetDayId (appended). */
export async function copyExercisesToDay(sourceDayId: string, targetDayId: string) {
  const { data: exs } = await supabase
    .from("plan_exercises")
    .select("id, exercise_id, order_idx")
    .eq("day_id", sourceDayId)
    .order("order_idx");
  if (!exs?.length) return;

  const { data: existing } = await supabase
    .from("plan_exercises")
    .select("order_idx")
    .eq("day_id", targetDayId)
    .order("order_idx", { ascending: false })
    .limit(1);
  let nextIdx = (existing?.[0]?.order_idx ?? -1) + 1;

  const exMap = new Map<string, string>();
  for (const ex of exs) {
    const { data: ne } = await supabase
      .from("plan_exercises")
      .insert({ day_id: targetDayId, exercise_id: ex.exercise_id, order_idx: nextIdx++ })
      .select("id")
      .single();
    if (ne) exMap.set(ex.id, ne.id);
  }
  const oldIds = Array.from(exMap.keys());
  const { data: sets } = await supabase
    .from("plan_sets")
    .select("plan_exercise_id, set_idx, weight, reps")
    .in("plan_exercise_id", oldIds);
  const rows = (sets ?? [])
    .map((s) => {
      const newId = exMap.get(s.plan_exercise_id);
      return newId
        ? { plan_exercise_id: newId, set_idx: s.set_idx, weight: s.weight, reps: s.reps }
        : null;
    })
    .filter(Boolean) as { plan_exercise_id: string; set_idx: number; weight: number; reps: number }[];
  if (rows.length) await supabase.from("plan_sets").insert(rows);
}
