import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChefHat,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import heroFood from "@/assets/hero-food.jpg";
import dishCouscous from "@/assets/dish-couscous.jpg";
import dishSweets from "@/assets/dish-sweets.jpg";
import dishSoup from "@/assets/dish-soup.jpg";

const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, name_ar, sort_order")
      .order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery),
  head: () => ({
    meta: [
      { title: "ذوق بلادي | Dhouk Bladi — سوق الأكل التقليدي الجزائري" },
      {
        name: "description",
        content:
          "اكتشف أطباقاً جزائرية تقليدية محضّرة بحب من بائعين محليين. اطلب كسكس، بوراك، حلويات وأكثر.",
      },
      {
        property: "og:title",
        content: "ذوق بلادي | Dhouk Bladi — سوق الأكل التقليدي الجزائري",
      },
      {
        property: "og:description",
        content:
          "اكتشف أطباقاً جزائرية تقليدية محضّرة بحب من بائعين محليين.",
      },
    ],
  }),
  component: LandingPage,
});

const CATEGORY_IMAGES: Record<string, string> = {
  couscous: dishCouscous,
  sweets: dishSweets,
  soups: dishSoup,
};

function LandingPage() {
  const { data: categories } = useSuspenseQuery(categoriesQuery);

  return (
    <main className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pattern-zellige absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium text-primary shadow-warm">
              <Sparkles className="h-4 w-4" />
              نكهة الجزائر من بيوت أهلها
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-snug text-foreground md:text-5xl md:leading-snug">
              أكل بيتي أصيل،
              <br />
              <span className="text-primary">من يد أمّهات وبائعين</span> تثق بهم
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
              ذوق بلادي يربطك بأفضل الأطباق الجزائرية التقليدية المحضّرة منزلياً:
              كسكس، شوربة فريك، بوراك، حلويات بالتمر... اكتشف، اطلب، واستمتع.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  <ShoppingBasket className="h-5 w-5" />
                  ابدأ الطلب الآن
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/auth" search={{ mode: "signup", role: "seller" }}>
                  <Store className="h-5 w-5" />
                  بِع أطباقك معنا
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="shadow-warm-lg overflow-hidden rounded-3xl border-4 border-card">
              <img
                src={heroFood}
                alt="مائدة جزائرية تقليدية: كسكس، شوربة، بوراك وحلويات"
                width={1600}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="animate-float absolute -bottom-6 -right-4 hidden rounded-2xl border bg-card p-4 shadow-warm-lg md:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">بائعون موثوقون</p>
                  <p className="text-xs text-muted-foreground">
                    أطباق منزلية محضّرة بعناية
                  </p>
                </div>
              </div>
            </div>
            <div className="animate-float-slow absolute -top-5 -left-4 hidden rounded-2xl border bg-card p-4 shadow-warm-lg md:block">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">توصيل محلي</p>
                  <p className="text-xs text-muted-foreground">
                    حسب مناطق كل بائع
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search entry */}
      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="shadow-warm flex items-center gap-3 rounded-2xl border bg-card px-5 py-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <p className="text-muted-foreground">
            ابحث عن طبقك المفضل... كسكس، مقروض، شخشوخة
          </p>
          <span className="mr-auto rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            قريباً مع أول البائعين
          </span>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">أصناف تقليدية</h2>
            <p className="mt-2 text-muted-foreground">
              تصفح حسب الصنف — من الكسكس إلى الحلويات بالتمر
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat) => {
            const img = CATEGORY_IMAGES[cat.slug];
            return (
              <div
                key={cat.id}
                className="group shadow-warm relative overflow-hidden rounded-2xl border bg-card transition-transform hover:-translate-y-1"
              >
                {img ? (
                  <img
                    src={img}
                    alt={cat.name_ar}
                    loading="lazy"
                    width={800}
                    height={800}
                    className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-36 w-full items-center justify-center bg-secondary">
                    <ChefHat className="h-10 w-10 text-secondary-foreground/50" />
                  </div>
                )}
                <div className="p-4">
                  <p className="font-bold text-foreground">{cat.name_ar}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    اكتشف الأطباق
                    <ArrowLeft className="h-3 w-3" />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-y bg-sand">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-foreground">
            كيف يعمل ذوق بلادي؟
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: "اكتشف",
                text: "تصفح أطباقاً تقليدية من بائعين محليين في منطقتك، واختر ما يعجبك.",
              },
              {
                icon: ShoppingBasket,
                title: "اطلب",
                text: "أضف للسلة، اختر عنوانك وطريقة التوصيل المناسبة، وأكّد طلبك بأمان.",
              },
              {
                icon: Truck,
                title: "استمتع",
                text: "تابع حالة طلبك خطوة بخطوة حتى يصلك طبقك ساخناً كما يجب.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="shadow-warm rounded-2xl border bg-card p-6 text-center"
              >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="h-7 w-7" />
                </span>
                <p className="mt-2 text-xs font-bold text-gold">الخطوة {i + 1}</p>
                <h3 className="mt-2 text-xl font-bold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Link
              to="/auth"
              search={{ mode: "signup", role: "customer" }}
              className="group shadow-warm relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-card p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-warm-lg"
            >
              <div className="pattern-zellige absolute inset-0 opacity-40" aria-hidden />
              <div className="relative">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <ShoppingBasket className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-2xl font-bold text-foreground">أنا زبون</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  اكتشف أطباقاً تقليدية محضّرة بحب، احفظ مفضّلاتك، وتابع طلباتك خطوة بخطوة.
                </p>
              </div>
              <span className="relative mt-6 inline-flex items-center gap-2 font-bold text-primary">
                أنشئ حساب زبون
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-2" />
              </span>
            </Link>
            <Link
              to="/auth"
              search={{ mode: "signup", role: "seller" }}
              className="group shadow-warm relative flex flex-col justify-between overflow-hidden rounded-3xl bg-palm p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-warm-lg"
            >
              <div className="pattern-zellige absolute inset-0 opacity-20" aria-hidden />
              <div className="relative">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold text-gold-foreground transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                  <ChefHat className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-2xl font-bold text-palm-foreground">
                  لديك مهارة طبخ؟
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-palm-foreground/85">
                  حوّل شغفك إلى مصدر دخل: أنشئ متجرك، اعرض أطباقك، وحدّد مناطق التوصيل بنفسك.
                </p>
              </div>
              <span className="relative mt-6 inline-flex items-center gap-2 font-bold text-palm-foreground">
                ابدأ البيع الآن
                <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-2" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ChefHat className="h-4 w-4" />
              </span>
              <span className="font-display text-lg font-bold">ذوق بلادي</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              سوق جزائري للأكل التقليدي المنزلي. نربط البائعين المحليين بالزبائن
              الباحثين عن النكهة الأصيلة.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-foreground">روابط</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link to="/auth" search={{ mode: "signup" }} className="hover:text-foreground">
                  إنشاء حساب
                </Link>
              </li>
              <li>
                <Link to="/auth" search={{ mode: "login" }} className="hover:text-foreground">
                  تسجيل الدخول
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground">تواصل معنا</h4>
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              الجزائر
            </p>
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ذوق بلادي — Dhouk Bladi. جميع الحقوق محفوظة.
        </div>
      </footer>
    </main>
  );
}
