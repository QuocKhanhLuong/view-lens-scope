import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useAppStore } from "@/state/app-store";
import { Panel, EmptyState } from "@/components/Panel";
import { CameraMosaic } from "@/components/viewer/CameraMosaic";
import { LidarPanel } from "@/components/viewer/LidarPanel";
import { BevPanel } from "@/components/viewer/BevPanel";
import { DensePanel } from "@/components/viewer/DensePanel";
import { LayerRail } from "@/components/viewer/LayerRail";
import { InspectorRail } from "@/components/viewer/InspectorRail";
import { ReviewActionBar } from "@/components/viewer/ReviewActionBar";
import { DEFAULT_LAYERS, type Layers, type PanelKey } from "@/components/viewer/viewer-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runs/$runId/")({
  component: InspectPage,
});

function InspectPage() {
  const { runId } = useParams({ from: "/runs/$runId" });
  const { getRun, role, dispatch } = useAppStore();
  const run = getRun(runId)!;
  const [layers, setLayersState] = useState<Layers>(DEFAULT_LAYERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [maximized, setMaximized] = useState<PanelKey | null>(null);
  const setLayers = (fn: (l: Layers) => Layers) => setLayersState((l) => fn(l));

  const predictions = useMemo(
    () => run.detections.filter((d) => d.source === "prediction"),
    [run.detections],
  );
  const groundTruth = useMemo(
    () => run.detections.filter((d) => d.source === "ground_truth"),
    [run.detections],
  );
  const visible = useMemo(
    () => predictions.filter((d) => d.score >= run.confidenceThreshold),
    [predictions, run.confidenceThreshold],
  );
  const selected = run.detections.find((d) => d.objectId === selectedId);

  if (run.status === "FAILED") {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-2xl border border-error/50 bg-error/10 p-4">
          <h2 className="text-error">Inference did not complete</h2>
          <p className="mt-2 text-foreground">{run.failureReason}</p>
          <p className="mt-3 text-muted-foreground">
            Metrics unavailable — inference did not complete. No frame statistics, no evaluation
            report and no artifacts were written for this run.
          </p>
        </div>
      </div>
    );
  }

  const thresholdLock =
    role === "reviewer"
      ? "Reviewers cannot change the display threshold. Switch to Perception engineer."
      : run.status !== "GENERATED"
        ? `Threshold is locked once a run leaves GENERATED. This run is ${run.status}.`
        : null;

  const panels: { key: PanelKey; title: string; enabled: boolean; body: React.ReactNode }[] = [
    {
      key: "cameras",
      title: "Cameras — 6-tile ring, anonymized for display",
      enabled: layers.camerasPanel,
      body: (
        <CameraMosaic
          run={run}
          layers={layers}
          visiblePredictions={visible}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      ),
    },
    {
      key: "lidar",
      title: "LiDAR point cloud — top-down scatter",
      enabled: layers.lidar,
      body: <LidarPanel seed={run.sample.frameIndex} />,
    },
    {
      key: "bev",
      title: "BEV view — top-down representation",
      enabled: layers.bev,
      body: (
        <BevPanel
          predictions={visible}
          groundTruth={groundTruth}
          layers={layers}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      ),
    },
    {
      key: "dense",
      title: run.denseOutput
        ? run.denseOutput.kind === "occupancy"
          ? `Occupancy prediction — ${run.denseOutput.gridW} × ${run.denseOutput.gridH} cells, ${((run.denseOutput.rangeM * 2) / run.denseOutput.gridW).toFixed(2)} m, ±${run.denseOutput.rangeM} m`
          : `BEV segmentation — ${run.denseOutput.gridW} × ${run.denseOutput.gridH} cells, ±${run.denseOutput.rangeM} m`
        : `Dense output — ${run.model.taskHead === "occupancy" ? "occupancy prediction" : "BEV segmentation"}`,
      enabled: layers.dense,
      body: <DensePanel dense={run.denseOutput} />,
    },
  ];

  const shown = maximized ? panels.filter((p) => p.key === maximized) : panels.filter((p) => p.enabled);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[236px_minmax(0,1fr)_296px]">
        <aside className="border-hairline lg:border-r">
          <LayerRail
            run={run}
            layers={layers}
            setLayers={setLayers}
            threshold={run.confidenceThreshold}
            onThreshold={(v) => dispatch({ type: "set_threshold", runId: run.runId, value: v })}
            thresholdLock={thresholdLock}
            shown={visible.length}
            total={predictions.length}
          />
        </aside>

        <div className="min-w-0 p-3">
          <div className="mb-2 flex flex-wrap items-center gap-3 border border-hairline bg-panel px-3 py-1.5">
            <span className="panel-title">Sample token</span>
            <span className="mono-num text-[11px]">{run.sample.sampleToken}</span>
            <span className="mono-num text-[11px] text-muted-foreground">
              WebGPU unavailable in this prototype — 2D fallback active
            </span>
          </div>
          {shown.length === 0 ? (
            <EmptyState title="All viewport panels are hidden" hint="Enable a layer in the left rail." />
          ) : (
            <div className={cn("grid gap-2", maximized ? "grid-cols-1" : "xl:grid-cols-2")}>
              {shown.map((p) => (
                <Panel
                  key={p.key}
                  title={p.title}
                  className={maximized ? "h-[calc(100vh-14rem)]" : "h-[420px]"}
                  actions={
                    <button
                      onClick={() => setMaximized(maximized === p.key ? null : p.key)}
                      aria-label={maximized === p.key ? "Restore panel" : "Maximize panel"}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {maximized === p.key ? (
                        <Minimize2 className="size-3.5" />
                      ) : (
                        <Maximize2 className="size-3.5" />
                      )}
                    </button>
                  }
                >
                  {p.body}
                </Panel>
              ))}
            </div>
          )}
        </div>

        <aside className="border-hairline lg:border-l">
          <InspectorRail run={run} selected={selected} />
        </aside>
      </div>
      <ReviewActionBar run={run} />
    </div>
  );
}
