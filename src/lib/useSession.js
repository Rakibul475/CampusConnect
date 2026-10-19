import { useEffect, useState } from "react";
import { getProfile } from "./api";
import { supabase } from "./supabase";

export function useSession() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    getProfile(userId)
      .then(setProfile)
      .catch(() => setProfile({ id: userId, full_name: "" }));
  }, [userId]);

  return {
    loading: session === undefined,
    user: session?.user ?? null,
    profile: userId && profile?.id === userId ? profile : null,
  };
}
