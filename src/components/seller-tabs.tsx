import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pause, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { db, dzd } from "@/lib/db";
import { WILAYAS } from "@/lib/wilayas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, selectClass } from "@/components/space-shell";

type Product = { id: string; name: string; price: number; stock: number; status: string; image_url: string | null; prep_time: string | null };
type Zone = { id: string; wilaya: string; method: string; fee: number; is_active: boolean };

export function ProductsTab({ userId, hasShop }: { userId: string; hasShop: boolean }) {
  const qc = useQueryClient();
  const key = ["my-products", userId];
  const list = useQuery({ queryKey: key, queryFn: async () => ((await db.from("products").select("*").eq("seller_id", userId).neq("status", "archived").order("created_at", { ascending: false })).data ?? []) as Product[] });
  const cats = useQuery({ queryKey: ["categories"], queryFn: async () => (await db.from("categories").select("id, name_ar").order("sort_order")).data ?? [] });
  const [f, setF] = useState({ name: "", description: "", price: "", stock: "", prep_time: "", image_url: "", category_id: "" });
  const [saving, setSaving] = useState(false);
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  if (!hasShop) return <Card><p className="text-sm text-muted-foreground">أنشئ متجرك أولاً من تبويب «متجري» ثم أضف أطباقك.</p></Card>;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(f.price), stock = Number(f.stock || 0);
    if (!(price >= 0) || f.price === "" || !Number.isInteger(stock) || stock < 0) return toast.error("تحقق من السعر والكمية");
    setSaving(true);
    const { error } = await db.from("products").insert({ seller_id: userId, name: f.name.trim(), description: f.description.trim() || null, price, stock, prep_time: f.prep_time.trim() || null, image_url: f.image_url.trim() || null, category_id: f.category_id || null, status: "active" });
    setSaving(false);
    if (error) return toast.error("تعذر إضافة الطبق");
    toast.success("تمت إضافة الطبق");
    setF({ name: "", description: "", price: "", stock: "", prep_time: "", image_url: "", category_id: "" });
    void refresh();
  }
  async function setStatus(id: string, status: string) {
    const { error } = await db.from("products").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("seller_id", userId);
    if (error) toast.error("تعذر التحديث"); else void refresh();
  }
  async function setStock(id: string, stock: number) {
    if (!Number.isInteger(stock) || stock < 0) return;
    const { error } = await db.from("products").update({ stock }).eq("id", id).eq("seller_id", userId);
    if (error) toast.error("تعذر تحديث الكمية"); else toast.success("تم تحديث الكمية");
  }

  return (
    <>
      <Card title="إضافة طبق جديد">
        <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2"><Label>اسم الطبق</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-2 sm:col-span-2"><Label>الوصف والمكونات</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="space-y-2"><Label>السعر (دج)</Label><Input type="number" min={0} step="1" dir="ltr" required value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <div className="space-y-2"><Label>الكمية المتوفرة</Label><Input type="number" min={0} step="1" dir="ltr" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></div>
          <div className="space-y-2"><Label>الصنف</Label>
            <select className={selectClass} value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
              <option value="">— اختر —</option>{(cats.data ?? []).map((c: { id: string; name_ar: string }) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
            </select></div>
          <div className="space-y-2"><Label>مدة التحضير</Label><Input value={f.prep_time} onChange={(e) => setF({ ...f, prep_time: e.target.value })} placeholder="مثال: يوم مسبقاً" /></div>
          <div className="space-y-2 sm:col-span-2"><Label>رابط صورة الطبق (اختياري)</Label><Input dir="ltr" className="text-left" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} placeholder="https://..." /></div>
          <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}نشر الطبق</Button></div>
        </form>
      </Card>
      <Card title="أطباقي">
        {list.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (list.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">لم تضف أي طبق بعد.</p> : (
          <div className="space-y-3">
            {list.data!.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-14 w-14 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1"><p className="font-bold text-foreground">{p.name}</p><p className="text-xs text-muted-foreground">{dzd(p.price)} · {p.status === "active" ? "ظاهر" : "متوقف"}</p></div>
                <Input type="number" min={0} dir="ltr" defaultValue={p.stock} className="w-20" aria-label="الكمية" onBlur={(e) => setStock(p.id, Number(e.target.value))} />
                <Button size="sm" variant="outline" onClick={() => setStatus(p.id, p.status === "active" ? "paused" : "active")}>{p.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{p.status === "active" ? "إيقاف" : "تفعيل"}</Button>
                <Button size="sm" variant="ghost" onClick={() => confirm("أرشفة هذا الطبق؟") && setStatus(p.id, "archived")}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}

export function DeliveryTab({ userId, hasShop }: { userId: string; hasShop: boolean }) {
  const qc = useQueryClient();
  const key = ["my-zones", userId];
  const list = useQuery({ queryKey: key, queryFn: async () => ((await db.from("delivery_zones").select("*").eq("seller_id", userId).order("wilaya")).data ?? []) as Zone[] });
  const [f, setF] = useState({ wilaya: "", method: "home", fee: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  if (!hasShop) return <Card><p className="text-sm text-muted-foreground">أنشئ متجرك أولاً من تبويب «متجري».</p></Card>;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const fee = Number(f.fee);
    if (!f.wilaya || f.fee === "" || !(fee >= 0)) return toast.error("اختر الولاية وأدخل رسم التوصيل");
    const { error } = await db.from("delivery_zones").upsert({ seller_id: userId, wilaya: f.wilaya, method: f.method, fee, is_active: true }, { onConflict: "seller_id,wilaya,method" });
    if (error) return toast.error("تعذر الحفظ");
    toast.success("تم حفظ منطقة التوصيل");
    setF({ wilaya: "", method: "home", fee: "" });
    void refresh();
  }
  async function patch(id: string, v: Partial<Zone>) {
    const { error } = await db.from("delivery_zones").update(v).eq("id", id).eq("seller_id", userId);
    if (error) toast.error("تعذر التحديث"); else void refresh();
  }
  async function remove(id: string) {
    const { error } = await db.from("delivery_zones").delete().eq("id", id).eq("seller_id", userId);
    if (error) toast.error("تعذر الحذف"); else void refresh();
  }

  return (
    <>
      <Card title="إضافة منطقة توصيل">
        <form onSubmit={add} className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2"><Label>الولاية</Label>
            <select className={selectClass} value={f.wilaya} onChange={(e) => setF({ ...f, wilaya: e.target.value })}><option value="">— اختر —</option>{WILAYAS.map((w) => <option key={w}>{w}</option>)}</select></div>
          <div className="space-y-2"><Label>الطريقة</Label>
            <select className={selectClass} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}><option value="home">توصيل للمنزل</option><option value="pickup">استلام من نقطة</option></select></div>
          <div className="space-y-2"><Label>الرسم (دج)</Label><Input type="number" min={0} dir="ltr" value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} /></div>
          <div className="sm:col-span-4"><Button type="submit"><Plus className="h-4 w-4" />حفظ المنطقة</Button></div>
        </form>
        <p className="mt-3 text-xs text-muted-foreground">يمكنك تعديل أو تعطيل أو حذف أي منطقة في أي وقت. الطلبات المؤكدة سابقاً لا تتأثر.</p>
      </Card>
      <Card title="مناطقي">
        {list.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (list.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">لم تضف مناطق بعد.</p> : (
          <div className="space-y-3">
            {list.data!.map((z) => (
              <div key={z.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3">
                <div className="flex-1"><p className="font-bold text-foreground">{z.wilaya}</p><p className="text-xs text-muted-foreground">{z.method === "home" ? "توصيل للمنزل" : "استلام"} · {z.is_active ? "مفعّلة" : "معطّلة"}</p></div>
                <Input type="number" min={0} dir="ltr" defaultValue={z.fee} className="w-24" aria-label="الرسم" onBlur={(e) => Number(e.target.value) >= 0 && patch(z.id, { fee: Number(e.target.value) })} />
                <Button size="sm" variant="outline" onClick={() => patch(z.id, { is_active: !z.is_active })}>{z.is_active ? "تعطيل" : "تفعيل"}</Button>
                <Button size="sm" variant="ghost" onClick={() => confirm("حذف هذه المنطقة؟") && remove(z.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
