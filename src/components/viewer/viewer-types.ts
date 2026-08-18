import type { CameraName } from "@/types";

export interface Layers {
  cameras: Record<CameraName, boolean>;
  camerasPanel: boolean;
  lidar: boolean;
  bev: boolean;
  dense: boolean;
  groundTruth: boolean;
  predictions: boolean;
}

export const DEFAULT_LAYERS: Layers = {
  cameras: {
    CAM_FRONT: true,
    CAM_FRONT_LEFT: true,
    CAM_FRONT_RIGHT: true,
    CAM_BACK: true,
    CAM_BACK_LEFT: true,
    CAM_BACK_RIGHT: true,
  },
  camerasPanel: true,
  lidar: true,
  bev: true,
  dense: true,
  groundTruth: true,
  predictions: true,
};

export type PanelKey = "cameras" | "lidar" | "bev" | "dense";

export const CLASS_ABBR: Record<string, string> = {
  car: "CAR",
  truck: "TRK",
  bus: "BUS",
  trailer: "TRL",
  construction_vehicle: "CNV",
  pedestrian: "PED",
  motorcycle: "MC",
  bicycle: "BIC",
  traffic_cone: "CONE",
  barrier: "BAR",
};
