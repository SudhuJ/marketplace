"use client";

import { useState, useEffect } from "react";
import { supabase, clearSupabaseAuth } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/avatar";

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { await clearSupabaseAuth(); router.push("/login"); return; }

        // Fetch messages (no direct FK from messages.sender_id to profiles,
        // so we fetch profiles separately instead of using a join)
        const messagesResult = await supabase
          .from("messages")
          .select("*, listings(id, title)")
          .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
          .order("created_at", { ascending: false });
        const messages = messagesResult.data as any[];

        if (messages) {
          // Collect unique user IDs and fetch their profiles in one batch
          const userIds = new Set<string>();
          for (const msg of messages) {
            userIds.add(msg.sender_id);
            userIds.add(msg.recipient_id);
          }
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", Array.from(userIds));
          const profileMap = new Map((profiles || []).map(p => [p.id, p]));

          const convMap = new Map();
          for (const msg of messages) {
            const otherId = msg.sender_id === session.user.id ? msg.recipient_id : msg.sender_id;
            const otherProfile = profileMap.get(otherId);
            const otherName = otherProfile?.full_name;
            const otherAvatar = otherProfile?.avatar_url;
            const key = `${otherId}-${msg.listing_id}`;
            if (!convMap.has(key)) {
              convMap.set(key, {
                otherId,
                otherName: otherName || "Unknown",
                otherAvatar,
                listingId: msg.listings?.id,
                listingTitle: msg.listings?.title || "Unknown Listing",
                lastMessage: msg.content,
                lastMessageAt: msg.created_at,
                unread: msg.read_at === null && msg.recipient_id === session.user.id,
              });
            }
          }
          setConversations(Array.from(convMap.values()));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full border-t-2 border-b-2 border-zinc-200 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-medium text-zinc-100">Messages</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {conversations.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No conversations yet. Contact a seller to start messaging.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div key={`${conv.otherId}-${conv.listingId}`}
                className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 hover:border-zinc-700 transition-colors cursor-pointer"
                onClick={() => router.push(`/messages/${conv.listingId}?other=${conv.otherId}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar src={conv.otherAvatar} size={10} />
                    <div>
                      <p className="text-zinc-200 font-medium">{conv.otherName}</p>
                      <p className="text-zinc-500 text-sm">Re: {conv.listingTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {conv.unread && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                    <span className="text-xs text-zinc-600">
                      {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mt-2 line-clamp-1 pl-13">{conv.lastMessage}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
