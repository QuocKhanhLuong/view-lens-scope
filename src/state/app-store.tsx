import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import type { Role, ReviewEvent, Run, RunStatus } from "@/types";
import { INITIAL_RUNS } from "@/mocks/runs";

export const ACTORS: Record<Role, string> = { engineer: "k.luong", reviewer: "s.tran" };

interface State {
  role: Role;
  runs: Run[];
}

type Action =
  | { type: "set_role"; role: Role }
  | { type: "add_run"; run: Run }
  | { type: "set_threshold"; runId: string; value: number }
  | { type: "transition"; runId: string; to: RunStatus; role: Role; comment?: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set_role":
      return { ...state, role: action.role };
    case "add_run":
      return { ...state, runs: [action.run, ...state.runs] };
    case "set_threshold":
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.runId === action.runId ? { ...r, confidenceThreshold: action.value } : r,
        ),
      };
    case "transition":
      return {
        ...state,
        runs: state.runs.map((r) => {
          if (r.runId !== action.runId) return r;
          const event: ReviewEvent = {
            at: new Date().toISOString(),
            actorRole: action.role,
            actorName: ACTORS[action.role],
            from: r.status,
            to: action.to,
            comment: action.comment?.trim() ? action.comment.trim() : undefined,
          };
          return { ...r, status: action.to, reviewHistory: [...r.reviewHistory, event] };
        }),
      };
    default:
      return state;
  }
}

interface Store extends State {
  dispatch: React.Dispatch<Action>;
  getRun: (id: string) => Run | undefined;
}

const AppStoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { role: "engineer", runs: INITIAL_RUNS });
  const value = useMemo<Store>(
    () => ({
      ...state,
      dispatch,
      getRun: (id: string) => state.runs.find((r) => r.runId === id),
    }),
    [state],
  );
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useAppStore must be used inside AppStoreProvider");
  return ctx;
}
