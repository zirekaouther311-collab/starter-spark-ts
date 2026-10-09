import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Loader2, MessageCircle, Package, ShoppingBag, Store, Truck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { WILAYAS } from "@/lib/wilayas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductsTab, DeliveryTab } from "@/components/seller-tabs";
import { Card, SoonCard, SpaceShell, Spinner, selectClass, useRequireAuth } from "@/components/space-shell";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "لوحة البائع — ذوق بلادي" },
      { name: "description", content: "إدارة متجرك وأطباقك وطلباتك في ذوق بلادي." },
    ],
  }),
  component: SellerPage,
});

const TABS = [
  { id: "overview", label: "نظرة عامة", icon: BarChart3 },
  { id: "shop", label: "متجري", icon: Store },
  { id: "products", label: "أطباقي", icon: Package },
  { id: "orders", label: "الطلبات", icon: ShoppingBag },
  { id: "delivery", label: "إعدادات التوصيل", icon: Truck },
  { id: "msgs", label: "الرسائل", icon: MessageCircle },
];

function SellerPage() {
  const { user, loading, isSeller } = useRequireAuth();
  const [tab, setTab] = useState("overview");
  const shop = useQuery({
    enabled: !!user && isSeller,
    queryKey: ["my-shop", user?.id],
    queryFn: async () => (await supabase.from("seller_profiles").select("*").eq("user_id", user!.id).maybeSingle()).data,
  });
  if (loading || !user) return <Spinner />;
  if (!isSeller) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Card>
          <h1 className="text-xl font-bold text-foreground">هذه الصفحة مخصصة للبائعين</h1>
          <p className="mt-2 text-sm text-muted-foreground">حسابك مسجّل كزبون.</p>
          <Button asChild className="mt-4"><Link to="/account">إلى فضاء الزبون</Link></Button>
        </Card>
      </main>
    );
  }
  return (
    <SpaceShell
      title={shop.data?.shop_name ? `متجر ${shop.data.shop_name}` : "لوحة البائع"}
      subtitle="أدر متجرك وأطباقك وطلباتك من مكان واحد"
      tone="palm"
      tabs={TABS}
      active={tab}
      onChange={setTab}
    >
      {tab === "overview" && (
        <>
          <Card title="حالة متجرك">
            {shop.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : shop.data ? (
              <p className="text-sm text-muted-foreground">
                متجرك <b className="text-foreground">{shop.data.shop_name}</b> {shop.data.is_active ? "ظاهر للزبائن" : "مخفي حالياً عن الزبائن"}.
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">لم تُنشئ متجرك بعد. أضف اسم المتجر ليظهر للزبائن.</p>
                <Button className="mt-3" onClick={() => setTab("shop")}>إنشاء متجري</Button>
              </>
            )}
          </Card>
          <SoonCard title="إحصائيات الطلبات" note="ستظهر الأرقام الحقيقية للطلبات والأطباق هنا بعد تفعيل الأطباق والطلبات. لا نعرض أرقاماً وهمية." />
        </>
      )}
      {tab === "shop" && <ShopForm userId={user.id} shop={shop.data ?? null} />}
      {tab === "products" && <ProductsTab userId={user.id} hasShop={!!shop.data} />}
      {tab === "orders" && <SoonCard title="الطلبات الواردة" note="ستصلك الطلبات هنا مع إمكانية القبول والتحضير (المرحلة 6)." />}
      {tab === "delivery" && <DeliveryTab userId={user.id} hasShop={!!shop.data} />}
      {tab === "msgs" && <SoonCard title="الرسائل" note="محادثات خاصة مع الزبائن (المرحلة 8)." />}
    </SpaceShell>
  );
}

type Shop = { shop_name: string; description: string | null; wilaya: string | null; commune: string | null; specialties: string[]; is_active: boolean } | null;

function ShopForm({ userId, shop }: { userId: string; shop: Shop }) {
  const qc = useQueryClient();
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id, name_ar").order("sort_order")).data ?? [],
  });
  const [f, setF] = useState({ shop_name: "", description: "", wilaya: "", commune: "", specialties: [] as string[], is_active: true });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (shop) setF({ shop_name: shop.shop_name, description: shop.description ?? "", wilaya: shop.wilaya ?? "", commune: shop.commune ?? "", specialties: shop.specialties, is_active: shop.is_active });
  }, [shop]);

  const toggle = (n: string) =>
    setF((p) => ({ ...p, specialties: p.specialties.includes(n) ? p.specialties.filter((x) => x !== n) : [...p.specialties, n] }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.shop_name.trim().length < 2) return toast.error("أدخل اسم المتجر");
    setSaving(true);
    const { error } = await supabase.from("seller_profiles").upsert(
      { user_id: userId, shop_name: f.shop_name.trim(), description: f.description.trim() || null, wilaya: f.wilaya || null, commune: f.commune.trim() || null, specialties: f.specialties, is_active: f.is_active, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) return toast.error("تعذر حفظ المتجر، حاول مجدداً");
    toast.success("تم حفظ متجرك");
    void qc.invalidateQueries({ queryKey: ["my-shop", userId] });
  }

  return (
    <Card title="معلومات المتجر">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2"><Label>اسم المتجر</Label><Input value={f.shop_name} onChange={(e) => setF({ ...f, shop_name: e.target.value })} placeholder="مثال: مطبخ أمّي فاطمة" required /></div>
        <div className="space-y-2 sm:col-span-2"><Label>نبذة</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div className="space-y-2"><Label>الولاية</Label>
          <select className={selectClass} value={f.wilaya} onChange={(e) => setF({ ...f, wilaya: e.target.value })}>
            <option value="">— اختر —</option>{WILAYAS.map((w) => <option key={w}>{w}</option>)}
          </select></div>
        <div className="space-y-2"><Label>البلدية</Label><Input value={f.commune} onChange={(e) => setF({ ...f, commune: e.target.value })} /></div>
        <div className="space-y-2 sm:col-span-2"><Label>تخصصاتي</Label>
          <div className="flex flex-wrap gap-2">
            {(cats.data ?? []).map((c) => (
              <button key={c.id} type="button" onClick={() => toggle(c.name_ar)} aria-pressed={f.specialties.includes(c.name_ar)}
                className={`rounded-full border px-4 py-2 text-sm transition-all ${f.specialties.includes(c.name_ar) ? "border-primary bg-primary/10 font-bold text-primary" : "bg-background text-muted-foreground hover:border-primary/40"}`}>
                {c.name_ar}
              </button>
            ))}
          </div></div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> إظهار متجري للزبائن
        </label>
        <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}حفظ المتجر</Button></div>
      </form>
    </Card>
  );
}
