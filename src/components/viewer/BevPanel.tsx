import { useRef } from "react";
import type { Detection } from "@/types";
import type { Layers } from "./viewer-types";

const RANGE = 50;
const S = 500;
const toPx = (m: number) => (m / RANGE) * (S / 2);

function boxPoints(d: Detection) {
  const { l, w } = d.size;
  const c = Math.cos(-d.yaw);
  const s = Math.sin(-d.yaw);
  return [
    [l / 2, w / 2],
    [l / 2, -w / 2],
    [-l / 2, -w / 2],
    [-l / 2, w / 2],
  ]
    .map(([px, py]) => {
      const x = (px as number) * c - (py as number) * s;
      const y = (px as number) * s + (py as number) * c;
      // ego x forward → screen up; ego y left → screen left
      return `${S / 2 - toPx(d.center.y + y)},${S / 2 - toPx(d.center.x + x)}`;
    })
    .join(" ");
}

interface Props {
  predictions: Detection[];
  groundTruth: Detection[];
  layers: Layers;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function BevPanel({ predictions, groundTruth, layers, selectedId, onSelect }: Props) {
  const listRef = useRef<Detection[]>([]);
  listRef.current = predictions;

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const list = listRef.current;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "ArrowDown" && e.key !== "ArrowUp")
      return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
    const next = list[(index + dir + list.length) % list.length];
    if (!next) return;
    onSelect(next.objectId);
    const el = document.getElementById(`bev-box-${next.objectId}`);
    el?.focus();
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <svg
          viewBox={`0 0 ${S} ${S}`}
          className="max-h-full w-auto max-w-full border border-hairline bg-[#12171c]"
          role="group"
          aria-label="Bird's-eye view — top-down representation with predicted and ground-truth boxes"
        >
          {[10, 20, 30, 40].map((r) => (
            <g key={r}>
              <circle
                cx={S / 2}
                cy={S / 2}
                r={toPx(r)}
                fill="none"
                stroke="#2c353f"
                strokeWidth="1"
              />
              <text
                x={S / 2 + 3}
                y={S / 2 - toPx(r) - 3}
                fontSize="9"
                fill="#8a98a6"
                fontFamily="IBM Plex Mono, monospace"
              >
                {r} m
              </text>
            </g>
          ))}
          <line x1={S / 2} y1="0" x2={S / 2} y2={S} stroke="#2c353f" strokeWidth="0.5" />
          <line x1="0" y1={S / 2} x2={S} y2={S / 2} stroke="#2c353f" strokeWidth="0.5" />

          {layers.groundTruth &&
            groundTruth.map((d) => (
              <polygon
                key={d.objectId}
                points={boxPoints(d)}
                fill="none"
                stroke="var(--gt)"
                strokeWidth="1.4"
                strokeDasharray="4 2"
              />
            ))}

          {layers.predictions &&
            predictions.map((d, i) => {
              const sel = selectedId === d.objectId;
              const hx = S / 2 - toPx(d.center.y);
              const hy = S / 2 - toPx(d.center.x);
              return (
                <g key={d.objectId}>
                  <polygon
                    id={`bev-box-${d.objectId}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`Prediction ${d.class}, score ${d.score.toFixed(2)}, ${d.distanceM} metres`}
                    points={boxPoints(d)}
                    fill="var(--fusion)"
                    fillOpacity={sel ? 0.5 : 0.22}
                    stroke="var(--fusion)"
                    strokeWidth={sel ? 2 : 1}
                    className="cursor-pointer outline-none focus-visible:stroke-[3]"
                    onClick={() => onSelect(sel ? null : d.objectId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(d.objectId);
                      } else onKeyDown(e, i);
                    }}
                  />
                  <line
                    x1={hx}
                    y1={hy}
                    x2={hx - Math.sin(d.yaw) * 12}
                    y2={hy - Math.cos(d.yaw) * 12}
                    stroke="var(--fusion)"
                    strokeWidth="1.4"
                  />
                </g>
              );
            })}

          <polygon
            points={`${S / 2},${S / 2 - 10} ${S / 2 - 6},${S / 2 + 8} ${S / 2 + 6},${S / 2 + 8}`}
            fill="#e4e9ee"
          />
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 border border-dashed border-gt" /> Ground truth
          (outlined)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 border border-fusion bg-fusion/30" /> Prediction
          (filled, heading tick)
        </span>
        <span>BEV view — a top-down representation, not a prediction.</span>
      </div>
    </div>
  );
}
