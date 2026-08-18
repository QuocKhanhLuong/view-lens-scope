import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useAppStore } from "@/state/app-store";
import { StatusPill } from "@/components/StatusPill";
import { EmptyState } from "@/components/Panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { RunStatus } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Runs — BEV Vision" },
      {
        name: "description",
        content:
          "Every camera–LiDAR fusion run on a nuScenes sample, with review status, latency and object counts.",
      },
      { property: "og:title", content: "Runs — BEV Vision" },
      {
        property: "og:description",
        content: "Run list and review queue for the BEV Vision perception sandbox.",
      },
    ],
  }),
  component: RunsPage,
});

const FILTERS: (RunStatus | "ALL")[] = [
  "ALL",
  "GENERATED",
  "IN_REVIEW",
  "REVIEWED",
  "FLAGGED",
  "FAILED",
];

const TASK_LABEL = { occupancy: "Occupancy", bev_segmentation: "BEV segmentation" } as const;

function RunsPage() {
  const { runs, role } = useAppStore();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RunStatus | "ALL">("ALL");
  const [query, setQuery] = useState("");
  const [queue, setQueue] = useState<"all" | "awaiting">("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return runs.filter((r) => {
      if (status !== "ALL" && r.status !== status) return false;
      if (role === "reviewer" && queue === "awaiting" && r.status !== "IN_REVIEW") return false;
      if (!q) return true;
      return (
        r.runId.toLowerCase().includes(q) ||
        r.sample.sceneName.toLowerCase().includes(q) ||
        r.sample.sampleToken.toLowerCase().includes(q)
      );
    });
  }, [runs, status, query, role, queue]);

  return (
    <div className="mx-auto max-w-[1440px] space-y-3 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px]">Runs</h1>
          <p className="text-muted-foreground">
            One run inspects one nuScenes sample through one checkpoint and one dense task head.
          </p>
        </div>
        {role === "engineer" ? (
          <Button
            onClick={() => navigate({ to: "/runs/new" })}
            className="h-8 gap-1.5 rounded-[4px] bg-fusion text-[12px] text-primary-foreground hover:bg-fusion/90"
          >
            <Plus className="size-3.5" aria-hidden /> New run
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button disabled className="h-8 gap-1.5 rounded-[4px] text-[12px]">
                  <Plus className="size-3.5" aria-hidden /> New run
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Reviewers cannot start runs. Switch to Perception engineer.</TooltipContent>
          </Tooltip>
        )}
      </div>

      {role === "reviewer" ? (
        <div className="inline-flex rounded-[4px] border border-hairline bg-raised p-px">
          {(["all", "awaiting"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setQueue(k)}
              aria-pressed={queue === k}
              className={cn(
                "rounded-[3px] px-2.5 py-1 text-[12px]",
                queue === k ? "bg-panel text-foreground" : "text-muted-foreground",
              )}
            >
              {k === "all" ? "All runs" : "Awaiting review"}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            aria-pressed={status === f}
            className={cn(
              "mono-num rounded-[3px] border px-2 py-1 text-[10px] tracking-[0.08em]",
              status === f
                ? "border-fusion/60 bg-fusion/10 text-fusion"
                : "border-hairline text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
        <div className="relative ml-auto w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search run ID, scene or token"
            aria-label="Search runs"
            className="h-8 rounded-[4px] border-hairline bg-panel pl-7 text-[12px]"
          />
        </div>
      </div>

      <div className="border border-hairline bg-panel">
        {rows.length === 0 ? (
          <EmptyState
            title={
              runs.length === 0
                ? "No runs yet. Start one from a nuScenes sample."
                : "No runs match this filter."
            }
            hint={runs.length === 0 ? undefined : "Clear the status chips or the search field."}
            action={
              runs.length === 0 && role === "engineer" ? (
                <Link
                  to="/runs/new"
                  className="mt-2 rounded-[4px] bg-fusion px-3 py-1.5 text-primary-foreground"
                >
                  New run
                </Link>
              ) : undefined
            }
          />
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-hairline">
                {[
                  "Run ID",
                  "Scene / sample",
                  "Checkpoint",
                  "Dense task",
                  "Status",
                  "Created",
                  "End-to-end",
                  "Objects",
                  "Reviewer",
                ].map((h) => (
                  <th key={h} className="panel-title px-3 py-2 font-normal whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const reviewer = [...r.reviewHistory]
                  .reverse()
                  .find((e) => e.actorRole === "reviewer");
                return (
                  <tr key={r.runId} className="border-b border-hairline last:border-0 hover:bg-raised">
                    <td className="px-3 py-1.5">
                      <Link
                        to="/runs/$runId"
                        params={{ runId: r.runId }}
                        className="mono-num text-[12px] text-camera hover:underline"
                      >
                        {r.runId}
                      </Link>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="mono-num text-[12px]">{r.sample.sceneName}</span>
                      <span className="mono-num text-muted-foreground"> · f{r.sample.frameIndex}</span>
                    </td>
                    <td className="mono-num px-3 py-1.5 text-[12px]">{r.model.checkpointLabel}</td>
                    <td className="px-3 py-1.5">{TASK_LABEL[r.model.taskHead]}</td>
                    <td className="px-3 py-1.5">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="mono-num px-3 py-1.5 text-[12px] text-muted-foreground">
                      {r.createdAt.slice(0, 16).replace("T", " ")}
                    </td>
                    <td className="mono-num px-3 py-1.5 text-right text-[12px]">
                      {r.status === "FAILED" ? "—" : `${r.runtime.timings.endToEndMs} ms`}
                    </td>
                    <td className="mono-num px-3 py-1.5 text-right text-[12px]">
                      {r.status === "FAILED" ? "—" : r.frameStats.objectCount}
                    </td>
                    <td className="mono-num px-3 py-1.5 text-[12px] text-muted-foreground">
                      {reviewer?.actorName ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
