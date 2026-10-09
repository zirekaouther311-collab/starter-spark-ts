import { Link, useNavigate } from "@tanstack/react-router";
import { ChefHat, LogOut, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { isAuthenticated, isSeller, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-warm">
            <ChefHat className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-bold text-foreground">
              ذوق بلادي
            </span>
            <span className="block text-[11px] tracking-wide text-muted-foreground">
              Dhouk Bladi
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/" className="transition-colors hover:text-foreground">
            الرئيسية
          </Link>
          <Link
            to="/"
            hash="categories"
            className="transition-colors hover:text-foreground"
          >
            الأصناف
          </Link>
          <Link
            to="/"
            hash="how"
            className="transition-colors hover:text-foreground"
          >
            كيف يعمل
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {loading ? null : isAuthenticated ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link to={isSeller ? "/seller" : "/account"}>
                  <UserRound className="h-4 w-4" />
                  {isSeller ? "لوحة البائع" : "حسابي"}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                خروج
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth" search={{ mode: "login" }}>
                  تسجيل الدخول
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  إنشاء حساب
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
