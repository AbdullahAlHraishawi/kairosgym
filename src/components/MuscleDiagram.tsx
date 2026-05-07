import frontBodyDefault from "@/assets/body-front.png";
import backBodyDefault from "@/assets/body-back.png";
import maskFrontChest from "@/assets/mask-front-chest.png";
import maskFrontShoulders from "@/assets/mask-front-shoulders.png";
import maskFrontArms from "@/assets/mask-front-arms.png";
import maskFrontLegs from "@/assets/mask-front-legs.png";
import maskBackBack from "@/assets/mask-back-back.png";
import maskBackShoulders from "@/assets/mask-back-shoulders.png";
import maskBackArms from "@/assets/mask-back-arms.png";
import maskBackLegs from "@/assets/mask-back-legs.png";

type Props = {
  trainedMuscles: Set<string>;
  focusedMuscle?: string | null;
  frontBodyImage?: string;
  backBodyImage?: string;
};

type MaskLayer = { muscle: string; src: string };

const FRONT_LAYERS: MaskLayer[] = [
  { muscle: "Chest", src: maskFrontChest },
  { muscle: "Shoulders", src: maskFrontShoulders },
  { muscle: "Arms", src: maskFrontArms },
  { muscle: "Legs", src: maskFrontLegs },
];

const BACK_LAYERS: MaskLayer[] = [
  { muscle: "Back", src: maskBackBack },
  { muscle: "Shoulders", src: maskBackShoulders },
  { muscle: "Arms", src: maskBackArms },
  { muscle: "Legs", src: maskBackLegs },
];

function BodyView({
  src,
  alt,
  layers,
  trainedMuscles,
  focusedMuscle,
}: {
  src: string;
  alt: string;
  layers: MaskLayer[];
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
        className="absolute inset-0 h-full w-full object-contain transition-[filter] duration-300"
        style={{ filter: hasFocus ? "brightness(0.55)" : "brightness(1)" }}
      />
      {layers.map((layer) => {
        const trained = trainedMuscles.has(layer.muscle);
        const isFocused = focusedMuscle === layer.muscle;

        let opacity = 0;
        if (isFocused) opacity = 1;
        else if (hasFocus && trained) opacity = 0.2;
        else if (trained) opacity = 0.85;

        const maskStyle = {
          WebkitMaskImage: `url(${layer.src})`,
          maskImage: `url(${layer.src})`,
          WebkitMaskSize: "100% 100%",
          maskSize: "100% 100%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          // Use luminance so white pixels = visible, black/transparent = clear.
          // Prevents masks with opaque black backgrounds from flooding the body.
          WebkitMaskMode: "luminance",
          maskMode: "luminance",
        } as const;

        return (
          <div
            key={layer.muscle}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              ...maskStyle,
              background: "var(--primary)",
              opacity,
              mixBlendMode: "hard-light",
              transition: "opacity 300ms ease",
            }}
          />
        );
      })}
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
          layers={FRONT_LAYERS}
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
          layers={BACK_LAYERS}
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
