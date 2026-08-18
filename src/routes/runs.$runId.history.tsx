import { createFileRoute, useParams } from "@tanstack/react-router";
import { useAppStore } from "@/state/app-store";
import { Panel, EmptyState } from "@/components/Panel";
import { StatusPill } from "@/components/StatusPill";

export const Route = createFileRoute("/runs/$runId/history")({
  head: () => ({
    meta: [
      { title: "Review history — BEV Vision" },
      {
        name: "description",
        content: "Append-only timeline of status transitions, actors and reviewer comments for a run.",
      },
      { property: "og:title", content: "Review history — BEV Vision" },
      {
        property: "og:description",
        content: "Who changed the run status, when, and what they said about it.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { runId } = useParams({ from: "/runs/$runId" });
  const { getRun } = useAppStore();
  const run = getRun(runId)!;
  const events = run.reviewHistory;

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Panel title="Review history">
        {events.length === 0 ? (
          <EmptyState
            title="No review activity yet"
            hint="Transitions appear here once the run is submitted."
          />
        ) : (
          <ol className="relative ml-2 border-l border-hairline">
            {events.map((e, i) => (
              <li key={`${e.at}-${i}`} className="relative py-3 pl-5">
                <span className="absolute -left-[4.5px] top-[18px] size-2 rounded-full bg-fusion" />
                <div className="flex flex-wrap items-center gap-2">
                  {e.from ? (
                    <>
                      <StatusPill status={e.from} />
                      <span className="text-muted-foreground">→</span>
                    </>
                  ) : null}
                  <StatusPill status={e.to} />
                  <span className="mono-num text-[11px] text-muted-foreground">
                    {e.at.replace("T", " ").slice(0, 19)} UTC
                  </span>
                </div>
                <p className="mt-1">
                  {e.actorName}{" "}
                  <span className="text-muted-foreground">
                    ({e.actorRole === "engineer" ? "Perception engineer" : "Reviewer"})
                  </span>
                </p>
                {e.comment ? (
                  <p className="mt-1 border-l-2 border-hairline pl-2 text-muted-foreground">
                    {e.comment}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
