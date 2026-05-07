import Model, { type IExerciseData, type Muscle } from "react-body-highlighter";
import bodyFront from "@/assets/body-anatomy-front.png";
import bodyBack from "@/assets/body-anatomy-back.png";

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
    if (!trainedMuscles.has(group)) continue;
    const isFocused = focusedMuscle === group;

    let frequency: number;
    if (hasFocus && isFocused) frequency = 2;
    else if (hasFocus) frequency = 1;
    else frequency = 3;

    data.push({ name: group, muscles: GROUP_TO_MUSCLES[group], frequency });
  }
  return data;
}

const HIGHLIGHT_COLORS = [
  "hsl(0 60% 35% / 0.7)",  // freq 1: dim trained
  "hsl(0 85% 55% / 0.95)", // freq 2: focused bright
  "hsl(0 75% 48% / 0.9)",  // freq 3: default trained
];

function BodyModel({
  side,
  data,
  bodyImg,
  hasFocus,
}: {
  side: "anterior" | "posterior";
  data: IExerciseData[];
  bodyImg: string;
  hasFocus: boolean;
}) {
  return (
    <div className="relative mx-auto aspect-[1/2] w-full max-w-[180px]">
      <img
        src={bodyImg}
        alt={`${side} muscle anatomy`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-contain transition-[filter,opacity] duration-300"
        style={{
          filter: hasFocus ? "brightness(0.7)" : "brightness(1)",
        }}
      />
      <div
        className="absolute inset-0 [&_svg]:!h-full [&_svg]:!w-full"
        style={{ mixBlendMode: "screen" }}
      >
        <Model
          type={side}
          data={data}
          bodyColor="transparent"
          highlightedColors={HIGHLIGHT_COLORS}
          style={{ width: "100%", height: "100%" }}
          svgStyle={{ width: "100%", height: "100%" }}
        />
      </div>
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
  const hasFocus = !!focusedMuscle;

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
          <BodyModel
            side="anterior"
            data={data}
            bodyImg={bodyFront}
            hasFocus={hasFocus}
          />
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Front
          </div>
        </div>
      )}
      {showBack && (
        <div className="flex flex-col items-center">
          <BodyModel
            side="posterior"
            data={data}
            bodyImg={bodyBack}
            hasFocus={hasFocus}
          />
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Back
          </div>
        </div>
      )}
    </div>
  );
}

export default MuscleMap;
