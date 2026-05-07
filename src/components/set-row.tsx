import { Check } from "lucide-react";

export interface SetRowState {
  weight: number;
  reps: number;
  done: boolean;
}

interface Props {
  index: number;
  set: SetRowState;
  onChange: (patch: Partial<SetRowState>) => void;
}

export function SetRow({ index, set, onChange }: Props) {
  const done = set.done;
  return (
    <div
      className={`relative flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-all ${
        done
          ? "border-primary/50 bg-primary/10 shadow-glow"
          : "border-border bg-secondary/30"
      }`}
    >
      {done && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-primary"
          style={{ boxShadow: "0 0 12px var(--primary-glow)" }}
        />
      )}
      <div
        className={`flex h-9 w-12 shrink-0 items-center justify-center rounded-lg text-[10px] font-black uppercase tracking-wider ${
          done ? "bg-primary/20 text-primary" : "bg-background/60 text-muted-foreground"
        }`}
      >
        SET<span className="ml-0.5">{index + 1}</span>
      </div>

      <div className="relative flex-1">
        <input
          type="number"
          inputMode="decimal"
          value={set.weight || ""}
          onChange={(e) => onChange({ weight: parseFloat(e.target.value) || 0 })}
          placeholder="0"
          className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 pr-8 text-base font-semibold tabular-nums outline-none ring-primary/40 focus:ring-2"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-muted-foreground">
          kg
        </span>
      </div>

      <div className="relative flex-1">
        <input
          type="number"
          inputMode="numeric"
          value={set.reps || ""}
          onChange={(e) => onChange({ reps: parseInt(e.target.value) || 0 })}
          placeholder="0"
          className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 pr-10 text-base font-semibold tabular-nums outline-none ring-primary/40 focus:ring-2"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider text-muted-foreground">
          reps
        </span>
      </div>

      <button
        onClick={() => onChange({ done: !done })}
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        className={`press flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all ${
          done
            ? "bg-primary text-primary-foreground shadow-glow scale-105"
            : "bg-background/60 border border-border text-muted-foreground"
        }`}
      >
        <Check className="h-5 w-5" />
      </button>
    </div>
  );
}
