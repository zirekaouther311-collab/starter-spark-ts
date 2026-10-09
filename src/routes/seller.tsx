import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2, Store } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "لوحة البائع — ذوق بلادي" },
      { name: "description", content: "إدارة متجرك وأطباقك وطلباتك في ذوق بلادي." },
    ],
  }),
  component: SellerPage,
});

function SellerPage() {
  const { user, loading, isAuthenticated, isSeller } = useAuth();
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

  if (!isSeller) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="shadow-warm rounded-3xl border bg-card p-8 text-center">
          <h1 className="text-xl font-bold text-foreground">
            هذه الصفحة مخصصة للبائعين
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            حسابك مسجّل كزبون. إذا كنت تريد البيع، أنشئ حساب بائع.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="shadow-warm rounded-3xl border bg-card p-8">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-palm/10 text-palm">
            <Store className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">لوحة البائع</h1>
            <p className="text-sm text-muted-foreground">
              مرحباً {user.user_metadata?.full_name ?? ""}
            </p>
          </div>
        </div>
        <p className="mt-6 rounded-xl bg-muted p-4 text-sm text-muted-foreground">
          لوحة التحكم الكاملة قيد الإنشاء — قريباً: منتجاتك، الطلبات الواردة،
          إعدادات التوصيل، والرسائل.
        </p>
      </div>
    </main>
  );
}
