import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn("flex min-h-0 flex-col border border-hairline bg-panel", className)}
    >
      <header className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-hairline px-3">
        <h2 className="panel-title truncate">{title}</h2>
        <div className="flex items-center gap-1">{actions}</div>
      </header>
      <div className={cn("min-h-0 flex-1 overflow-auto p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-24 flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-foreground">{title}</p>
      {hint ? <p className="max-w-md text-muted-foreground">{hint}</p> : null}
      {action}
    </div>
  );
}

export function LockedNote({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-[11px] text-muted-foreground">{children}</p>;
}
