import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Radar } from "lucide-react";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const NAV = [
  { to: "/", label: "Runs" },
  { to: "/system", label: "Environment" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-11 shrink-0 items-center justify-between gap-4 border-b border-hairline bg-panel px-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <Radar className="size-4 text-camera" aria-hidden />
            <span className="mono-num text-[12px] tracking-[0.14em] uppercase">BEV Vision</span>
          </Link>
          <nav className="flex items-center gap-1" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-[3px] px-2 py-1 text-[12px] text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-foreground bg-raised" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-not-allowed items-center gap-1.5 px-2 py-1 text-[12px] text-muted-foreground/60">
                  Compare runs
                  <span className="mono-num rounded-sm border border-hairline px-1 text-[9px] tracking-[0.08em]">
                    ADVANCED
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent>Advanced scope — not in this build</TooltipContent>
            </Tooltip>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="mono-num hidden rounded-sm border border-hairline bg-raised px-1.5 py-px text-[9px] tracking-[0.09em] text-muted-foreground lg:inline">
            PROTOTYPE · FIXTURE DATA
          </span>
          <RoleSwitcher />
        </div>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
