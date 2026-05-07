import frontBodyDefault from "@/assets/body-front.png";
import backBodyDefault from "@/assets/body-back.png";

type Props = {
  trainedMuscles: Set<string>;
  focusedMuscle?: string | null;
  frontBodyImage?: string;
  backBodyImage?: string;
};

type Region = {
  muscle: string;
  // ellipse in % of container (cx, cy, rx, ry)
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

// Coordinates tuned against the generated anatomy assets (1024x1536, body centered).
const FRONT_REGIONS: Region[] = [
  // Shoulders (deltoids)
  { muscle: "Shoulders", cx: 32, cy: 22, rx: 8, ry: 5 },
  { muscle: "Shoulders", cx: 68, cy: 22, rx: 8, ry: 5 },
  // Chest (pectorals)
  { muscle: "Chest", cx: 41, cy: 26, rx: 8, ry: 6 },
  { muscle: "Chest", cx: 59, cy: 26, rx: 8, ry: 6 },
  // Arms (biceps + forearms)
  { muscle: "Arms", cx: 24, cy: 33, rx: 5, ry: 7 },
  { muscle: "Arms", cx: 76, cy: 33, rx: 5, ry: 7 },
  { muscle: "Arms", cx: 20, cy: 44, rx: 4.5, ry: 6 },
  { muscle: "Arms", cx: 80, cy: 44, rx: 4.5, ry: 6 },
  // Legs (quads + calves)
  { muscle: "Legs", cx: 41, cy: 60, rx: 7, ry: 9 },
  { muscle: "Legs", cx: 59, cy: 60, rx: 7, ry: 9 },
  { muscle: "Legs", cx: 41, cy: 80, rx: 5, ry: 7 },
  { muscle: "Legs", cx: 59, cy: 80, rx: 5, ry: 7 },
];

const BACK_REGIONS: Region[] = [
  // Shoulders (rear delts) + traps
  { muscle: "Shoulders", cx: 32, cy: 22, rx: 7, ry: 5 },
  { muscle: "Shoulders", cx: 68, cy: 22, rx: 7, ry: 5 },
  // Back (traps + lats)
  { muscle: "Back", cx: 50, cy: 24, rx: 9, ry: 4 },
  { muscle: "Back", cx: 42, cy: 33, rx: 8, ry: 7 },
  { muscle: "Back", cx: 58, cy: 33, rx: 8, ry: 7 },
  // Arms (triceps + forearms)
  { muscle: "Arms", cx: 24, cy: 33, rx: 5, ry: 7 },
  { muscle: "Arms", cx: 76, cy: 33, rx: 5, ry: 7 },
  { muscle: "Arms", cx: 20, cy: 44, rx: 4.5, ry: 6 },
  { muscle: "Arms", cx: 80, cy: 44, rx: 4.5, ry: 6 },
  // Legs (glutes + hamstrings + calves)
  { muscle: "Legs", cx: 42, cy: 50, rx: 7, ry: 5 },
  { muscle: "Legs", cx: 58, cy: 50, rx: 7, ry: 5 },
  { muscle: "Legs", cx: 41, cy: 62, rx: 6, ry: 8 },
  { muscle: "Legs", cx: 59, cy: 62, rx: 6, ry: 8 },
  { muscle: "Legs", cx: 41, cy: 80, rx: 5, ry: 7 },
  { muscle: "Legs", cx: 59, cy: 80, rx: 5, ry: 7 },
];

function BodyView({
  src,
  alt,
  regions,
  trainedMuscles,
  focusedMuscle,
}: {
  src: string;
  alt: string;
  regions: Region[];
  trainedMuscles: Set<string>;
  focusedMuscle?: string | null;
}) {
  const hasFocus = !!focusedMuscle;

  return (
    <div className="relative mx-auto aspect-[2/3] w-full max-w-[220px]">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-contain transition-[filter,opacity] duration-300"
        style={{
          filter: hasFocus ? "brightness(0.55)" : "brightness(0.95)",
        }}
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="muscleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.95" />
            <stop offset="60%" stopColor="var(--primary)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="muscleGlowDim" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="60%" stopColor="var(--primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {regions.map((r, i) => {
          const trained = trainedMuscles.has(r.muscle);
          const isFocused = focusedMuscle === r.muscle;
          let opacity = 0;
          let fill = "url(#muscleGlow)";
          if (isFocused) {
            opacity = 1;
          } else if (hasFocus) {
            // dim non-focused (even if trained)
            opacity = trained ? 0.18 : 0;
            fill = "url(#muscleGlowDim)";
          } else if (trained) {
            opacity = 0.95;
          }
          return (
            <ellipse
              key={i}
              cx={r.cx}
              cy={r.cy}
              rx={r.rx}
              ry={r.ry}
              fill={fill}
              style={{
                mixBlendMode: "screen",
                opacity,
                transition: "opacity 300ms ease, fill 300ms ease",
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function MuscleDiagram({
  trainedMuscles,
  focusedMuscle = null,
  frontBodyImage = frontBodyDefault,
  backBodyImage = backBodyDefault,
}: Props) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="flex flex-col items-center">
        <BodyView
          src={frontBodyImage}
          alt="Front view of human muscle anatomy"
          regions={FRONT_REGIONS}
          trainedMuscles={trainedMuscles}
          focusedMuscle={focusedMuscle}
        />
        <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          Front
        </div>
      </div>
      <div className="flex flex-col items-center">
        <BodyView
          src={backBodyImage}
          alt="Back view of human muscle anatomy"
          regions={BACK_REGIONS}
          trainedMuscles={trainedMuscles}
          focusedMuscle={focusedMuscle}
        />
        <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
          Back
        </div>
      </div>
    </div>
  );
}

export default MuscleDiagram;
