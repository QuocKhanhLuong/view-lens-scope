import { useState } from "react";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/StatusPill";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/state/app-store";
import type { Run, RunStatus } from "@/types";

export function ReviewActionBar({ run }: { run: Run }) {
  const { role, dispatch } = useAppStore();
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState<RunStatus | null>(null);

  const decided = run.status === "REVIEWED" || run.status === "FLAGGED";
  const lastDecision = [...run.reviewHistory].reverse().find((e) => e.actorRole === "reviewer");

  const confirm = () => {
    if (!pending) return;
    dispatch({ type: "transition", runId: run.runId, to: pending, role: "reviewer", comment });
    toast(pending === "REVIEWED" ? "Run reviewed" : "Run flagged");
    setPending(null);
    setComment("");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-hairline bg-panel px-3 py-2">
      <StatusPill status={run.status} />
      <span className="mono-num text-[11px] text-muted-foreground">
        {run.runId} · created by {run.createdBy}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {decided && lastDecision ? (
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <Lock className="size-3.5" aria-hidden />
            <span className="mono-num text-[11px]">
              {lastDecision.to} by {lastDecision.actorName} · {lastDecision.at.slice(0, 16).replace("T", " ")}
            </span>
            {lastDecision.comment ? <span>— {lastDecision.comment}</span> : null}
          </p>
        ) : role === "engineer" ? (
          <>
            <Button
              disabled={run.status !== "GENERATED"}
              onClick={() => {
                dispatch({ type: "transition", runId: run.runId, to: "IN_REVIEW", role: "engineer" });
                toast("Run submitted for review");
              }}
              className="h-8 rounded-[4px] bg-fusion text-[12px] text-primary-foreground hover:bg-fusion/90"
            >
              Submit for review
            </Button>
            {run.status !== "GENERATED" ? (
              <span className="text-[11px] text-muted-foreground">
                Only a GENERATED run can be submitted. This run is {run.status}.
              </span>
            ) : null}
            <span className="text-[11px] text-muted-foreground">
              Mark reviewed and Flag are reviewer-only.
            </span>
          </>
        ) : (
          <>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Optional review comment"
              aria-label="Review comment"
              className="h-8 min-h-8 w-64 resize-none rounded-[4px] border-hairline bg-raised py-1 text-[12px]"
            />
            <Button
              disabled={run.status !== "IN_REVIEW"}
              onClick={() => setPending("REVIEWED")}
              className="h-8 rounded-[4px] bg-gt text-[12px] text-primary-foreground hover:bg-gt/90"
            >
              Mark reviewed
            </Button>
            <Button
              disabled={run.status !== "IN_REVIEW"}
              onClick={() => setPending("FLAGGED")}
              className="h-8 rounded-[4px] bg-warning text-[12px] text-primary-foreground hover:bg-warning/90"
            >
              Flag
            </Button>
            {run.status !== "IN_REVIEW" ? (
              <span className="text-[11px] text-muted-foreground">
                A run must be submitted by an engineer before it can be decided.
              </span>
            ) : null}
          </>
        )}
      </div>

      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="rounded-[4px] border-hairline bg-panel">
          <DialogHeader>
            <DialogTitle>
              {pending === "REVIEWED" ? "Mark reviewed" : "Flag"} — {run.runId}
            </DialogTitle>
            <DialogDescription>
              {run.sample.sceneName} · frame {run.sample.frameIndex} ·{" "}
              {run.model.checkpointLabel} · {run.model.taskHead} · {run.model.precision}
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground">
            {comment ? `Comment: ${comment}` : "No comment attached."}
          </p>
          <DialogFooter>
            <Button variant="ghost" className="h-8 text-[12px]" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              onClick={confirm}
              className="h-8 rounded-[4px] bg-fusion text-[12px] text-primary-foreground"
            >
              {pending === "REVIEWED" ? "Mark reviewed" : "Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
