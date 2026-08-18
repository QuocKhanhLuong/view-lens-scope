import type { CameraName, Detection, DetectionClass, TaskHead } from "@/types";
import { rng } from "./samples";

const CLASSES: DetectionClass[] = [
  "car",
  "car",
  "car",
  "truck",
  "bus",
  "trailer",
  "construction_vehicle",
  "pedestrian",
  "pedestrian",
  "motorcycle",
  "bicycle",
  "traffic_cone",
  "barrier",
];

const SIZE: Record<DetectionClass, [number, number, number]> = {
  car: [4.6, 1.9, 1.5],
  truck: [7.2, 2.5, 3.1],
  bus: [11.4, 2.9, 3.4],
  trailer: [12.1, 2.9, 3.8],
  construction_vehicle: [6.4, 2.8, 3.2],
  pedestrian: [0.7, 0.7, 1.75],
  motorcycle: [2.1, 0.8, 1.5],
  bicycle: [1.7, 0.6, 1.4],
  traffic_cone: [0.4, 0.4, 0.9],
  barrier: [2.5, 0.4, 1.0],
};

function cameraFor(x: number, y: number): CameraName {
  const a = (Math.atan2(y, x) * 180) / Math.PI;
  if (a >= -30 && a < 30) return "CAM_FRONT";
  if (a >= 30 && a < 90) return "CAM_FRONT_LEFT";
  if (a >= 90 && a < 150) return "CAM_BACK_LEFT";
  if (a >= -90 && a < -30) return "CAM_FRONT_RIGHT";
  if (a >= -150 && a < -90) return "CAM_BACK_RIGHT";
  return "CAM_BACK";
}

export function buildDetections(seed: number, withGt: boolean): Detection[] {
  const r = rng(seed * 104729 + 17);
  const count = 15 + Math.floor(r() * 16);
  const out: Detection[] = [];
  for (let i = 0; i < count; i++) {
    const cls = CLASSES[Math.floor(r() * CLASSES.length)];
    const x = (r() * 2 - 1) * 46;
    const y = (r() * 2 - 1) * 24;
    const yaw = (r() * 2 - 1) * Math.PI;
    const [l, w, h] = SIZE[cls];
    const distanceM = Math.sqrt(x * x + y * y);
    const score = Math.min(0.99, 0.22 + r() * 0.76);
    const cam = cameraFor(x, y);
    const id = `obj-${String(seed).padStart(2, "0")}-${String(i).padStart(3, "0")}`;
    const iou = withGt ? Math.max(0.12, Math.min(0.95, 0.4 + r() * 0.55)) : undefined;
    out.push({
      objectId: id,
      class: cls,
      score: Number(score.toFixed(3)),
      source: "prediction",
      center: { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), z: Number((-1 + r()).toFixed(2)) },
      size: { l, w, h },
      yaw: Number(yaw.toFixed(3)),
      distanceM: Number(distanceM.toFixed(1)),
      iou: iou ? Number(iou.toFixed(2)) : undefined,
      visibleIn: [cam],
      bbox2d: {
        [cam]: {
          x: 0.08 + r() * 0.6,
          y: 0.34 + r() * 0.2,
          w: Math.max(0.06, 0.34 - distanceM / 220),
          h: Math.max(0.06, 0.3 - distanceM / 260),
        },
      },
    });
    if (withGt && r() > 0.18) {
      const jx = x + (r() * 2 - 1) * 0.9;
      const jy = y + (r() * 2 - 1) * 0.9;
      out.push({
        objectId: `${id}-gt`,
        class: cls,
        score: 1,
        source: "ground_truth",
        center: { x: Number(jx.toFixed(2)), y: Number(jy.toFixed(2)), z: -1 },
        size: { l, w, h },
        yaw: Number((yaw + (r() * 2 - 1) * 0.12).toFixed(3)),
        distanceM: Number(Math.sqrt(jx * jx + jy * jy).toFixed(1)),
        visibleIn: [cameraFor(jx, jy)],
      });
    }
  }
  return out;
}

export const OCCUPANCY_CLASSES = ["free", "occupied", "unknown", "drivable", "vegetation"];
export const SEGMENTATION_CLASSES = [
  "drivable surface",
  "lane divider",
  "sidewalk",
  "vehicle",
  "background",
];

export function buildDenseCells(seed: number, kind: TaskHead, gridW: number, gridH: number) {
  const r = rng(seed * 7 + 991);
  const cells = new Array<number>(gridW * gridH);
  for (let j = 0; j < gridH; j++) {
    for (let i = 0; i < gridW; i++) {
      const cx = i / gridW - 0.5;
      const cy = j / gridH - 0.5;
      const road = Math.abs(cy) < 0.14 + 0.05 * Math.sin(cx * 9) ? 1 : 0;
      let v: number;
      if (kind === "occupancy") {
        v = road ? 3 : r() > 0.86 ? 1 : r() > 0.55 ? 0 : 2;
        if (!road && Math.abs(cy) > 0.36) v = 4;
      } else {
        v = road ? 0 : Math.abs(cy) < 0.17 ? 1 : Math.abs(cy) < 0.24 ? 2 : r() > 0.9 ? 3 : 4;
      }
      cells[j * gridW + i] = v;
    }
  }
  return cells;
}
