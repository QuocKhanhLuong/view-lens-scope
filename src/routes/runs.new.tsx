import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/Panel";
import { useAppStore, ACTORS } from "@/state/app-store";
import { SAMPLES } from "@/mocks/samples";
import { CHECKPOINTS, buildRun } from "@/mocks/runs";
import type { TaskHead } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runs/new")({
  head: () => ({
    meta: [
      { title: "New inference run — BEV Vision" },
      {
        name: "description",
        content:
          "Pick a nuScenes sample, choose a fusion checkpoint and task head, then run inference on one frame.",
      },
      { property: "og:title", content: "New inference run — BEV Vision" },
      {
        property: "og:description",
        content: "Three-step setup: sample, model configuration, confirmation.",
      },
    ],
  }),
  component: NewRunPage,
});

const STEPS = ["Sample", "Model", "Confirm"] as const;

function NewRunPage() {
  const navigate = useNavigate();
  const { role, runs, dispatch } = useAppStore();
  const [step, setStep] = useState(0);
  const [sampleIdx, setSampleIdx] = useState(0);
  const [checkpointId, setCheckpointId] = useState(CHECKPOINTS[0]!.id);
  const [taskHead, setTaskHead] = useState<TaskHead>("occupancy");
  const [precision, setPrecision] = useState<"fp32" | "fp16">("fp16");
  const [running, setRunning] = useState(false);

  const sample = SAMPLES[sampleIdx]!;
  const checkpoint = CHECKPOINTS.find((c) => c.id === checkpointId)!;

  if (role === "reviewer") {
    return (
      <div className="mx-auto max-w-xl p-8">
        <Panel title="Reviewers cannot start runs">
          <p className="text-muted-foreground">
            Starting inference is a Perception engineer action. Switch role in the top bar to create a
            run, or go back to the queue to review submitted work.
          </p>
          <Link to="/" className="mt-3 inline-block rounded-[4px] border border-hairline px-3 py-1.5">
            Back to runs
          </Link>
        </Panel>
      </div>
    );
  }

  const submit = () => {
    setRunning(true);
    window.setTimeout(() => {
      const run = buildRun({
        index: runs.length + 20,
        sampleIdx,
        checkpointId,
        taskHead,
        precision,
        status: "GENERATED",
        createdBy: ACTORS.engineer,
        createdAt: new Date().toISOString(),
      });
      dispatch({ type: "add_run", run });
      toast("Inference complete — run generated");
      navigate({ to: "/runs/$runId", params: { runId: run.runId } });
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-3 p-4">
      <nav className="flex items-center gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-[3px] border border-hairline px-2 py-1",
                i === step ? "bg-raised text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="mono-num text-[11px]">{i + 1}</span>
              {s}
              {i < step ? <Check className="size-3 text-gt" /> : null}
            </span>
            {i < STEPS.length - 1 ? <span className="text-muted-foreground">·</span> : null}
          </div>
        ))}
      </nav>

      {step === 0 ? (
        <Panel title="Step 1 — Select dataset sample">
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-panel">
                <tr className="border-b border-hairline">
                  {["", "Scene", "Frame", "Weather", "Time", "Sync skew", "Ground truth"].map((h) => (
                    <th key={h} className="panel-title py-1.5 pr-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SAMPLES.map((s, i) => (
                  <tr
                    key={s.sampleToken}
                    onClick={() => setSampleIdx(i)}
                    className={cn(
                      "cursor-pointer border-b border-hairline hover:bg-raised",
                      i === sampleIdx && "bg-raised",
                    )}
                  >
                    <td className="py-1.5 pr-3">
                      <input
                        type="radio"
                        checked={i === sampleIdx}
                        onChange={() => setSampleIdx(i)}
                        aria-label={`Select ${s.sceneName} frame ${s.frameIndex}`}
                      />
                    </td>
                    <td className="py-1.5 pr-3">{s.sceneName}</td>
                    <td className="mono-num py-1.5 pr-3">{s.frameIndex}</td>
                    <td className="py-1.5 pr-3">{s.weather}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{s.privacyStatus}</td>
                    <td
                      className={cn(
                        "mono-num py-1.5 pr-3",
                        s.maxSyncSkewMs > 50 ? "text-warning" : "text-muted-foreground",
                      )}
                    >
                      {s.maxSyncSkewMs} ms
                    </td>
                    <td className="py-1.5 pr-3 text-muted-foreground">
                      {s.hasGroundTruth ? "available" : "not annotated"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      ) : null}

      {step === 1 ? (
        <Panel title="Step 2 — Model configuration">
          <div className="space-y-4">
            <div>
              <h3 className="panel-title">Checkpoint</h3>
              <div className="mt-1.5 space-y-1.5">
                {CHECKPOINTS.map((c) => (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 border border-hairline p-2",
                      c.id === checkpointId && "bg-raised",
                    )}
                  >
                    <input
                      type="radio"
                      name="ckpt"
                      checked={c.id === checkpointId}
                      onChange={() => setCheckpointId(c.id)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="mono-num text-[12px]">{c.label}</span>
                      <span className="block text-muted-foreground">{c.note}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="panel-title">Task head</h3>
                <div className="mt-1.5 space-y-1.5">
                  {(
                    [
                      ["occupancy", "Occupancy prediction — dense voxel occupancy raster"],
                      ["bev_segmentation", "BEV segmentation — per-cell class raster"],
                    ] as const
                  ).map(([v, label]) => (
                    <label key={v} className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="head"
                        checked={taskHead === v}
                        onChange={() => setTaskHead(v)}
                        className="mt-0.5"
                      />
                      <span className="text-muted-foreground">{label}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  3D detection always runs. The task head selects the dense artifact produced
                  alongside it.
                </p>
              </div>
              <div>
                <h3 className="panel-title">Precision</h3>
                <div className="mt-1.5 space-y-1.5">
                  {(["fp16", "fp32"] as const).map((p) => (
                    <label key={p} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="prec"
                        checked={precision === p}
                        onChange={() => setPrecision(p)}
                      />
                      <span className="mono-num text-[12px]">{p}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  fp16 roughly halves latency and VRAM; fp32 is the reference numeric baseline.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      {step === 2 ? (
        <Panel title="Step 3 — Confirm">
          <dl className="grid gap-x-8 sm:grid-cols-2">
            {[
              ["Scene", sample.sceneName],
              ["Frame", String(sample.frameIndex)],
              ["Sample token", sample.sampleToken],
              ["Conditions", sample.weather],
              ["Checkpoint", checkpoint.label],
              ["Sensors", "camera + LiDAR"],
              ["Task head", taskHead === "occupancy" ? "occupancy" : "bev_segmentation"],
              ["Precision", precision],
              ["Ground truth", sample.hasGroundTruth ? "available" : "not annotated"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-hairline py-1">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="mono-num text-right text-[12px]">{v}</dd>
              </div>
            ))}
          </dl>

          {!sample.hasGroundTruth ? (
            <p className="mt-3 flex items-center gap-2 border border-warning/50 bg-warning/10 p-2 text-warning">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              This sample has no annotations. Detection quality metrics will be unavailable for the
              frame.
            </p>
          ) : null}
          {sample.maxSyncSkewMs > 50 ? (
            <p className="mt-2 flex items-center gap-2 border border-warning/50 bg-warning/10 p-2 text-warning">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              Sensor timestamps disagree by {sample.maxSyncSkewMs} ms — fusion output may be
              misaligned.
            </p>
          ) : null}
        </Panel>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-8 text-[12px]"
          disabled={step === 0 || running}
          onClick={() => setStep((s) => s - 1)}
        >
          Back
        </Button>
        {step < 2 ? (
          <Button
            className="h-8 rounded-[4px] bg-fusion text-[12px] text-primary-foreground hover:bg-fusion/90"
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            disabled={running}
            onClick={submit}
            className="h-8 rounded-[4px] bg-fusion text-[12px] text-primary-foreground hover:bg-fusion/90"
          >
            {running ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Running inference…
              </>
            ) : (
              "Run inference"
            )}
          </Button>
        )}
        <Link to="/" className="ml-auto text-muted-foreground hover:text-foreground">
          Cancel
        </Link>
      </div>
    </div>
  );
}
