import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Tables } from "./database.types";

type Listing = Tables<"listings"> & {
  categories?: { name: string } | null;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
};

type ListingsFilter = {
  search?: string;
  categoryId?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sortBy?: string;
  userId?: string;
};

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*");
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useListings(filters: ListingsFilter) {
  const { search, categoryId, minPrice, maxPrice, sortBy, userId } = filters;

  return useQuery({
    queryKey: ["listings", filters],
    queryFn: async () => {
      let query = supabase
        .from("listings")
        .select(
          `*,
          categories!inner(name),
          profiles(full_name, avatar_url)`,
        )
        .eq("is_sold", false);

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (minPrice != null) {
        query = query.gte("price", minPrice);
      }

      if (maxPrice != null) {
        query = query.lte("price", maxPrice);
      }

      if (userId) {
        query = query.eq("user_id", userId);
      }

      switch (sortBy) {
        case "price_asc":
          query = query.order("price", { ascending: true });
          break;
        case "price_desc":
          query = query.order("price", { ascending: false });
          break;
        case "title_asc":
          query = query.order("title", { ascending: true });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Listing[];
    },
  });
}

export function useMessages(listingId: string, otherUserId: string) {
  return useQuery({
    queryKey: ["messages", listingId, otherUserId],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return [];

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("listing_id", listingId)
        .or(
          `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`,
        )
        .order("created_at", { ascending: true });

      return data ?? [];
    },
    refetchInterval: 10_000,
  });
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      return data;
    },
    enabled: !!userId,
  });
}

export function useUserListings(userId?: string) {
  return useQuery({
    queryKey: ["user-listings", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("listings")
        .select("*, categories(name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useFavorites(userId?: string) {
  return useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("favorites")
        .select("*, listings!inner(*, categories!inner(name))")
        .eq("user_id", userId);
      return data ?? [];
    },
    enabled: !!userId,
  });
}

export function useToggleSold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      isSold,
    }: {
      listingId: string;
      isSold: boolean;
    }) => {
      const { error } = await supabase
        .from("listings")
        .update({
          is_sold: !isSold,
          sold_at: isSold ? null : new Date().toISOString(),
        })
        .eq("id", listingId);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);
      if (error) throw error;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      senderId,
      recipientId,
      content,
    }: {
      listingId: string;
      senderId: string;
      recipientId: string;
      content: string;
    }) => {
      const { error } = await supabase.from("messages").insert({
        listing_id: listingId,
        sender_id: senderId,
        recipient_id: recipientId,
        content,
      });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.listingId, variables.recipientId],
      });
    },
  });
}
