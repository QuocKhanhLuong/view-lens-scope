import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/Panel";
import type { DenseOutput } from "@/types";

const PALETTE = ["#1b232b", "#ffb454", "#3d4854", "#5ec8d8", "#7be0a8"];

export function DensePanel({ dense }: { dense: DenseOutput | null }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!dense) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = dense.gridW;
    canvas.height = dense.gridH;
    const img = ctx.createImageData(dense.gridW, dense.gridH);
    for (let i = 0; i < dense.cells.length; i++) {
      const hexColor = PALETTE[(dense.cells[i] ?? 0) % PALETTE.length]!;
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [dense]);

  if (!dense)
    return (
      <EmptyState
        title="No dense output — this run has no occupancy/segmentation artifact"
        hint="The dense task head did not write a raster for this sample. The point cloud is not a substitute."
      />
    );

  const cellM = ((dense.rangeM * 2) / dense.gridW).toFixed(2);
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <canvas
          ref={ref}
          role="img"
          aria-label={`${dense.kind === "occupancy" ? "Occupancy prediction" : "BEV segmentation"} raster`}
          className="max-h-full w-auto max-w-full border border-hairline [image-rendering:pixelated]"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
      <div className="flex flex-wrap gap-3 text-[11px]">
        {dense.classes.map((c, i) => (
          <span key={c} className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block size-2.5 border border-hairline"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            />
            {c}
          </span>
        ))}
      </div>
      <p className="mono-num text-[10px] tracking-[0.06em] text-muted-foreground">
        {dense.gridW} × {dense.gridH} cells · {cellM} m · ±{dense.rangeM} m
      </p>
    </div>
  );
}
