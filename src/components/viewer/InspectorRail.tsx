import { Metric, ScopeBadge } from "@/components/Metric";
import { EmptyState } from "@/components/Panel";
import type { Detection, Run } from "@/types";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hairline py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="mono-num text-[12px]">{value}</span>
    </div>
  );
}

export function InspectorRail({
  run,
  selected,
}: {
  run: Run;
  selected: Detection | undefined;
}) {
  return (
    <div className="flex h-full flex-col overflow-auto">
      <section className="border-b border-hairline p-3">
        <h3 className="panel-title mb-2">Object inspector</h3>
        {selected ? (
          <div>
            <Row label="Object ID" value={selected.objectId} />
            <Row label="Class" value={selected.class} />
            <Row
              label="Source"
              value={selected.source === "prediction" ? "prediction (filled)" : "ground truth (outlined)"}
            />
            <Row label="Score" value={selected.score.toFixed(3)} />
            <Row
              label="Position x/y/z"
              value={`${selected.center.x} / ${selected.center.y} / ${selected.center.z} m`}
            />
            <Row
              label="Size l/w/h"
              value={`${selected.size.l} / ${selected.size.w} / ${selected.size.h} m`}
            />
            <Row label="Yaw" value={`${selected.yaw.toFixed(3)} rad`} />
            <Row label="Distance" value={`${selected.distanceM} m`} />
            {selected.iou !== undefined ? <Row label="IoU vs matched GT" value={selected.iou.toFixed(2)} /> : null}
            <Row label="Visible in" value={selected.visibleIn.join(", ")} />
          </div>
        ) : (
          <EmptyState
            title="No object selected"
            hint="Click a box in BEV or a camera tile. Arrow keys move between BEV boxes."
          />
        )}
      </section>

      <section className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="panel-title">Frame statistics</h3>
          <ScopeBadge scope="frame" />
        </div>
        <Metric label="Object count" value={run.frameStats.objectCount} scope="frame" />
        <Metric label="Ground-truth count" value={run.frameStats.gtObjectCount} scope="frame" />
        <Metric label="Mean confidence" value={run.frameStats.meanConfidence.toFixed(3)} scope="frame" />
        <Metric label="Preprocess" value={run.runtime.timings.preprocessMs} unit="ms" scope="frame" />
        <Metric label="Inference" value={run.runtime.timings.inferenceMs} unit="ms" scope="frame" />
        <Metric label="Postprocess" value={run.runtime.timings.postprocessMs} unit="ms" scope="frame" />
        <Metric label="End-to-end" value={run.runtime.timings.endToEndMs} unit="ms" scope="frame" />
        <Metric
          label="Model inference FPS"
          value={run.runtime.inferenceFps}
          unit="fps"
          scope="frame"
          protocolNote="Model throughput on the GPU, single sample, batch size 1."
        />
        <Metric
          label="Frontend render FPS"
          value={60.0}
          unit="fps"
          scope="frame"
          protocolNote="Browser paint rate of this viewer. Unrelated to model throughput."
        />
        <p className="mt-2 text-[11px] text-muted-foreground">
          Frame-level statistics. Not dataset-level mAP/NDS/IoU — see Evaluation.
        </p>
      </section>
    </div>
  );
}
