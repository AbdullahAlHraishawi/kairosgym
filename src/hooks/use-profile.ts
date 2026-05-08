import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onProfileChanged } from "@/lib/profile-bus";

export type Profile = {
  id: string;
  username: string;
  title: string;
  avatar_seed: string;
  total_xp: number;
  level: number;
  streak: number;
  last_workout_date: string | null;
  weight_kg: number | null;
  character_key: string | null;
};

export function useProfile(userId: string | null | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return onProfileChanged(() => {
      void refresh();
    });
  }, [refresh]);

  return { profile, loading, refresh };
}
