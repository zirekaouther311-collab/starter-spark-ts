import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Home, Loader2, MessageCircle, Package, ShoppingBasket, SlidersHorizontal, Store } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { WILAYAS } from "@/lib/wilayas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, dzd } from "@/lib/db";
import { Card, SoonCard, SpaceShell, Spinner, selectClass, useRequireAuth } from "@/components/space-shell";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "فضاء الزبون — ذوق بلادي" },
      { name: "description", content: "تصفّح الأطباق، تفضيلاتك، مفضّلاتك وطلباتك في ذوق بلادي." },
    ],
  }),
  component: CustomerPage,
});

const TABS = [
  { id: "home", label: "الرئيسية", icon: Home },
  { id: "prefs", label: "تفضيلاتي", icon: SlidersHorizontal },
  { id: "favs", label: "المفضلة", icon: Heart },
  { id: "cart", label: "السلة", icon: ShoppingBasket },
  { id: "orders", label: "طلباتي", icon: Package },
  { id: "msgs", label: "الرسائل", icon: MessageCircle },
];

function CustomerPage() {
  const { user, loading, isSeller } = useRequireAuth();
  const [tab, setTab] = useState("home");
  if (loading || !user) return <Spinner />;
  const name = (user.user_metadata?.["full_name"] as string | undefined) ?? "";
  return (
    <SpaceShell
      title={`أهلاً ${name} 👋`}
      subtitle="اكتشف النكهات التقليدية واضبط تفضيلاتك"
      tone="primary"
      tabs={TABS}
      active={tab}
      onChange={setTab}
    >
      {tab === "home" && <Discover isSeller={isSeller} userId={user.id} />}
      {tab === "prefs" && <Preferences userId={user.id} />}
      {tab === "favs" && <Dishes userId={user.id} onlyFavs />}
      {tab === "cart" && <SoonCard title="سلتك فارغة" note="السلة متعددة البائعين قيد التجهيز، وستتفعّل مع أول الأطباق المعروضة." />}
      {tab === "orders" && <SoonCard title="لا طلبات بعد" note="ستجد هنا طلباتك وحالة كل واحد منها فور تفعيل الطلب والدفع." />}
      {tab === "msgs" && <SoonCard title="الرسائل" note="المراسلة الخاصة مع البائعين قيد التجهيز." />}
    </SpaceShell>
  );
}

function Discover({ isSeller, userId }: { isSeller: boolean; userId: string }) {
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await supabase.from("categories").select("id, name_ar").order("sort_order")).data ?? [],
  });
  const sellers = useQuery({
    queryKey: ["sellers-public"],
    queryFn: async () =>
      (await supabase.from("seller_profiles").select("id, shop_name, description, wilaya, specialties").limit(12)).data ?? [],
  });
  return (
    <>
      <Card title="الأصناف">
        <div className="flex flex-wrap gap-2">
          {(cats.data ?? []).map((c) => (
            <span key={c.id} className="rounded-full border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
              {c.name_ar}
            </span>
          ))}
        </div>
      </Card>
      <Card title="الأطباق المتاحة"><Dishes userId={userId} /></Card>
      <Card title="البائعون">
        {sellers.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (sellers.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">لم ينضم بائعون بعد. سيظهرون هنا فور تسجيلهم.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sellers.data!.map((s) => (
              <div key={s.id} className="rounded-xl border bg-background p-4 transition-transform hover:-translate-y-1">
                <p className="flex items-center gap-2 font-bold text-foreground"><Store className="h-4 w-4 text-palm" />{s.shop_name}</p>
                {s.wilaya && <p className="mt-1 text-xs text-muted-foreground">{s.wilaya}</p>}
                {s.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
      {!isSeller && (
        <Card>
          <p className="text-sm text-muted-foreground">تطبخ بنفسك؟ <Link to="/auth" search={{ mode: "signup", role: "seller" }} className="font-bold text-primary hover:underline">أنشئ حساب بائع</Link></p>
        </Card>
      )}
    </>
  );
}

function Preferences({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => (await supabase.from("profiles").select("full_name, phone, wilaya, commune").eq("id", userId).maybeSingle()).data,
  });
  const [f, setF] = useState({ full_name: "", phone: "", wilaya: "", commune: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) setF({ full_name: data.full_name ?? "", phone: data.phone ?? "", wilaya: data.wilaya ?? "", commune: data.commune ?? "" });
  }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name.trim() || null, phone: f.phone.trim() || null,
      wilaya: f.wilaya || null, commune: f.commune.trim() || null, updated_at: new Date().toISOString(),
    }).eq("id", userId);
    setSaving(false);
    if (error) return toast.error("تعذر حفظ التفضيلات، حاول مجدداً");
    toast.success("تم حفظ تفضيلاتك");
    void qc.invalidateQueries({ queryKey: ["profile", userId] });
  }
  if (isLoading) return <Spinner />;
  return (
    <Card title="معلوماتي وتفضيلاتي">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
        <div className="space-y-2"><Label>الهاتف</Label><Input dir="ltr" className="text-left" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="05 / 06 / 07 ..." /></div>
        <div className="space-y-2"><Label>الولاية</Label>
          <select className={selectClass} value={f.wilaya} onChange={(e) => setF({ ...f, wilaya: e.target.value })}>
            <option value="">— اختر —</option>{WILAYAS.map((w) => <option key={w}>{w}</option>)}
          </select></div>
        <div className="space-y-2"><Label>البلدية</Label><Input value={f.commune} onChange={(e) => setF({ ...f, commune: e.target.value })} /></div>
        <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}حفظ</Button></div>
      </form>
    </Card>
  );
}

