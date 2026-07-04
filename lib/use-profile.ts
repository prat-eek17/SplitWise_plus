"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "./supabase/client";
import { Profile } from "./types";

const supabase = createClient();

export function useProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Profile | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error) throw error;
      return data as Profile;
    },
  });
}
