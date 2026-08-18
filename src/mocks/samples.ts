import type { CameraName, Sample } from "@/types";
import { CAMERAS } from "@/types";

// Deterministic pseudo-random generator so fixtures never shift between renders.
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

const hex = "0123456789abcdef";
function token(seed: number) {
  const r = rng(seed * 7919);
  let out = "";
  for (let i = 0; i < 32; i++) out += hex[Math.floor(r() * 16)];
  return out;
}

interface SceneSpec {
  name: string;
  description: string;
  weather: Sample["weather"];
}

export const SCENES: SceneSpec[] = [
  {
    name: "scene-0061",
    description: "Urban intersection, moderate traffic, daylight, Boston Seaport",
    weather: "clear",
  },
  {
    name: "scene-0103",
    description: "Rain-slick arterial road, heavy spray, dusk, Singapore Queenstown",
    weather: "rain",
  },
  {
    name: "scene-0553",
    description: "Night residential street, parked vehicles, low ambient light",
    weather: "night",
  },
];

function sensorTimestamps(base: number, skewMs: number) {
  const out = {} as Record<CameraName | "LIDAR_TOP", number>;
  const r = rng(base % 100000);
  CAMERAS.forEach((c, i) => {
    out[c] = base + Math.round(r() * 12000) + i * 900;
  });
  out.LIDAR_TOP = base + Math.round(skewMs * 1000);
  return out;
}

export const SAMPLES: Sample[] = SCENES.flatMap((scene, si) =>
  Array.from({ length: 4 }, (_, fi) => {
    const seed = si * 10 + fi + 1;
    const frameIndex = 180 + fi * 17;
    const base = 1_533_151_600_000_000 + si * 42_000_000 + fi * 500_000;
    // scene-0103 frame 3 deliberately carries a 180 ms LiDAR skew.
    const skewMs = si === 1 && fi === 2 ? 180 : Math.round(rng(seed).call(null) * 22);
    return {
      sampleToken: token(seed),
      sceneName: scene.name,
      sceneDescription: scene.description,
      frameIndex,
      timestampUs: base,
      sensorTimestamps: sensorTimestamps(base, skewMs),
      maxSyncSkewMs: skewMs,
      calibrationVersion: `calib-v${si + 1}.${fi + 2}`,
      // one sample without ground truth, one awaiting privacy processing
      hasGroundTruth: !(si === 2 && fi === 3),
      privacyStatus: si === 0 && fi === 3 ? "pending" : "anonymized",
      weather: scene.weather,
    } satisfies Sample;
  }),
);

export const getSample = (tokenId: string) => SAMPLES.find((s) => s.sampleToken === tokenId);
