import { cn } from "@/lib/utils";
import type { RunStatus } from "@/types";

const STYLE: Record<RunStatus, string> = {
  QUEUED: "border-hairline text-muted-foreground bg-raised",
  RUNNING: "border-camera/50 text-camera bg-camera/10",
  GENERATED: "border-fusion/50 text-fusion bg-fusion/10",
  IN_REVIEW: "border-lidar/50 text-lidar bg-lidar/10",
  REVIEWED: "border-gt/50 text-gt bg-gt/10",
  FLAGGED: "border-warning/60 text-warning bg-warning/10",
  FAILED: "border-error/60 text-error bg-error/10",
};

export function StatusPill({ status, className }: { status: RunStatus; className?: string }) {
  return (
    <span
      className={cn(
        "mono-num inline-flex items-center rounded-sm border px-1.5 py-px text-[10px] tracking-[0.08em]",
        STYLE[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
