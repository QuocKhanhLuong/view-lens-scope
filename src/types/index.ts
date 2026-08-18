export type Role = "engineer" | "reviewer";
export type TaskHead = "occupancy" | "bev_segmentation";
export type RunStatus =
  | "QUEUED"
  | "RUNNING"
  | "GENERATED"
  | "IN_REVIEW"
  | "REVIEWED"
  | "FLAGGED"
  | "FAILED";
export type CameraName =
  | "CAM_FRONT"
  | "CAM_FRONT_LEFT"
  | "CAM_FRONT_RIGHT"
  | "CAM_BACK"
  | "CAM_BACK_LEFT"
  | "CAM_BACK_RIGHT";

export const CAMERAS: CameraName[] = [
  "CAM_FRONT_LEFT",
  "CAM_FRONT",
  "CAM_FRONT_RIGHT",
  "CAM_BACK_LEFT",
  "CAM_BACK",
  "CAM_BACK_RIGHT",
];

export interface Sample {
  sampleToken: string;
  sceneName: string;
  sceneDescription: string;
  frameIndex: number;
  timestampUs: number;
  sensorTimestamps: Record<CameraName | "LIDAR_TOP", number>;
  maxSyncSkewMs: number;
  calibrationVersion: string;
  hasGroundTruth: boolean;
  privacyStatus: "anonymized" | "pending" | "not_processed";
  weather: "clear" | "rain" | "night";
}

export interface ModelConfig {
  modelId: "bevfusion";
  modelLabel: string;
  checkpointId: string;
  checkpointLabel: string;
  sensors: "camera+lidar" | "camera" | "lidar";
  taskHead: TaskHead;
  precision: "fp32" | "fp16";
  configVersion: string;
}

export type DetectionClass =
  | "car"
  | "truck"
  | "bus"
  | "trailer"
  | "construction_vehicle"
  | "pedestrian"
  | "motorcycle"
  | "bicycle"
  | "traffic_cone"
  | "barrier";

export interface Detection {
  objectId: string;
  class: DetectionClass;
  score: number;
  source: "prediction" | "ground_truth";
  center: { x: number; y: number; z: number };
  size: { l: number; w: number; h: number };
  yaw: number;
  distanceM: number;
  iou?: number | undefined;
  visibleIn: CameraName[];
  bbox2d?: Partial<Record<CameraName, { x: number; y: number; w: number; h: number }>> | undefined;
}

export interface Timings {
  preprocessMs: number;
  inferenceMs: number;
  postprocessMs: number;
  endToEndMs: number;
}

export interface RuntimeReport {
  timings: Timings;
  inferenceFps: number;
  peakVramGb: number;
  gpuUtilPct: number;
  gpuModel: string;
  driver: string;
  batchSize: number;
  precision: "fp32" | "fp16";
  warmupFrames: number;
  includesHostTransfer: boolean;
}

export interface ReviewEvent {
  at: string;
  actorRole: Role;
  actorName: string;
  from: RunStatus;
  to: RunStatus;
  comment?: string | undefined;
}

export interface DenseOutput {
  kind: TaskHead;
  gridW: number;
  gridH: number;
  rangeM: number;
  cells: number[];
  classes: string[];
}

export interface Run {
  runId: string;
  createdAt: string;
  createdBy: string;
  sample: Sample;
  model: ModelConfig;
  status: RunStatus;
  confidenceThreshold: number;
  detections: Detection[];
  denseOutput: DenseOutput | null;
  runtime: RuntimeReport;
  frameStats: { objectCount: number; meanConfidence: number; gtObjectCount: number };
  reviewHistory: ReviewEvent[];
  syncOk: boolean;
  failureReason?: string | undefined;
}

export interface EvaluationReport {
  evalId: string;
  subsetName: string;
  frameCount: number;
  protocol: string;
  threshold: number;
  detection: {
    mAP: number;
    nds: number;
    precision: number;
    recall: number;
    tp: number;
    fp: number;
    fn: number;
    perClass: { cls: string; ap: number }[];
  };
  dense: { kind: TaskHead; mIoU: number; perClass: { cls: string; iou: number }[] } | null;
  runtime: {
    p50Ms: number;
    p95Ms: number;
    inferenceFps: number;
    peakVramGb: number;
    gpuHoursPer1000Frames: number;
    costAssumption: string;
  };
  hardware: { gpuModel: string; driver: string; precision: string; batchSize: number };
}

export type MetricScope = "frame" | "eval-subset" | "target" | "mock";
