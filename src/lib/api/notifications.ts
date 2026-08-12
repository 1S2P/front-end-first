import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "../supabase";

let activeChannel: ReturnType<typeof supabase.channel> | null = null;
let activeUserId: string | null = null;

export function useNotifications() {
  const qc = useQueryClient();
  const mountedRef = useRef(true);

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;
      if (!userId) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mountedRef.current) return;
      const userId = data.session?.user.id;
      if (!userId) return;

      if (activeChannel && activeUserId === userId) return;

      if (activeChannel) {
        supabase.removeChannel(activeChannel);
      }

      activeUserId = userId;
      activeChannel = supabase
        .channel(`notifications-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          () => qc.invalidateQueries({ queryKey: ["notifications"] }),
        )
        .subscribe();
    });

    return () => {
      mountedRef.current = false;
    };
  }, [qc]);

  return query;
}

export function useUnreadCount() {
  const { data } = useNotifications();
  return data?.filter((n) => !n.read).length ?? 0;
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.session!.user.id)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
