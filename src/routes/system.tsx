import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Camera, Cpu, Database, Eye, Lock } from "lucide-react";
import { Panel } from "@/components/Panel";

export const Route = createFileRoute("/system")({
  head: () => ({
    meta: [
      { title: "Environment — BEV Vision" },
      {
        name: "description",
        content:
          "Browser capability, privacy pipeline and registered dataset/model adapters for the BEV Vision prototype.",
      },
      { property: "og:title", content: "Environment — BEV Vision" },
      {
        property: "og:description",
        content: "Capability check, privacy boundary and adapter registry.",
      },
    ],
  }),
  component: SystemPage,
});

function Row({ label, value, tone }: { label: string; value: string; tone?: "warn" | "ok" }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-hairline py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          "mono-num text-[12px] " +
          (tone === "warn" ? "text-warning" : tone === "ok" ? "text-gt" : "text-foreground")
        }
      >
        {value}
      </span>
    </div>
  );
}

function SystemPage() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-3 p-4">
      <div className="flex items-start gap-2 border border-warning/40 bg-warning/10 px-3 py-2">
        <AlertTriangle className="mt-px size-4 shrink-0 text-warning" aria-hidden />
        <p className="text-foreground">
          Prototype — all data is fixture data. No inference, dataset or GPU is attached to this
          interface.
        </p>
      </div>

      <h1 className="text-[20px]">Environment</h1>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Browser capability">
          <Row label="WebGPU" value="Unavailable in this prototype — 2D fallback active" tone="warn" />
          <Row label="Canvas 2D renderer" value="Active" tone="ok" />
          <Row label="Rerun viewer" value="Not mounted — mock canvas in its place" tone="warn" />
          <Row label="Frontend render FPS" value="60.0 fps (browser paint, not model)" />
          <Row label="Model inference FPS" value="Reported per run — see run runtime" />
        </Panel>

        <Panel title="Adapter registry">
          <div className="space-y-1">
            <Row label="Dataset adapter" value="NuScenesAdapter" tone="ok" />
            <Row label="Dataset adapters registered" value="1" />
            <Row label="Model adapter" value="BEVFusionAdapter" tone="ok" />
            <Row label="Model adapters registered" value="1" />
            <Row label="Config version" value="cfg-2026.07-r4" />
          </div>
          <div className="mt-3 flex items-center gap-3 text-muted-foreground">
            <Database className="size-4" aria-hidden />
            <span>Adapters are fixed at build time in this prototype.</span>
          </div>
        </Panel>
      </div>

      <Panel title="Privacy pipeline">
        <p className="text-muted-foreground">
          Raw camera imagery never reaches the browser. The model path consumes raw frames
          server-side; the UI is served only the anonymized artifact.
        </p>
        <div className="mt-3 grid gap-2 text-[12px] md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
          <div className="border border-hairline bg-raised p-3">
            <Camera className="mb-1 size-4 text-camera" aria-hidden />
            <p className="mono-num text-[11px] tracking-[0.08em]">RAW IMAGE</p>
            <p className="text-muted-foreground">Server-side only</p>
          </div>
          <span className="mono-num text-center text-muted-foreground">→</span>
          <div className="space-y-2">
            <div className="border border-hairline bg-raised p-3">
              <Cpu className="mb-1 size-4 text-fusion" aria-hidden />
              <p className="mono-num text-[11px] tracking-[0.08em]">MODEL PATH</p>
              <p className="text-muted-foreground">Inference on raw sensor data</p>
            </div>
            <div className="border border-hairline bg-raised p-3">
              <Lock className="mb-1 size-4 text-gt" aria-hidden />
              <p className="mono-num text-[11px] tracking-[0.08em]">PRIVACY PATH</p>
              <p className="text-muted-foreground">Face and plate anonymization</p>
            </div>
          </div>
          <span className="mono-num text-center text-muted-foreground">→</span>
          <div className="border border-hairline bg-raised p-3">
            <Eye className="mb-1 size-4 text-camera" aria-hidden />
            <p className="mono-num text-[11px] tracking-[0.08em]">ANONYMIZED IMAGE → UI</p>
            <p className="text-muted-foreground">Only artifact the browser receives</p>
          </div>
        </div>
        <div className="mt-3">
          <Row label="Privacy processor" value="Operational (mock)" tone="ok" />
          <Row label="Samples awaiting processing" value="1 of 12" tone="warn" />
        </div>
      </Panel>
    </div>
  );
}
