import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CAMERAS, type CameraName, type Detection, type Run } from "@/types";
import { CLASS_ABBR, type Layers } from "./viewer-types";
import { cn } from "@/lib/utils";

interface Props {
  run: Run;
  layers: Layers;
  visiblePredictions: Detection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

const HORIZON = "linear-gradient(180deg,#1b232b 0%,#232d36 46%,#141a20 47%,#0d1216 100%)";

function CameraTile({
  camera,
  run,
  detections,
  selectedId,
  onSelect,
}: {
  camera: CameraName;
  run: Run;
  detections: Detection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const pending = run.sample.privacyStatus !== "anonymized";
  return (
    <div className="relative aspect-[16/9] overflow-hidden border border-hairline bg-raised">
      <div className="absolute inset-0" style={{ background: HORIZON }} aria-hidden />
      <svg viewBox="0 0 160 90" className="absolute inset-0 size-full" aria-hidden={pending}>
        <path d="M40 90 L74 43 L86 43 L120 90 Z" fill="#1a2129" />
        <path d="M79 46 L81 46 L86 90 L74 90 Z" fill="#2c353f" opacity="0.8" />
        <line x1="0" y1="43" x2="160" y2="43" stroke="#2c353f" strokeWidth="0.5" />
        {!pending &&
          detections.map((d) => {
            const b = d.bbox2d?.[camera];
            if (!b) return null;
            const sel = selectedId === d.objectId;
            return (
              <g key={d.objectId}>
                <rect
                  x={b.x * 160}
                  y={b.y * 90}
                  width={b.w * 160}
                  height={b.h * 90}
                  fill="var(--fusion)"
                  fillOpacity={sel ? 0.28 : 0.12}
                  stroke="var(--fusion)"
                  strokeWidth={sel ? 1.2 : 0.6}
                  className="cursor-pointer"
                  onClick={() => onSelect(sel ? null : d.objectId)}
                />
                <text
                  x={b.x * 160 + 1}
                  y={b.y * 90 - 1.5}
                  fontSize="3.4"
                  fill="var(--fusion)"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {CLASS_ABBR[d.class]} {d.score.toFixed(2)}
                </text>
              </g>
            );
          })}
      </svg>
      {pending ? (
        <div className="absolute inset-0 flex items-center justify-center bg-background/85 backdrop-blur-md">
          <p className="px-3 text-center text-[11px] text-warning">Awaiting privacy processing</p>
        </div>
      ) : null}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-1.5 py-1">
        <span className="mono-num rounded-sm bg-background/70 px-1 text-[9px] tracking-[0.08em] text-camera">
          {camera}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="rounded-sm bg-background/70 p-0.5">
              <ShieldCheck
                className={cn("size-3", pending ? "text-warning" : "text-gt")}
                aria-label={pending ? "Privacy processing pending" : "Anonymized for display"}
              />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            The browser only ever receives the privacy-processed artifact. Raw frames stay on the
            model path server-side.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function CameraMosaic({ run, layers, visiblePredictions, selectedId, onSelect }: Props) {
  const active = CAMERAS.filter((c) => layers.cameras[c]);
  if (active.length === 0)
    return (
      <p className="p-4 text-muted-foreground">All camera layers are hidden. Enable one in Layers.</p>
    );
  return (
    <div className="grid grid-cols-3 gap-1">
      {active.map((c) => (
        <CameraTile
          key={c}
          camera={c}
          run={run}
          detections={layers.predictions ? visiblePredictions.filter((d) => d.visibleIn.includes(c)) : []}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