type Dish = { id: string; name: string; price: number; stock: number; image_url: string | null; prep_time: string | null; seller_profiles: { shop_name: string } | null };

function Dishes({ userId, onlyFavs = false }: { userId: string; onlyFavs?: boolean }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const dishes = useQuery({
    queryKey: ["dishes"],
    queryFn: async () => ((await db.from("products").select("id,name,price,stock,image_url,prep_time,seller_profiles(shop_name)").eq("status", "active").gt("stock", 0).order("created_at", { ascending: false }).limit(60)).data ?? []) as unknown as Dish[],
  });
  const favs = useQuery({ queryKey: ["favs", userId], queryFn: async () => new Set(((await db.from("favorites").select("product_id").eq("user_id", userId)).data ?? []).map((r: { product_id: string }) => r.product_id)) });
  async function toggle(id: string) {
    const on = favs.data?.has(id);
    const { error } = on ? await db.from("favorites").delete().eq("user_id", userId).eq("product_id", id) : await db.from("favorites").insert({ user_id: userId, product_id: id });
    if (error) toast.error("تعذر تحديث المفضلة"); else void qc.invalidateQueries({ queryKey: ["favs", userId] });
  }
  const shown = (dishes.data ?? []).filter((d) => (!onlyFavs || favs.data?.has(d.id)) && d.name.includes(q.trim()));
  const body = dishes.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : shown.length === 0 ? (
    <p className="text-sm text-muted-foreground">{onlyFavs ? "لم تحفظ أي طبق بعد." : "لا أطباق متاحة حالياً."}</p>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((d) => (
        <div key={d.id} className="shadow-warm overflow-hidden rounded-2xl border bg-background transition-transform hover:-translate-y-1">
          {d.image_url ? <img src={d.image_url} alt={d.name} loading="lazy" className="h-36 w-full object-cover" /> : <div className="flex h-36 items-center justify-center bg-secondary"><Store className="h-8 w-8 text-secondary-foreground/40" /></div>}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2"><p className="font-bold text-foreground">{d.name}</p>
              <button type="button" aria-label="مفضلة" onClick={() => toggle(d.id)}><Heart className={`h-5 w-5 ${favs.data?.has(d.id) ? "fill-primary text-primary" : "text-muted-foreground"}`} /></button></div>
            <p className="mt-1 text-xs text-muted-foreground">{d.seller_profiles?.shop_name}</p>
            <p className="mt-2 font-bold text-primary">{dzd(d.price)}</p>
          </div>
        </div>
      ))}
    </div>
  );
  return onlyFavs ? <Card title="مفضلتي">{body}</Card> : <>
    <Input className="mb-4" placeholder="ابحث عن طبق..." value={q} onChange={(e) => setQ(e.target.value)} />{body}</>;
}
