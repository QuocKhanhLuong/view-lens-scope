import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { CAMERAS, type Run } from "@/types";
import type { Layers } from "./viewer-types";

interface Props {
  run: Run;
  layers: Layers;
  setLayers: (updater: (l: Layers) => Layers) => void;
  threshold: number;
  onThreshold: (v: number) => void;
  thresholdLock: string | null;
  shown: number;
  total: number;
}

function Toggle({
  id,
  label,
  checked,
  onChange,
  tone,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  tone?: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 py-1">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
        className="size-3.5 rounded-[2px] border-hairline"
      />
      <span className={tone ?? "text-foreground"}>{label}</span>
    </label>
  );
}

export function LayerRail({
  run,
  layers,
  setLayers,
  threshold,
  onThreshold,
  thresholdLock,
  shown,
  total,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-3">
      <section>
        <h3 className="panel-title mb-1">Layers</h3>
        <Toggle
          id="l-cams"
          label="Cameras"
          tone="text-camera"
          checked={layers.camerasPanel}
          onChange={(v) => setLayers((l) => ({ ...l, camerasPanel: v }))}
        />
        <div className="ml-5 border-l border-hairline pl-2">
          {CAMERAS.map((c) => (
            <Toggle
              key={c}
              id={`l-${c}`}
              label={c}
              tone="text-muted-foreground mono-num text-[11px]"
              checked={layers.cameras[c]}
              onChange={(v) =>
                setLayers((l) => ({ ...l, cameras: { ...l.cameras, [c]: v } }))
              }
            />
          ))}
        </div>
        <Toggle
          id="l-lidar"
          label="LiDAR point cloud"
          tone="text-lidar"
          checked={layers.lidar}
          onChange={(v) => setLayers((l) => ({ ...l, lidar: v }))}
        />
        <Toggle
          id="l-bev"
          label="BEV view"
          checked={layers.bev}
          onChange={(v) => setLayers((l) => ({ ...l, bev: v }))}
        />
        <Toggle
          id="l-dense"
          label={
            run.model.taskHead === "occupancy"
              ? "Dense output — occupancy"
              : "Dense output — BEV segmentation"
          }
          checked={layers.dense}
          onChange={(v) => setLayers((l) => ({ ...l, dense: v }))}
        />
      </section>

      <section>
        <h3 className="panel-title mb-1">Annotations</h3>
        <Toggle
          id="l-gt"
          label="Ground truth (outlined)"
          tone="text-gt"
          checked={layers.groundTruth}
          onChange={(v) => setLayers((l) => ({ ...l, groundTruth: v }))}
        />
        <Toggle
          id="l-pred"
          label="Predictions (filled)"
          tone="text-fusion"
          checked={layers.predictions}
          onChange={(v) => setLayers((l) => ({ ...l, predictions: v }))}
        />
      </section>

      <section>
        <h3 className="panel-title mb-2">Confidence threshold</h3>
        <div className="flex items-center gap-2">
          <Slider
            value={[threshold]}
            min={0}
            max={1}
            step={0.01}
            disabled={Boolean(thresholdLock)}
            onValueChange={(v) => onThreshold(v[0] ?? threshold)}
            aria-label="Confidence threshold"
            className="flex-1"
          />
          <span className="mono-num w-10 text-right text-[12px]">{threshold.toFixed(2)}</span>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Display filter only. Does not modify the stored prediction artifact.
        </p>
        <p className="mono-num mt-1 text-[11px]">
          Showing {shown} of {total} predictions
        </p>
        {thresholdLock ? (
          <p className="mt-1 text-[11px] text-warning">{thresholdLock}</p>
        ) : null}
      </section>
    </div>
  );
}
