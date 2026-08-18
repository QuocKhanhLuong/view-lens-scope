import { ShieldCheck, Wrench } from "lucide-react";
import { useAppStore, ACTORS } from "@/state/app-store";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";

const OPTIONS: { role: Role; label: string; icon: typeof Wrench }[] = [
  { role: "engineer", label: "Perception engineer", icon: Wrench },
  { role: "reviewer", label: "Safety reviewer", icon: ShieldCheck },
];

export function RoleSwitcher() {
  const { role, dispatch } = useAppStore();
  return (
    <div className="flex items-center gap-2">
      <span className="panel-title hidden sm:inline">Role</span>
      <div
        role="radiogroup"
        aria-label="Active role"
        className="flex items-center rounded-[4px] border border-hairline bg-raised p-px"
      >
        {OPTIONS.map(({ role: r, label, icon: Icon }) => (
          <button
            key={r}
            role="radio"
            aria-checked={role === r}
            onClick={() => dispatch({ type: "set_role", role: r })}
            className={cn(
              "flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-[12px] transition-opacity duration-[120ms]",
              role === r
                ? "bg-panel text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <span className="mono-num hidden text-[11px] text-muted-foreground md:inline">
        {ACTORS[role]}
      </span>
    </div>
  );
}
