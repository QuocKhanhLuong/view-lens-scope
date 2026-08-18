import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppStoreProvider } from "@/state/app-store";
import { AppShell } from "@/components/AppShell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="mono-num text-[24px] text-foreground">404</h1>
        <h2 className="mt-3 text-foreground">Page not found</h2>
        <p className="mt-2 text-muted-foreground">
          This route does not exist in the prototype. Return to the run list.
        </p>
        <div className="mt-5">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-[4px] border border-hairline bg-raised px-3 py-1.5 text-foreground hover:bg-panel"
          >
            Go to runs
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-foreground">This screen did not load</h1>
        <p className="mt-2 text-muted-foreground">
          The interface hit an unexpected state. Reload the view or return to the run list.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-[4px] border border-hairline bg-raised px-3 py-1.5 text-foreground hover:bg-panel"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-[4px] border border-hairline px-3 py-1.5 text-foreground hover:bg-raised"
          >
            Go to runs
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BEV Vision — sensor-fusion perception sandbox" },
      {
        name: "description",
        content:
          "Run, inspect and review camera–LiDAR fusion perception output on a single dataset sample.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppStoreProvider>
        <TooltipProvider delayDuration={150}>
          <AppShell>
            {/* Required: nested routes render here. */}
            <Outlet />
          </AppShell>
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </AppStoreProvider>
    </QueryClientProvider>
  );
}
