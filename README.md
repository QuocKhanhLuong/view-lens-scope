# BEV Vision Sandbox

Lovable prompt — BEV Vision UI

Copy toàn bộ nội dung dưới dòng kẻ vào Lovable làm prompt đầu tiên.

Build a complete, production-quality frontend prototype for BEV Vision — a camera–LiDAR sensor-fusion perception sandbox. It is an internal engineering tool used by autonomous-driving perception teams to run a fusion model on one dataset sample, inspect the output across synchronized views, read its metrics, and send it through a two-person review loop.

This is a UI prototype with mock data only. Do not attempt real ML inference, real point-cloud streaming, WebGPU, or Rerun integration. Every number, image and prediction is fixture data defined in src/mocks/. Where a real GPU/Rerun viewer would mount, render a convincing mock canvas and label it honestly.

1. Stack and non-goals

React + TypeScript + Vite + Tailwind + shadcn/ui + react-router + lucide-react.

State: React Context + useReducer for run store, viewer store, and current role. No backend, no auth, no database. Persist nothing.

Charts: Recharts. 2D rendering (BEV plane, occupancy grid, box overlays): inline <svg> or <canvas> you draw yourself.

Do not build: login/signup, multi-run side-by-side comparison, sequence/timeline playback, failure-case clustering, dataset upload, model training, export/audit-trail workflow. These are explicitly out of scope. Do not add placeholder nav entries for them either, except one disabled "Compare runs" item with an Advanced badge and a tooltip reading Advanced scope — not in this build.

2. Roles

No authentication. A role switcher in the top bar toggles between Perception Engineer and Safety Reviewer. The whole UI must react to it — this is a core demo mechanic, not decoration.

Action Engineer Reviewer Browse dataset / scene / sample full read-only Pick model, checkpoint, task head, precision yes no Run inference yes no Change confidence threshold on a GENERATED run yes no (control is disabled with a reason) Toggle layers, inspect views, read metrics yes yes Submit run for review yes no Mark REVIEWED / FLAGGED + optional comment no yes

When a control is unavailable for the current role, render it disabled with a short inline reason, never hidden. Reviewers must be able to see that the engineer's controls exist and are locked — that visible lock is the product's safety story.

3. Domain vocabulary — enforce these distinctions in the UI

These separations are the reason the product exists. Getting them wrong is a failed build.

BEV view = a top-down feature/map representation. It is a view orientation, not a prediction.

3D object detection = predicted 3D boxes with class, score, pose, size.

BEV segmentation = dense class labels on the bird's-eye plane.

Occupancy prediction = occupied / free / unknown cells.

A top-down point cloud must never be labeled occupancy or segmentation. The dense-output panel shows a No dense output — this run has no occupancy/segmentation artifact empty state rather than falling back to the point cloud.

A run has exactly one dense task head: Occupancy Prediction or BEV Segmentation. Never both. The selector is a radio group, not checkboxes.

