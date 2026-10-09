import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, UserRound } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي — ذوق بلادي" },
      { name: "description", content: "إدارة حسابك في ذوق بلادي." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/auth", search: { mode: "login" } });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="shadow-warm rounded-3xl border bg-card p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user.user_metadata?.full_name ?? "حسابي"}
            </h1>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>
        </div>
        <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          صفحة حسابك قيد التطوير — قريباً: المفضلة، الطلبات، الرسائل، والتفضيلات.
        </p>
      </div>
    </main>
  );
}
