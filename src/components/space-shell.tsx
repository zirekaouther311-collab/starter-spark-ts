import { useEffect, type ComponentType, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Hourglass } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

export type SpaceTab = { id: string; label: string; icon: ComponentType<{ className?: string }> };

export function useRequireAuth() {
  const auth = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) navigate({ to: "/auth", search: { mode: "login" } });
  }, [auth.loading, auth.isAuthenticated, navigate]);
  return auth;
}

export function Spinner() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function SpaceShell(props: {
  title: string;
  subtitle: string;
  tone: "primary" | "palm";
  tabs: SpaceTab[];
  active: string;
  onChange: (id: string) => void;
  children: ReactNode;
}) {
  const bar = props.tone === "palm" ? "bg-palm text-palm-foreground" : "bg-primary text-primary-foreground";
  return (
    <main className="pattern-zellige min-h-[calc(100vh-4rem)] px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className={`shadow-warm-lg animate-rise rounded-3xl p-6 md:p-8 ${bar}`}>
          <h1 className="text-2xl font-bold md:text-3xl">{props.title}</h1>
          <p className="mt-1 text-sm opacity-85">{props.subtitle}</p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <nav className="shadow-warm flex gap-2 overflow-x-auto rounded-2xl border bg-card p-2 md:flex-col md:overflow-visible">
            {props.tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => props.onChange(t.id)}
                aria-current={props.active === t.id}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  props.active === t.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
          <section className="animate-rise min-w-0">{props.children}</section>
        </div>
      </div>
    </main>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="shadow-warm mb-4 rounded-2xl border bg-card p-6">
      {title && <h2 className="mb-4 text-lg font-bold text-foreground">{title}</h2>}
      {children}
    </div>
  );
}

export function SoonCard({ title, note }: { title: string; note: string }) {
  return (
    <Card>
      <div className="flex flex-col items-center py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <Hourglass className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{note}</p>
      </div>
    </Card>
  );
}

export const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