Frame-level statistics (this sample's latency, object count, mean confidence) and dataset-level evaluation metrics (mAP, NDS, IoU, mIoU, aggregate latency) live on different screens and carry different badges: Frame (blue-grey) and Eval subset (amber). A single-frame number may never be shown with an mAP/NDS/IoU label.

Model inference FPS and frontend render FPS are two separate rows, each with its own label, in every place both appear.

Every metric value renders through a shared <Metric> component taking { label, value, unit, scope: 'frame' | 'eval-subset' | 'target' | 'mock', protocolNote? }. The scope badge is always visible. In this prototype every value additionally carries a subtle MOCK marker in its tooltip.

4. Data model

Define in src/types/:

type Role = 'engineer' | 'reviewer';
type TaskHead = 'occupancy' | 'bev_segmentation';
type RunStatus = 'QUEUED' | 'RUNNING' | 'GENERATED' | 'IN_REVIEW' | 'REVIEWED' | 'FLAGGED' | 'FAILED';
type CameraName = 'CAM_FRONT' | 'CAM_FRONT_LEFT' | 'CAM_FRONT_RIGHT' | 'CAM_BACK' | 'CAM_BACK_LEFT' | 'CAM_BACK_RIGHT';

interface Sample {
  sampleToken: string;          // e.g. 'e93e98b63d3b40209056d129dc53ceee'
  sceneName: string;            // e.g. 'scene-0061'
  sceneDescription: string;
  frameIndex: number;
  timestampUs: number;
  sensorTimestamps: Record<CameraName | 'LIDAR_TOP', number>;
  maxSyncSkewMs: number;        // derived; > 50 triggers a sync warning
  calibrationVersion: string;
  hasGroundTruth: boolean;
  privacyStatus: 'anonymized' | 'pending' | 'not_processed';
  weather: 'clear' | 'rain' | 'night';
}

interface ModelConfig {
  modelId: 'bevfusion';
  modelLabel: string;
  checkpointId: string;         // pretrained + one fine-tuned option
  checkpointLabel: string;
  sensors: 'camera+lidar' | 'camera' | 'lidar';
  taskHead: TaskHead;
  precision: 'fp32' | 'fp16';
  configVersion: string;
}

interface Detection {
  objectId: string;
  class: 'car' | 'truck' | 'bus' | 'trailer' | 'construction_vehicle' | 'pedestrian' | 'motorcycle' | 'bicycle' | 'traffic_cone' | 'barrier';
  score: number;
  source: 'prediction' | 'ground_truth';
  center: { x: number; y: number; z: number };   // ego frame, metres
  size: { l: number; w: number; h: number };
  yaw: number;
  distanceM: number;
  iou?: number;
  visibleIn: CameraName[];
  bbox2d?: Partial<Record<CameraName, { x: number; y: number; w: number; h: number }>>;
}

interface Timings { preprocessMs, inferenceMs, postprocessMs, endToEndMs: number; }
interface RuntimeReport {
  timings: Timings;
  inferenceFps: number;
  peakVramGb: number;
  gpuUtilPct: number;
  gpuModel: string;
  driver: string;
  batchSize: number;
  precision: 'fp32' | 'fp16';
  warmupFrames: number;
  includesHostTransfer: boolean;
}
interface ReviewEvent { at: string; actorRole: Role; actorName: string; from: RunStatus; to: RunStatus; comment?: string; }

interface Run {
  runId: string;                // 'run-2026-08-14-003'
  createdAt: string;
  createdBy: string;
  sample: Sample;
  model: ModelConfig;
  status: RunStatus;
  confidenceThreshold: number;  // display filter, default 0.35
  detections: Detection[];
  denseOutput: { kind: TaskHead; gridW: number; gridH: number; rangeM: number; cells: number[]; classes: string[] } | null;
  runtime: RuntimeReport;
  frameStats: { objectCount: number; meanConfidence: number; gtObjectCount: number };
  reviewHistory: ReviewEvent[];
  syncOk: boolean;
  failureReason?: string;
}

interface EvaluationReport {
  evalId: string;
  subsetName: string;           // 'nuScenes mini-val (81 samples)'
  frameCount: number;
  protocol: string;             // matching protocol, coordinate frame, class set
  threshold: number;
  detection: { mAP: number; nds: number; precision: number; recall: number; tp: number; fp: number; fn: number; perClass: {cls: string; ap: number}[] };
  dense: { kind: TaskHead; mIoU: number; perClass: {cls: string; iou: number}[] } | null;
  runtime: { p50Ms: number; p95Ms: number; inferenceFps: number; peakVramGb: number; gpuHoursPer1000Frames: number; costAssumption: string };
  hardware: { gpuModel: string; driver: string; precision: string; batchSize: number };
}


Seed src/mocks/ with: 3 scenes × 4 samples each (one scene at night, one in rain, one sample deliberately carrying a 180 ms sensor skew so the sync warning is demonstrable), 2 checkpoints (bevfusion-r50-pretrained, bevfusion-r50-ft-rain-v3), 7 runs spread across GENERATED, IN_REVIEW, REVIEWED, FLAGGED and one FAILED, 1 evaluation report per checkpoint. Detections: 15–30 per sample with matching ground-truth boxes, plausible ego-frame coordinates within ±50 m.

5. Screens

/ — Runs

The home surface. A dense table of runs: run ID, scene + sample, checkpoint, task head, status pill, created, end-to-end latency, object count, reviewer. Filter chips by status; a search field on run ID / scene. Primary action New run (engineer only). For a reviewer, a segmented control at the top flips the same table between All runs and Awaiting review — the review queue is a filtered view of this table, not a separate page. Empty state: No runs yet. Start one from a nuScenes sample. with the primary action inline.

/runs/new — New run (engineer only; reviewer sees a locked-state explainer)

A three-step flow on one scrolling page with a sticky summary rail on the right, not a wizard with hidden steps.

Sample — scene picker, then a strip of sample cards (thumbnail placeholder, frame index, timestamp, weather icon, GT-available badge, privacy badge). On selection, a metadata table appears: sample token, ego timestamp, per-sensor timestamps with skew in ms, calibration version, ground-truth availability. If max skew > 50 ms, show an inline warning row — allow the run but surface it.

Model — model (BEVFusion, only option, shown as a disabled-looking select with 1 adapter registered), checkpoint select, sensor combination, dense task head as a radio group with a one-line definition under each option, precision toggle. A note that these become immutable once the run is created.

Run — the summary rail shows everything selected; Run inference button. On click, transition to a running state: an inline progress list stepping through Loading sample → Preprocess → Inference → Postprocess → Writing artifacts, ~4 s total, then navigate to /runs/:id.

Validation: a sample missing ground truth or calibration cannot be submitted; the button is disabled with the specific reason next to it.

/runs/:id — Inspect

The centrepiece. Three-region layout: left rail (layers + threshold), centre viewport, right rail (object inspector + frame stats).

Centre viewport — a resizable 2×2 grid with a maximize control on each panel:

Cameras — a 6-tile mosaic in nuScenes ring order (front-left / front / front-right on top, back-left / back / back-right below). Each tile is a mock image: a flat gradient plate with drawn road geometry, plus SVG 2D boxes overlaid for detections visible in that camera. Each tile carries the camera name and a small shield icon meaning Anonymized for display. Hovering the shield explains that the browser only ever receives the privacy-processed artifact.

LiDAR point cloud — a canvas rendering ~4000 mock points as a top-down scatter with intensity-mapped brightness, plus a small caption: Mock render. Production mounts the Rerun/WebGPU viewer here.

BEV view — the interactive one. Draw on <svg>: an ego-vehicle marker at origin, range rings at 10/20/30/40 m with labels, ground-truth boxes as hollow outlines, predicted boxes as filled-at-low-opacity with a heading tick. Boxes are clickable, hoverable, and keyboard-focusable.

Dense output — an occupancy grid or BEV-segmentation raster on canvas, with a class legend beneath it. The panel header states the exact task head, e.g. Occupancy prediction — 200 × 200 cells, 0.5 m, ±50 m. If denseOutput is null, show the empty state described in §3.

All four panels display the same sampleToken in a shared header strip. If syncOk is false, that strip becomes a full-width warning band: Sensor timestamps disagree by 180 ms. Views may not describe the same instant. — never silently hidden.

Left rail — layer tree with checkboxes: Cameras (per-camera), LiDAR, BEV, Dense output, and independently Ground truth and Predictions. A confidence threshold slider (0–1, step 0.01) that live-filters displayed predictions, with the text Display filter only. Does not modify the stored prediction artifact. and a live count Showing 14 of 23 predictions. Slider is disabled for reviewers and for any run past GENERATED, each with its reason.

Right rail — object inspector: when a box is selected anywhere, show object ID, class, score, source, position, size, yaw, distance, IoU when present; and highlight that same objectId in the camera tiles and BEV simultaneously. Cross-view highlight is a required behaviour. Below it, a Frame statistics card — object count, GT count, mean confidence, and the four timings — every row badged Frame, with a footnote: Frame-level statistics. Not dataset-level mAP/NDS/IoU — see Evaluation.

Bottom action bar — run status pill, created-by, and role-dependent action: engineer sees Submit for review on a GENERATED run; reviewer sees Mark reviewed and Flag plus an optional comment field. Both reviewer actions open a small confirm dialog restating the run ID and configuration. After a decision, the bar collapses into a read-only record of who decided what and when.

/runs/:id/evaluation — Evaluation (tab alongside Inspect)

Dataset-level only. A protocol header block first, before any number: subset name, frame count, matching protocol, coordinate frame, class set, threshold, GPU model, driver, precision, batch size, warm-up policy, whether timings include host transfer. Then: detection metrics (mAP, NDS, precision, recall, TP/FP/FN, per-class AP as a horizontal bar chart), dense metrics (mIoU + per-class IoU) or an explicit This run's task head produces no IoU-comparable artifact note, and runtime (P50/P95 latency, inference FPS, peak VRAM, GPU utilisation, GPU-hours per 1000 frames with its stated cost assumption). Every value badged Eval subset. Add one line at the top: Computed over the named subset below — not over this single sample.

/runs/:id/history — Review history

Chronological list of review events: timestamp, actor and role, status transition rendered as GENERATED → REVIEWED, comment. Plus an immutable configuration block (sample, checkpoint, task head, precision, config version) with a lock icon and the line Configuration is fixed at run creation and cannot be edited.

/system — Environment

A short status page: browser capability check (WebGPU: unavailable in this prototype — 2D fallback active), privacy pipeline status showing the two-path diagram (raw image → model path / privacy path → anonymized image → UI), dataset adapter (NuScenesAdapter, 1 registered), model adapter (BEVFusionAdapter, 1 registered), and a clear Prototype — all data is fixture data banner.

6. States to build

Every list has an empty state, every async action a loading state, every failure a specific message. Specifically: run failure (FAILED run detail shows the failure reason and no metrics at all, with Metrics unavailable — inference did not complete), sync mismatch band, WebGPU-unavailable notice on the viewer, privacy-status pending (camera tiles blur out entirely with Awaiting privacy processing rather than showing anything), and role-locked controls.

7. Design direction

Not a dashboard template and not a neon dark-mode developer tool. The reference is a calibrated instrument panel: quiet, dense, legible under scrutiny, where colour carries meaning rather than mood.

Palette (use these, don't drift): ground #101418, panel #171C22, raised #1F262E, hairline #2C353F, text #E4E9EE, muted text #8A98A6. Colour is semantically reserved, never decorative: camera modality #5EC8D8, LiDAR modality #B9A0FF, fusion/prediction #FFB454, ground truth #7BE0A8, warning #E8B84B, error #E8685B. A predicted box is always amber, a GT box always green, everywhere in the app, with no exception. Status pills reuse only these.

Type: IBM Plex Sans for interface text, IBM Plex Mono for every number, ID, token, timestamp and metric — tabular figures, so columns of latencies align down the page. Panel headers in small-caps mono with wide tracking at 11px. No font larger than 24px anywhere; this is an instrument, not a landing page.

Layout: 1px hairline borders, 4px radius on controls and 0 radius on panels, 8px spacing grid, generous internal padding but tight vertical rhythm in tables. Panels are separated by hairlines rather than shadows and gaps. Target a 1440px desktop viewport; degrade to a single-column stack below 1024px with the viewport panels becoming a tab strip.

Signature element: the scope badge system. Every number in the product wears a small mono badge — FRAME, EVAL SUBSET, TARGET, MOCK — in a fixed position to the right of its value. It is the visual thesis of the tool: a measurement is meaningless without its scope. Make these badges crisp, consistent, and present everywhere, including in tooltips and charts.

Motion: almost none. 120 ms opacity/transform on panel and dialog entry, a subtle pulse on the running-inference step list, cross-view object highlight snapping instantly with no easing. Respect prefers-reduced-motion. No page-load choreography.

8. Copy rules

Sentence case throughout. Active, specific verbs — Run inference, Submit for review, Mark reviewed, Flag. An action keeps its name through the flow: Flag produces the toast Run flagged. Errors state what happened and what to do, in the interface's voice, and never apologise: Inference failed at postprocess. Rerun with fp32 or check the checkpoint reference. Never call a mock value a result — anywhere a fixture number appears in a headline position, it is badged MOCK.

9. Quality floor

Keyboard-navigable throughout with visible focus rings; BEV boxes reachable by keyboard with arrow-key traversal between objects. All colour-coded information also carries a text or shape cue (GT = outlined, prediction = filled) so the modality palette is not the only signal. Contrast at least 4.5:1 for body text. Components split into small files under src/components/, mocks isolated in src/mocks/, no component file over ~200 lines.

10. Build order

Layout shell, routing, role switcher, design tokens, mock data, <Metric> + scope badge system.

/ runs table with filters and both role views.

/runs/:id Inspect — panels, layers, threshold, object inspector, cross-view selection.

/runs/new with the running-inference transition.

Evaluation, review history, review actions, /system.

All empty/loading/error/warning states, then an accessibility and consistency pass.

11. Acceptance checklist

Switching role visibly locks and unlocks the correct controls, each with a reason.

A frame-level number and a dataset-level number never appear under the same badge, and mAP/NDS/IoU never appear on the Inspect screen.

Model inference FPS and frontend render FPS are separately labelled wherever both appear.

The dense-output panel names its task head explicitly and never falls back to the point cloud.

Selecting an object in BEV highlights the same objectId in the camera tiles, and vice versa.

The threshold slider changes the visible prediction count and says it is filter-only.

The 180 ms-skew sample surfaces the sync warning band.

Only a reviewer can move a run to REVIEWED or FLAGGED; the transition, actor and comment appear in review history.

Camera tiles always carry the anonymized-for-display indicator; a pending privacy status blocks the image.

Every screen is reachable and complete at 1440px with no placeholder lorem text.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/22efc5d1-c070-4346-8fd8-653767dfc089).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
