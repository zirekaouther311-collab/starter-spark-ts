import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChefHat, Loader2, Mail, ShoppingBasket, Store, UserRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const searchSchema = (search: Record<string, unknown>) => {
  const result: { mode: "login" | "signup"; role?: "seller" | "customer" } = {
    mode: search["mode"] === "signup" ? "signup" : "login",
  };
  if (search["role"] === "seller" || search["role"] === "customer") {
    result.role = search["role"];
  }
  return result;
};

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول أو إنشاء حساب — ذوق بلادي" },
      {
        name: "description",
        content: "سجّل دخولك أو أنشئ حساباً في ذوق بلادي كبائع أو زبون.",
      },
    ],
  }),
  component: AuthPage,
});

type Role = "seller" | "customer";

function AuthPage() {
  const { mode: initialMode, role: initialRole } = Route.useSearch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [role, setRole] = useState<Role | null>(initialRole ?? null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function goToSpace(userId: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isSeller = (data ?? []).some((r) => r.role === "seller");
    navigate({ to: isSeller ? "/seller" : "/account", replace: true });
  }

  function switchMode(next: "login" | "signup") {
    setMode(next);
    if (next === "login") setRole(null);
    navigate({ to: "/auth", search: { mode: next }, replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z
      .object({
        email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
        password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
        fullName: mode === "signup" ? z.string().min(2, "يرجى إدخال الاسم الكامل") : z.string(),
      })
      .safeParse({ email, password, fullName });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "تحقق من الحقول");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (!role) {
          toast.error("اختر نوع الحساب أولاً: بائع أو زبون");
          return;
        }
        const { data: created, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (created.user && (created.user.identities?.length ?? 1) === 0) {
          toast.error("هذا البريد مسجّل مسبقاً — جرّب تسجيل الدخول");
          return;
        }
        if (created.session) {
          toast.success("تم إنشاء حسابك بنجاح!");
          await goToSpace(created.session.user.id);
        } else {
          setSentTo(email);
        }
      } else {
        const { data: signed, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("مرحباً بعودتك!");
        await goToSpace(signed.user.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.includes("Invalid login credentials")) {
        toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (message.includes("Email not confirmed")) {
        toast.error("يرجى تأكيد بريدك الإلكتروني أولاً — تحقق من صندوق الوارد");
      } else if (message.includes("already registered")) {
        toast.error("هذا البريد مسجّل مسبقاً — جرّب تسجيل الدخول");
      } else {
        toast.error("حدث خطأ، حاول مرة أخرى");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!z.string().email().safeParse(email).success) {
      toast.error("أدخل بريدك الإلكتروني أولاً ثم اضغط إعادة التعيين");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      toast.error("تعذر إرسال رابط إعادة التعيين، حاول لاحقاً");
    } else {
      toast.success("أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك");
    }
  }

  return (
    <main className="pattern-zellige flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="animate-rise shadow-warm-lg rounded-3xl border bg-card p-8">
          <div className="mb-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-warm">
              <ChefHat className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-2xl font-bold text-foreground">
              {mode === "login" ? "مرحباً بعودتك" : "انضم إلى ذوق بلادي"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "login"
                ? "سجّل دخولك لمتابعة طلباتك وأطباقك"
                : "أنشئ حسابك وابدأ رحلتك مع النكهة الجزائرية"}
            </p>
          </div>

          {sentTo ? (
            <div className="space-y-4 text-center">
              <Mail className="mx-auto h-10 w-10 text-primary" />
              <p className="font-bold text-foreground">تحقق من بريدك الإلكتروني</p>
              <p className="text-sm text-muted-foreground">
                أرسلنا رابط التأكيد إلى <span dir="ltr">{sentTo}</span>. بعد التأكيد سجّل دخولك.
              </p>
              <Button className="w-full" onClick={() => { setSentTo(null); switchMode("login"); }}>
                الذهاب لتسجيل الدخول
              </Button>
            </div>
          ) : (
          <>
          {/* Role selection card (signup only) */}
          {mode === "signup" && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              {(
                [
                  {
                    value: "seller",
                    label: "أنا بائع/بائعة",
                    desc: "أعرض أطباقي وأستقبل الطلبات",
                    icon: Store,
                  },
                  {
                    value: "customer",
                    label: "أنا زبون/زبونة",
                    desc: "أكتشف وأطلب أطباقاً تقليدية",
                    icon: ShoppingBasket,
                  },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={role === option.value}
                  className={`rounded-2xl border-2 p-4 text-center transition-all duration-300 ${
                    role === option.value
                      ? "border-primary bg-primary/5 shadow-warm scale-[1.02]"
                      : "border-border bg-background hover:border-primary/40"
                  }`}
                >
                  <option.icon
                    className={`mx-auto h-7 w-7 ${
                      role === option.value ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <p className="mt-2 text-sm font-bold text-foreground">{option.label}</p>
                  <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                    {option.desc}
                  </p>
                </button>
              ))}
            </div>
          )}

          {mode === "signup" && !role && (
            <p className="mb-4 text-center text-xs font-bold text-primary">اختر نوع حسابك لتفعيل الزر</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">الاسم الكامل</Label>
                <div className="relative">
                  <UserRound className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثال: أمينة بن علي"
                    className="pr-9"
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pr-9 text-left"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="text-left"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting || (mode === "signup" && !role)}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
            </Button>
          </form>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleResetPassword}
              className="mt-3 w-full text-center text-sm text-primary hover:underline"
            >
              نسيت كلمة المرور؟
            </button>
          )}

          </>
          )}

          <div className="mt-6 border-t pt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                ليس لديك حساب؟{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-bold text-primary hover:underline"
                >
                  أنشئ حساباً
                </button>
              </>
            ) : (
              <>
                لديك حساب مسبقاً؟{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-bold text-primary hover:underline"
                >
                  سجّل دخولك
                </button>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          بإنشائك حساباً أنت توافق على شروط الاستخدام وسياسة الخصوصية.
          <br />
          <Link to="/" className="text-primary hover:underline">
            العودة للصفحة الرئيسية
          </Link>
        </p>
      </div>
    </main>
  );
}
