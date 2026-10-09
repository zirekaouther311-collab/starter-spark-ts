# تشغيل ذوق بلادي على VS Code

1. أنشئ مشروعاً مجانياً في https://supabase.com (New project) واحفظ كلمة سر قاعدة البيانات عندك (لا توضع في الكود).
2. من القائمة: SQL Editor ← New query ← الصق كامل محتوى `supabase/setup.sql` ← Run.
3. من Project Settings ← API انسخ: Project URL وكذلك مفتاح anon/publishable.
4. افتح ملف `.env` والصق القيم مكان YOUR-... (الحقول الخمسة). لا تضع مفتاح service_role أبداً.
5. Authentication ← Providers ← Email: للتجربة المحلية عطّل "Confirm email".
   وفي Authentication ← URL Configuration أضف `http://localhost:3000` و`http://localhost:5173` في Redirect URLs.
6. في الطرفية داخل المجلد:
   ```
   npm install
   npm run dev
   ```
   ثم افتح الرابط الذي يظهر (غالباً http://localhost:3000 أو 5173).
7. سجّل حساب بائع ← أنشئ المتجر ← أضف منطقة توصيل وطبقاً ← ثم سجّل حساب زبون في متصفح آخر لتراه.
