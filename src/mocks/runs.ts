import type { EvaluationReport, ModelConfig, Run, RunStatus, TaskHead } from "@/types";
import { SAMPLES, rng } from "./samples";
import { OCCUPANCY_CLASSES, SEGMENTATION_CLASSES, buildDenseCells, buildDetections } from "./detections";

export const CHECKPOINTS = [
  {
    id: "bevfusion-r50-pretrained",
    label: "bevfusion-r50-pretrained",
    note: "Public nuScenes weights, no domain fine-tuning",
  },
  {
    id: "bevfusion-r50-ft-rain-v3",
    label: "bevfusion-r50-ft-rain-v3",
    note: "Fine-tuned on rain/night subset, internal",
  },
];

export function makeModel(
  checkpointId: string,
  taskHead: TaskHead,
  precision: "fp32" | "fp16" = "fp16",
  sensors: ModelConfig["sensors"] = "camera+lidar",
): ModelConfig {
  return {
    modelId: "bevfusion",
    modelLabel: "BEVFusion",
    checkpointId,
    checkpointLabel: checkpointId,
    sensors,
    taskHead,
    precision,
    configVersion: "cfg-2026.07-r4",
  };
}

export function makeRuntime(seed: number, precision: "fp32" | "fp16") {
  const r = rng(seed * 31 + 5);
  const inference = Number((precision === "fp16" ? 58 + r() * 22 : 96 + r() * 30).toFixed(1));
  const pre = Number((14 + r() * 8).toFixed(1));
  const post = Number((9 + r() * 6).toFixed(1));
  return {
    timings: {
      preprocessMs: pre,
      inferenceMs: inference,
      postprocessMs: post,
      endToEndMs: Number((pre + inference + post).toFixed(1)),
    },
    inferenceFps: Number((1000 / inference).toFixed(1)),
    peakVramGb: Number((precision === "fp16" ? 6.1 + r() : 9.4 + r()).toFixed(1)),
    gpuUtilPct: Math.round(72 + r() * 22),
    gpuModel: "NVIDIA RTX A5000 (24 GB)",
    driver: "550.90.07 / CUDA 12.4",
    batchSize: 1,
    precision,
    warmupFrames: 5,
    includesHostTransfer: true,
  };
}

export function buildRun(opts: {
  index: number;
  sampleIdx: number;
  checkpointId: string;
  taskHead: TaskHead;
  status: RunStatus;
  precision?: "fp32" | "fp16";
  createdBy?: string;
  createdAt?: string;
  hasDense?: boolean;
  reviewer?: { name: string; comment?: string };
  failureReason?: string;
}): Run {
  const sample = SAMPLES[opts.sampleIdx]!;
  const precision = opts.precision ?? "fp16";
  const seed = opts.index + 3;
  const failed = opts.status === "FAILED";
  const detections = failed ? [] : buildDetections(seed, sample.hasGroundTruth);
  const preds = detections.filter((d) => d.source === "prediction");
  const gridW = opts.taskHead === "occupancy" ? 200 : 128;
  const dense =
    failed || opts.hasDense === false
      ? null
      : {
          kind: opts.taskHead,
          gridW,
          gridH: gridW,
          rangeM: 50,
          cells: buildDenseCells(seed, opts.taskHead, gridW, gridW),
          classes: opts.taskHead === "occupancy" ? OCCUPANCY_CLASSES : SEGMENTATION_CLASSES,
        };
  const createdAt = opts.createdAt ?? `2026-08-1${(opts.index % 5) + 1}T0${(opts.index % 8) + 1}:24:10Z`;
  const history: Run["reviewHistory"] = [];
  if (["IN_REVIEW", "REVIEWED", "FLAGGED"].includes(opts.status)) {
    history.push({
      at: createdAt.replace("T0", "T1"),
      actorRole: "engineer",
      actorName: opts.createdBy ?? "k.luong",
      from: "GENERATED",
      to: "IN_REVIEW",
      comment: "Submitted after threshold sweep at 0.35.",
    });
  }
  if (opts.status === "REVIEWED" || opts.status === "FLAGGED") {
    history.push({
      at: createdAt.replace("T0", "T1").replace(":24", ":51"),
      actorRole: "reviewer",
      actorName: opts.reviewer?.name ?? "s.tran",
      from: "IN_REVIEW",
      to: opts.status,
      comment: opts.reviewer?.comment,
    });
  }
  return {
    runId: `run-2026-08-1${(opts.index % 5) + 1}-${String(opts.index).padStart(3, "0")}`,
    createdAt,
    createdBy: opts.createdBy ?? "k.luong",
    sample,
    model: makeModel(opts.checkpointId, opts.taskHead, precision),
    status: opts.status,
    confidenceThreshold: 0.35,
    detections,
    denseOutput: dense,
    runtime: makeRuntime(seed, precision),
    frameStats: {
      objectCount: preds.length,
      meanConfidence: preds.length
        ? Number((preds.reduce((a, d) => a + d.score, 0) / preds.length).toFixed(3))
        : 0,
      gtObjectCount: detections.filter((d) => d.source === "ground_truth").length,
    },
    reviewHistory: history,
    syncOk: sample.maxSyncSkewMs <= 50,
    failureReason: opts.failureReason,
  };
}

