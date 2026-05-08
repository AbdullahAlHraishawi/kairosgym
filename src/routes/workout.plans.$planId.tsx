import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, MoreVertical, Loader2, ChevronRight, Trash2 } from "lucide-react";

import { MobileShell } from "@/components/mobile-shell";
import { useAuth } from "@/hooks/use-auth";
import {
  addDay,
  dayDisplayName,
  deleteDay,
  deletePlan,
  duplicateDay,
  getPlan,
  renameDay,
  renamePlan,
  type PlanFull,
} from "@/lib/plans";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/workout/plans/$planId")({
  head: () => ({
    meta: [
      { title: "Edit plan — KAIROS" },
      { name: "description", content: "Edit your workout plan." },
    ],
  }),
  component: PlanEditorPage,
});

function PlanEditorPage() {
  const { planId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [plan, setPlan] = useState<PlanFull | null>(null);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{
    id: string;
    label: string;
    placeholder: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const refresh = async () => {
    const p = await getPlan(planId);
    setPlan(p);
    if (p) setName(p.name);
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const onNameBlur = async () => {
    if (!plan || name.trim() === plan.name) return;
    await renamePlan(planId, name);
    setPlan({ ...plan, name: name.trim() || "My Plan" });
  };

  const onAddDay = async () => {
    await addDay(planId);
    await refresh();
  };

  const onDuplicate = async (dayId: string) => {
    await duplicateDay(dayId);
    await refresh();
  };

  const onDelete = async (dayId: string) => {
    await deleteDay(dayId);
    await refresh();
  };

  const openRename = (dayId: string, current: string | null, fallback: string) => {
    setRenameTarget({ id: dayId, label: "Rename day", placeholder: fallback });
    setRenameValue(current ?? "");
  };

  const submitRename = async () => {
    if (!renameTarget) return;
    await renameDay(renameTarget.id, renameValue);
    setRenameTarget(null);
    await refresh();
  };

  const onDeletePlan = async () => {
    await deletePlan(planId);
    navigate({ to: "/workout" });
  };

  if (!plan) {
    return (
      <MobileShell hideNav>
        <div className="mt-20 flex justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell hideNav>
      <div className="flex items-center justify-between">
        <Link
          to="/workout"
          className="press flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Edit Plan
        </div>
        <div className="w-10" />
      </div>

      <div className="mt-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => void onNameBlur()}
          maxLength={60}
          className="w-full bg-transparent text-3xl font-black uppercase tracking-wider outline-none"
        />
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {plan.days.length} {plan.days.length === 1 ? "Day" : "Days"}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        {plan.days.map((d, i) => {
          const display = dayDisplayName(d);
          const fallback = `Day ${d.dayIndex + 1}`;
          return (
            <div
              key={d.id}
              className="card-premium animate-fade-up flex items-center gap-2 rounded-xl p-3"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link
                to="/workout/plans/$planId/day/$dayId"
                params={{ planId, dayId: d.id }}
                className="press flex flex-1 items-center gap-3"
              >
                <div className="bg-secondary text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black">
                  {d.dayIndex + 1}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold">{display}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {d.exerciseCount} {d.exerciseCount === 1 ? "exercise" : "exercises"}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="press flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openRename(d.id, d.name, fallback)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void onDuplicate(d.id)}>
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => void onDelete(d.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => void onAddDay()}
        className="press bg-card border border-dashed border-border text-foreground mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold uppercase tracking-[0.2em] hover:border-primary/50 hover:text-primary transition"
      >
        <Plus className="h-4 w-4" /> Add Day
      </button>

      <button
        onClick={() => setConfirmDelete(true)}
        className="press text-destructive mt-10 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[11px] font-black uppercase tracking-[0.25em]"
      >
        <Trash2 className="h-4 w-4" /> Delete Plan
      </button>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes all days, exercises and sets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onDeletePlan()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{renameTarget?.label}</DialogTitle>
            <DialogDescription>Leave empty to use the default name.</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={renameTarget?.placeholder}
            maxLength={40}
            className="bg-card mt-2 w-full rounded-xl border border-border px-4 py-3 text-base font-semibold outline-none ring-primary/40 focus:ring-2"
          />
          <DialogFooter>
            <button
              onClick={() => setRenameTarget(null)}
              className="press rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              onClick={() => void submitRename()}
              className="press bg-primary text-primary-foreground rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
}
