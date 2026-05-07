/**
 * MuscleMap — reusable, deterministic muscle highlight visualization.
 *
 * Self-contained SVG (body silhouette + muscle regions in a shared viewBox),
 * so highlights always align with the body. Drop in anywhere by passing
 * `trainedMuscles` and optional `focusedMuscle`.
 */

export type MuscleGroup = "Chest" | "Back" | "Legs" | "Shoulders" | "Arms";

type Props = {
  trainedMuscles: Set<MuscleGroup | string>;
  focusedMuscle?: MuscleGroup | string | null;
  view?: "both" | "front" | "back";
  className?: string;
};

const VB_W = 200;
const VB_H = 320;

/** Stylized body silhouette (front). Symmetric around x=100. */
const FRONT_SILHOUETTE = `
  M100 8
  c-11 0 -19 8 -19 19 0 7 3 13 8 17
  c-2 3 -3 6 -3 10
  c-9 1 -18 4 -25 9 -7 5 -11 12 -13 22
  l-8 38 c-1 6 -3 12 -6 17
  c-3 5 -5 10 -6 16
  l-2 14 c0 3 2 5 5 5 3 0 5 -2 5 -5
  l1 -10 c1 -5 3 -9 5 -13
  c1 8 1 17 0 25
  l-3 28 c-1 6 0 12 1 18
  l5 36 c1 7 2 14 1 21
  l-3 32 c0 4 3 7 7 7 4 0 7 -3 7 -7
  l1 -30 c0 -5 1 -10 2 -15
  l4 -28 c1 -5 2 -10 3 -15
  c1 5 2 10 3 15
  l4 28 c1 5 2 10 2 15
  l1 30 c0 4 3 7 7 7 4 0 7 -3 7 -7
  l-3 -32 c-1 -7 0 -14 1 -21
  l5 -36 c1 -6 2 -12 1 -18
  l-3 -28 c-1 -8 -1 -17 0 -25
  c2 4 4 8 5 13
  l1 10 c0 3 2 5 5 5 3 0 5 -2 5 -5
  l-2 -14 c-1 -6 -3 -11 -6 -16
  c-3 -5 -5 -11 -6 -17
  l-8 -38 c-2 -10 -6 -17 -13 -22
  c-7 -5 -16 -8 -25 -9
  c0 -4 -1 -7 -3 -10
  c5 -4 8 -10 8 -17 0 -11 -8 -19 -19 -19 z
`;

/** Stylized body silhouette (back). Same outline, simpler. */
const BACK_SILHOUETTE = FRONT_SILHOUETTE;

// ---- FRONT muscle regions ----
const FRONT_REGIONS: Record<MuscleGroup, string[]> = {
  Chest: [
    // left pec
    "M100 70 C 88 70, 78 76, 75 88 C 74 96, 80 104, 92 104 C 99 104, 100 100, 100 92 Z",
    // right pec
    "M100 70 C 112 70, 122 76, 125 88 C 126 96, 120 104, 108 104 C 101 104, 100 100, 100 92 Z",
  ],
  Shoulders: [
    // left front delt
    "M70 70 C 62 72, 56 80, 56 90 C 56 96, 62 98, 70 96 C 76 94, 80 86, 78 78 C 77 73, 74 70, 70 70 Z",
    // right front delt
    "M130 70 C 138 72, 144 80, 144 90 C 144 96, 138 98, 130 96 C 124 94, 120 86, 122 78 C 123 73, 126 70, 130 70 Z",
  ],
  Arms: [
    // left bicep
    "M58 92 C 50 96, 46 108, 48 124 C 49 134, 52 142, 56 148 C 62 148, 66 142, 66 134 L 66 100 C 64 94, 61 92, 58 92 Z",
    // left forearm
    "M52 150 C 48 158, 46 170, 48 182 C 50 188, 54 190, 58 188 C 62 186, 64 178, 64 170 L 62 152 C 60 148, 56 148, 52 150 Z",
    // right bicep
    "M142 92 C 150 96, 154 108, 152 124 C 151 134, 148 142, 144 148 C 138 148, 134 142, 134 134 L 134 100 C 136 94, 139 92, 142 92 Z",
    // right forearm
    "M148 150 C 152 158, 154 170, 152 182 C 150 188, 146 190, 142 188 C 138 186, 136 178, 136 170 L 138 152 C 140 148, 144 148, 148 150 Z",
  ],
  Legs: [
    // left quad
    "M82 178 C 74 184, 70 200, 72 222 C 74 240, 80 256, 86 262 C 92 260, 96 250, 96 238 L 96 188 C 94 180, 88 176, 82 178 Z",
    // right quad
    "M118 178 C 126 184, 130 200, 128 222 C 126 240, 120 256, 114 262 C 108 260, 104 250, 104 238 L 104 188 C 106 180, 112 176, 118 178 Z",
    // left calf
    "M82 268 C 78 276, 76 288, 78 300 C 80 306, 84 308, 88 304 C 92 300, 94 290, 94 280 L 94 268 C 90 264, 86 264, 82 268 Z",
    // right calf
    "M118 268 C 122 276, 124 288, 122 300 C 120 306, 116 308, 112 304 C 108 300, 106 290, 106 280 L 106 268 C 110 264, 114 264, 118 268 Z",
  ],
  Back: [], // n/a on front view
};