export const INITIAL_RUNS: Run[] = [
  buildRun({ index: 1, sampleIdx: 0, checkpointId: CHECKPOINTS[0]!.id, taskHead: "occupancy", status: "GENERATED" }),
  buildRun({ index: 2, sampleIdx: 6, checkpointId: CHECKPOINTS[1]!.id, taskHead: "occupancy", status: "GENERATED" }),
  buildRun({ index: 3, sampleIdx: 5, checkpointId: CHECKPOINTS[1]!.id, taskHead: "bev_segmentation", status: "IN_REVIEW" }),
  buildRun({
    index: 4,
    sampleIdx: 1,
    checkpointId: CHECKPOINTS[0]!.id,
    taskHead: "bev_segmentation",
    status: "REVIEWED",
    reviewer: { name: "s.tran", comment: "Boxes agree with GT within tolerance. Accepted." },
  }),
  buildRun({
    index: 5,
    sampleIdx: 9,
    checkpointId: CHECKPOINTS[1]!.id,
    taskHead: "occupancy",
    precision: "fp32",
    status: "FLAGGED",
    reviewer: { name: "s.tran", comment: "Two pedestrians at 34 m missed in the night sample. Needs rerun." },
  }),
  buildRun({ index: 6, sampleIdx: 3, checkpointId: CHECKPOINTS[0]!.id, taskHead: "occupancy", status: "GENERATED", hasDense: false }),
  buildRun({
    index: 7,
    sampleIdx: 4,
    checkpointId: CHECKPOINTS[1]!.id,
    taskHead: "occupancy",
    precision: "fp16",
    status: "FAILED",
    failureReason:
      "Inference failed at postprocess. Rerun with fp32 or check the checkpoint reference.",
  }),
];

function evalFor(checkpointId: string, boost: number, kind: TaskHead): EvaluationReport {
  const b = boost;
  return {
    evalId: `eval-${checkpointId}`,
    subsetName: "nuScenes mini-val (81 samples)",
    frameCount: 81,
    protocol:
      "Centre-distance matching (0.5/1.0/2.0/4.0 m), ego coordinate frame, 10 nuScenes detection classes",
    threshold: 0.35,
    detection: {
      mAP: Number((0.541 + b).toFixed(3)),
      nds: Number((0.622 + b).toFixed(3)),
      precision: Number((0.712 + b).toFixed(3)),
      recall: Number((0.668 + b).toFixed(3)),
      tp: 1482 + Math.round(b * 1000),
      fp: 601 - Math.round(b * 800),
      fn: 736 - Math.round(b * 700),
      perClass: [
        { cls: "car", ap: Number((0.812 + b).toFixed(3)) },
        { cls: "truck", ap: Number((0.552 + b).toFixed(3)) },
        { cls: "bus", ap: Number((0.641 + b).toFixed(3)) },
        { cls: "trailer", ap: Number((0.341 + b).toFixed(3)) },
        { cls: "construction_vehicle", ap: Number((0.191 + b).toFixed(3)) },
        { cls: "pedestrian", ap: Number((0.702 + b).toFixed(3)) },
        { cls: "motorcycle", ap: Number((0.584 + b).toFixed(3)) },
        { cls: "bicycle", ap: Number((0.412 + b).toFixed(3)) },
        { cls: "traffic_cone", ap: Number((0.631 + b).toFixed(3)) },
        { cls: "barrier", ap: Number((0.598 + b).toFixed(3)) },
      ],
    },
    dense: {
      kind,
      mIoU: Number((0.482 + b).toFixed(3)),
      perClass: (kind === "occupancy" ? OCCUPANCY_CLASSES : SEGMENTATION_CLASSES).map((cls, i) => ({
        cls,
        iou: Number((0.38 + b + i * 0.045).toFixed(3)),
      })),
    },
    runtime: {
      p50Ms: 91.4,
      p95Ms: 128.7,
      inferenceFps: 11.6,
      peakVramGb: 6.8,
      gpuHoursPer1000Frames: 0.031,
      costAssumption: "Single RTX A5000, batch size 1, fp16, host transfer included",
    },
    hardware: {
      gpuModel: "NVIDIA RTX A5000 (24 GB)",
      driver: "550.90.07 / CUDA 12.4",
      precision: "fp16",
      batchSize: 1,
    },
  };
}

export const EVALUATIONS: Record<string, EvaluationReport> = {
  [CHECKPOINTS[0]!.id]: evalFor(CHECKPOINTS[0]!.id, 0, "occupancy"),
  [CHECKPOINTS[1]!.id]: evalFor(CHECKPOINTS[1]!.id, 0.043, "bev_segmentation"),
};
