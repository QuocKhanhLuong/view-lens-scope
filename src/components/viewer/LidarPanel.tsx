import { useEffect, useRef } from "react";
import { rng } from "@/mocks/samples";

export function LidarPanel({ seed }: { seed: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 520;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = "#12171c";
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = "#2c353f";
    ctx.lineWidth = 1;
    for (const r of [0.25, 0.5, 0.75, 1]) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, (r * size) / 2 - 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    const rand = rng(seed * 13 + 7);
    for (let i = 0; i < 4000; i++) {
      const angle = rand() * Math.PI * 2;
      const ring = Math.pow(rand(), 0.6);
      const radius = ring * (size / 2 - 8);
      const jitter = (rand() - 0.5) * 6;
      const x = size / 2 + Math.cos(angle) * radius + jitter;
      const y = size / 2 + Math.sin(angle) * radius + jitter;
      const intensity = 0.25 + (1 - ring) * 0.75 * rand();
      ctx.fillStyle = `rgba(185, 160, 255, ${intensity.toFixed(2)})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }

    ctx.fillStyle = "#e4e9ee";
    ctx.fillRect(size / 2 - 3, size / 2 - 6, 6, 12);
  }, [seed]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <canvas
          ref={ref}
          role="img"
          aria-label="Mock top-down LiDAR point cloud, approximately 4000 points"
          className="max-h-full w-auto max-w-full border border-hairline"
        />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Mock render. Production mounts the Rerun/WebGPU viewer here. This is a point cloud — it is
        not occupancy or segmentation output.
      </p>
    </div>
  );
}
