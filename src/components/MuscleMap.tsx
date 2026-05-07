import Model, { type IExerciseData, type Muscle } from "react-body-highlighter";

export type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms";

type Props = {
  trainedMuscles: Set<MuscleGroup | string>;
  focusedMuscle?: MuscleGroup | string | null;
  view?: "both" | "front" | "back";
  className?: string;
};

const GROUP_TO_MUSCLES: Record<MuscleGroup, Muscle[]> = {
  Chest: ["chest"],
  Back: ["trapezius", "upper-back", "lower-back"],
  Shoulders: ["front-deltoids", "back-deltoids"],
  Arms: ["biceps", "triceps", "forearm"],
  Legs: ["quadriceps", "hamstring", "calves", "gluteal", "adductor", "abductors"],
};

const ALL_GROUPS: MuscleGroup[] = ["Chest", "Back", "Shoulders", "Arms", "Legs"];

function buildData(
  trainedMuscles: Set<string>,
  focusedMuscle: string | null
): IExerciseData[] {
  const hasFocus = !!focusedMuscle;
  const data: IExerciseData[] = [];

  for (const group of ALL_GROUPS) {
    const isTrained = trainedMuscles.has(group);
    if (!isTrained) continue;

    const muscles = GROUP_TO_MUSCLES[group];
    const isFocused = focusedMuscle === group;

    // frequency drives which color (highlightedColors[freq-1]) the lib applies.
    // 2 = focused (bright), 1 = trained-dim (when something else is focused),
    // default trained = 3 (mid red) when no focus.
    let frequency: number;
    if (hasFocus && isFocused) frequency = 2;
    else if (hasFocus) frequency = 1;
    else frequency = 3;

    data.push({
      name: group,
      muscles,
      frequency,
    });
  }

  return data;
}

// Index 0 = freq 1 (dim), index 1 = freq 2 (bright), index 2 = freq 3 (default trained)
const HIGHLIGHT_COLORS = [
  "hsl(0 60% 30% / 0.55)", // dim — trained but unfocused
  "hsl(0 80% 55%)",         // bright — focused
  "hsl(0 70% 45%)",         // default trained, no focus
];

const BODY_COLOR = "hsl(220 10% 22%)";

function BodyModel({
  side,
  data,
}: {
  side: "anterior" | "posterior";
  data: IExerciseData[];
}) {
  return (
    <div className="relative mx-auto aspect-[2/3] w-full max-w-[220px]">
      <Model
        type={side}
        data={data}
        bodyColor={BODY_COLOR}
        highlightedColors={HIGHLIGHT_COLORS}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export function MuscleMap({
  trainedMuscles,
  focusedMuscle = null,
  view = "both",
  className,
}: Props) {
  const showFront = view === "both" || view === "front";
  const showBack = view === "both" || view === "back";

  const data = buildData(
    trainedMuscles as Set<string>,
    (focusedMuscle as string | null) ?? null
  );

  return (
    <div
      className={
        "mt-3 grid gap-3 " +
        (view === "both" ? "grid-cols-2 " : "grid-cols-1 ") +
        (className ?? "")
      }
    >
      {showFront && (
        <div className="flex flex-col items-center">
          <BodyModel side="anterior" data={data} />
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Front
          </div>
        </div>
      )}
      {showBack && (
        <div className="flex flex-col items-center">
          <BodyModel side="posterior" data={data} />
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Back
          </div>
        </div>
      )}
    </div>
  );
}

export default MuscleMap;
