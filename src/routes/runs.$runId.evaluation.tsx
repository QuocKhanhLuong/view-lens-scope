import { createFileRoute, useParams } from "@tanstack/react-router";
import { useAppStore } from "@/state/app-store";
import { Panel, EmptyState } from "@/components/Panel";
import { Metric, ScopeBadge } from "@/components/Metric";
import { EVALUATIONS } from "@/mocks/runs";

export const Route = createFileRoute("/runs/$runId/evaluation")({
  head: () => ({
    meta: [
      { title: "Evaluation — BEV Vision" },
      {
        name: "description",
        content:
          "Dataset-level detection, dense and runtime metrics computed over a named nuScenes subset.",
      },
      { property: "og:title", content: "Evaluation — BEV Vision" },
      {
        property: "og:description",
        content: "mAP, NDS, mIoU and runtime over the named evaluation subset.",
      },
    ],
  }),
  component: EvaluationPage,
});

function ProtocolRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="mono-num text-right text-[12px]">{value}</span>
    </div>
  );
}

function EvaluationPage() {
  const { runId } = useParams({ from: "/runs/$runId" });
  const { getRun } = useAppStore();
  const run = getRun(runId)!;
  const report = EVALUATIONS[run.model.checkpointId];

  if (run.status === "FAILED" || !report)
    return (
      <div className="p-6">
        <EmptyState
          title="Metrics unavailable — inference did not complete"
          hint={run.failureReason ?? "No evaluation report is registered for this checkpoint."}
        />
      </div>
    );

  const chartData = report.detection.perClass.map((c) => ({ cls: c.cls, ap: c.ap }));

  return (
    <div className="mx-auto max-w-[1440px] space-y-3 p-4">
      <p className="text-muted-foreground">
        Computed over the named subset below — not over this single sample.
      </p>

      <Panel title="Protocol">
        <div className="grid gap-x-8 md:grid-cols-2">
          <div>
            <ProtocolRow label="Subset" value={report.subsetName} />
            <ProtocolRow label="Frames" value={String(report.frameCount)} />
            <ProtocolRow label="Matching protocol" value={report.protocol} />
            <ProtocolRow label="Coordinate frame" value="Ego vehicle, right-handed" />
            <ProtocolRow label="Class set" value="10 nuScenes detection classes" />
            <ProtocolRow label="Score threshold" value={report.threshold.toFixed(2)} />
          </div>
          <div>
            <ProtocolRow label="GPU" value={report.hardware.gpuModel} />
            <ProtocolRow label="Driver" value={report.hardware.driver} />
            <ProtocolRow label="Precision" value={report.hardware.precision} />
            <ProtocolRow label="Batch size" value={String(report.hardware.batchSize)} />
            <ProtocolRow label="Warm-up" value="5 frames discarded before timing" />
            <ProtocolRow label="Timings include host transfer" value="Yes" />
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Detection metrics">
          <div className="grid gap-x-8 sm:grid-cols-2">
            <Metric label="mAP" value={report.detection.mAP} scope="eval-subset" emphasis />
            <Metric label="NDS" value={report.detection.nds} scope="eval-subset" emphasis />
            <Metric label="Precision" value={report.detection.precision} scope="eval-subset" />
            <Metric label="Recall" value={report.detection.recall} scope="eval-subset" />
            <Metric label="True positives" value={report.detection.tp} scope="eval-subset" />
            <Metric label="False positives" value={report.detection.fp} scope="eval-subset" />
            <Metric label="False negatives" value={report.detection.fn} scope="eval-subset" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <h3 className="panel-title">Per-class AP</h3>
            <ScopeBadge scope="eval-subset" />
          </div>
          <ul className="mt-2 space-y-1">
            {chartData.map((c) => (
              <li key={c.cls} className="flex items-center gap-2">
                <span className="w-32 shrink-0 truncate text-muted-foreground">{c.cls}</span>
                <span className="h-2.5 flex-1 bg-raised">
                  <span
                    className="block h-full bg-fusion"
                    style={{ width: `${Math.round(c.ap * 100)}%` }}
                    title={`AP ${c.ap} · EVAL SUBSET`}
                  />
                </span>
                <span className="mono-num w-12 text-right text-[11px]">{c.ap.toFixed(3)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">
            AP at the protocol's centre-distance thresholds, averaged over the subset.
          </p>
        </Panel>

        <div className="space-y-3">
          <Panel title="Dense metrics">
            {report.dense && report.dense.kind === run.model.taskHead ? (
              <>
                <Metric label="mIoU" value={report.dense.mIoU} scope="eval-subset" emphasis />
                {report.dense.perClass.map((c) => (
                  <Metric key={c.cls} label={`IoU — ${c.cls}`} value={c.iou} scope="eval-subset" />
                ))}
              </>
            ) : (
              <p className="text-muted-foreground">
                This run's task head produces no IoU-comparable artifact.
              </p>
            )}
          </Panel>

          <Panel title="Runtime">
            <Metric label="P50 latency" value={report.runtime.p50Ms} unit="ms" scope="eval-subset" />
            <Metric label="P95 latency" value={report.runtime.p95Ms} unit="ms" scope="eval-subset" />
            <Metric
              label="Model inference FPS"
              value={report.runtime.inferenceFps}
              unit="fps"
              scope="eval-subset"
              protocolNote="Model throughput over the subset. Not the browser render rate."
            />
            <Metric
              label="Frontend render FPS"
              value={60.0}
              unit="fps"
              scope="target"
              protocolNote="Viewer paint target in the browser. Unrelated to model throughput."
            />
            <Metric label="Peak VRAM" value={report.runtime.peakVramGb} unit="GB" scope="eval-subset" />
            <Metric label="GPU utilisation" value={run.runtime.gpuUtilPct} unit="%" scope="eval-subset" />
            <Metric
              label="GPU-hours / 1000 frames"
              value={report.runtime.gpuHoursPer1000Frames}
              scope="eval-subset"
              protocolNote={report.runtime.costAssumption}
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Cost assumption: {report.runtime.costAssumption}
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
