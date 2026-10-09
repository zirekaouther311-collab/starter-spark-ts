import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "customer" | "seller" | "admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadRoles(user: User | null) {
      if (!user) {
        if (active) setRoles([]);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (active) setRoles((data ?? []).map((r) => r.role as AppRole));
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      void loadRoles(data.session?.user ?? null).finally(() => {
        if (active) setLoading(false);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") {
        return;
      }
      setSession(nextSession);
      setTimeout(() => void loadRoles(nextSession?.user ?? null), 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    roles,
    isAuthenticated: !!session,
    isSeller: roles.includes("seller"),
    isCustomer: roles.includes("customer"),
    loading,
  };
}