// ---- BACK muscle regions ----
const BACK_REGIONS: Record<MuscleGroup, string[]> = {
  Back: [
    // upper traps
    "M100 60 C 88 60, 80 66, 78 74 C 84 76, 92 78, 100 78 C 108 78, 116 76, 122 74 C 120 66, 112 60, 100 60 Z",
    // lats / mid-back (single shape covering torso)
    "M75 84 C 70 100, 70 124, 76 144 C 84 158, 92 164, 100 164 C 108 164, 116 158, 124 144 C 130 124, 130 100, 125 84 C 118 88, 110 90, 100 90 C 90 90, 82 88, 75 84 Z",
  ],
  Shoulders: [
    // left rear delt
    "M70 70 C 62 72, 56 80, 56 90 C 56 96, 62 98, 70 96 C 76 94, 80 86, 78 78 C 77 73, 74 70, 70 70 Z",
    // right rear delt
    "M130 70 C 138 72, 144 80, 144 90 C 144 96, 138 98, 130 96 C 124 94, 120 86, 122 78 C 123 73, 126 70, 130 70 Z",
  ],
  Arms: [
    // left tricep
    "M58 92 C 50 96, 46 108, 48 124 C 49 134, 52 142, 56 148 C 62 148, 66 142, 66 134 L 66 100 C 64 94, 61 92, 58 92 Z",
    // left forearm
    "M52 150 C 48 158, 46 170, 48 182 C 50 188, 54 190, 58 188 C 62 186, 64 178, 64 170 L 62 152 C 60 148, 56 148, 52 150 Z",
    // right tricep
    "M142 92 C 150 96, 154 108, 152 124 C 151 134, 148 142, 144 148 C 138 148, 134 142, 134 134 L 134 100 C 136 94, 139 92, 142 92 Z",
    // right forearm
    "M148 150 C 152 158, 154 170, 152 182 C 150 188, 146 190, 142 188 C 138 186, 136 178, 136 170 L 138 152 C 140 148, 144 148, 148 150 Z",
  ],
  Legs: [
    // glutes (two)
    "M100 168 C 90 168, 82 174, 80 184 C 80 192, 88 196, 96 194 C 100 193, 100 188, 100 180 Z",
    "M100 168 C 110 168, 118 174, 120 184 C 120 192, 112 196, 104 194 C 100 193, 100 188, 100 180 Z",
    // left hamstring
    "M82 198 C 74 206, 70 220, 72 240 C 74 256, 80 268, 86 272 C 92 270, 96 260, 96 250 L 96 208 C 94 200, 88 196, 82 198 Z",
    // right hamstring
    "M118 198 C 126 206, 130 220, 128 240 C 126 256, 120 268, 114 272 C 108 270, 104 260, 104 250 L 104 208 C 106 200, 112 196, 118 198 Z",
    // left calf
    "M82 278 C 78 286, 76 296, 78 306 C 80 312, 84 312, 88 308 C 92 304, 94 296, 94 288 L 94 278 C 90 274, 86 274, 82 278 Z",
    // right calf
    "M118 278 C 122 286, 124 296, 122 306 C 120 312, 116 312, 112 308 C 108 304, 106 296, 106 288 L 106 278 C 110 274, 114 274, 118 278 Z",
  ],
  Chest: [], // n/a on back view
};

const ALL_GROUPS: MuscleGroup[] = ["Chest", "Back", "Shoulders", "Arms", "Legs"];

function opacityFor(
  group: MuscleGroup,
  trained: boolean,
  focusedMuscle: string | null | undefined
): number {
  const hasFocus = !!focusedMuscle;
  const isFocused = focusedMuscle === group;
  if (isFocused) return 0.85;
  if (hasFocus && trained) return 0.18;
  if (hasFocus) return 0;
  if (trained) return 0.6;
  return 0;
}

function BodySvg({
  side,
  trainedMuscles,
  focusedMuscle,
}: {
  side: "front" | "back";
  trainedMuscles: Set<string>;
  focusedMuscle?: string | null;
}) {
  const silhouette = side === "front" ? FRONT_SILHOUETTE : BACK_SILHOUETTE;
  const regions = side === "front" ? FRONT_REGIONS : BACK_REGIONS;
  const hasFocus = !!focusedMuscle;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="block h-full w-full"
      aria-hidden="true"
    >
      {/* Body silhouette fill (subtle) */}
      <path
        d={silhouette}
        fill="color-mix(in oklab, var(--muted-foreground) 8%, transparent)"
        stroke="color-mix(in oklab, var(--foreground) 35%, transparent)"
        strokeWidth={0.8}
        style={{
          transition: "opacity 300ms ease",
          opacity: hasFocus ? 0.55 : 1,
        }}
      />

      {/* Muscle group highlights, clipped to body silhouette */}
      <defs>
        <clipPath id={`body-clip-${side}`}>
          <path d={silhouette} />
        </clipPath>
      </defs>
      <g clipPath={`url(#body-clip-${side})`}>
        {ALL_GROUPS.map((group) => {
          const paths = regions[group];
          if (!paths || paths.length === 0) return null;
          const trained = trainedMuscles.has(group);
          const op = opacityFor(group, trained, focusedMuscle);
          return (
            <g
              key={group}
              style={{ transition: "opacity 300ms ease", opacity: op }}
            >
              {paths.map((d, i) => (
                <path key={i} d={d} fill="var(--primary)" />
              ))}
            </g>
          );
        })}
      </g>
    </svg>
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
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[220px]">
            <BodySvg
              side="front"
              trainedMuscles={trainedMuscles as Set<string>}
              focusedMuscle={focusedMuscle}
            />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Front
          </div>
        </div>
      )}
      {showBack && (
        <div className="flex flex-col items-center">
          <div className="relative mx-auto aspect-[2/3] w-full max-w-[220px]">
            <BodySvg
              side="back"
              trainedMuscles={trainedMuscles as Set<string>}
              focusedMuscle={focusedMuscle}
            />
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Back
          </div>
        </div>
      )}
    </div>
  );
}

export default MuscleMap;
