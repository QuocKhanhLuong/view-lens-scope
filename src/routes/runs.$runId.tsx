import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useAppStore } from "@/state/app-store";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/Panel";

export const Route = createFileRoute("/runs/$runId")({
  head: () => ({
    meta: [
      { title: "Run detail — BEV Vision" },
      {
        name: "description",
        content:
          "Inspect camera, LiDAR, BEV and dense output for one fusion run, with frame statistics and review actions.",
      },
      { property: "og:title", content: "Run detail — BEV Vision" },
      {
        property: "og:description",
        content: "Synchronized views, frame statistics and the two-person review loop.",
      },
    ],
  }),
  component: RunLayout,
});

const TABS = [
  { to: "/runs/$runId", label: "Inspect", exact: true },
  { to: "/runs/$runId/evaluation", label: "Evaluation", exact: false },
  { to: "/runs/$runId/history", label: "Review history", exact: false },
] as const;

function RunLayout() {
  const { runId } = useParams({ from: "/runs/$runId" });
  const { getRun } = useAppStore();
  const run = getRun(runId);

  if (!run)
    return (
      <div className="p-8">
        <EmptyState
          title="Run not found"
          hint={`No run with ID ${runId} exists in this session.`}
          action={
            <Link to="/" className="mt-2 rounded-[4px] border border-hairline px-3 py-1.5">
              Back to runs
            </Link>
          }
        />
      </div>
    );

  return (
    <div className="flex min-h-[calc(100vh-2.75rem)] flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline bg-panel px-3 py-2">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          Runs
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="mono-num text-[13px]">{run.runId}</span>
        <StatusPill status={run.status} />
        <span className="mono-num text-[11px] text-muted-foreground">
          {run.sample.sceneName} · frame {run.sample.frameIndex} · {run.model.checkpointLabel} ·{" "}
          {run.model.precision}
        </span>
        <nav className="ml-auto flex items-center gap-1" aria-label="Run views">
          {TABS.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              params={{ runId }}
              activeOptions={{ exact: t.exact }}
              className="rounded-[3px] px-2 py-1 text-muted-foreground hover:text-foreground"
              activeProps={{ className: "bg-raised text-foreground" }}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {!run.syncOk ? (
        <div className="flex items-center gap-2 border-b border-warning/50 bg-warning/10 px-3 py-1.5">
          <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
          <p className="text-warning">
            Sensor timestamps disagree by {run.sample.maxSyncSkewMs} ms. Views may not describe the
            same instant.
          </p>
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
