import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MetricScope } from "@/types";

const SCOPE_LABEL: Record<MetricScope, string> = {
  frame: "FRAME",
  "eval-subset": "EVAL SUBSET",
  target: "TARGET",
  mock: "MOCK",
};

const SCOPE_STYLE: Record<MetricScope, string> = {
  frame: "border-camera/40 text-camera bg-camera/10",
  "eval-subset": "border-warning/40 text-warning bg-warning/10",
  target: "border-gt/40 text-gt bg-gt/10",
  mock: "border-hairline text-muted-foreground bg-raised",
};

export function ScopeBadge({ scope, className }: { scope: MetricScope; className?: string }) {
  return (
    <span
      className={cn(
        "mono-num inline-flex shrink-0 items-center rounded-sm border px-1 py-px text-[9px] leading-[14px] tracking-[0.09em]",
        SCOPE_STYLE[scope],
        className,
      )}
    >
      {SCOPE_LABEL[scope]}
    </span>
  );
}

interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  scope: MetricScope;
  protocolNote?: string;
  emphasis?: boolean;
  className?: string;
}

export function Metric({
  label,
  value,
  unit,
  scope,
  protocolNote,
  emphasis,
  className,
}: MetricProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 py-1", className)}>
      <span className="text-muted-foreground">{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center gap-1.5">
            <span
              className={cn(
                "mono-num text-foreground",
                emphasis ? "text-[20px] leading-6" : "text-[13px]",
              )}
            >
              {value}
              {unit ? <span className="text-muted-foreground"> {unit}</span> : null}
            </span>
            <ScopeBadge scope={scope} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="mono-num text-[10px] tracking-[0.09em] text-muted-foreground">
            MOCK · fixture value, not a measurement
          </p>
          <p className="mt-1">
            {label} — scope {SCOPE_LABEL[scope]}.
          </p>
          {protocolNote ? <p className="mt-1 text-muted-foreground">{protocolNote}</p> : null}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
