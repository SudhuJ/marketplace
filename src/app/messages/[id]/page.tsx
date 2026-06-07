"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, clearSupabaseAuth } from "@/lib/supabase";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { Tables } from "@/lib/database.types";

type Message = Tables<"messages">;

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const otherUserId = searchParams.get("other");

  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef(new Set<string>());

  const listingId = params.id;

  // Initial load
  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { await clearSupabaseAuth(); router.push("/login"); return; }
        setUser(session.user);

        const { data: listingData } = await supabase
          .from("listings")
          .select("title, user_id")
          .eq("id", listingId)
          .single();
        setListing(listingData);

        if (otherUserId) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", otherUserId)
            .single();
          setOtherUser(profileData);
        }

        if (otherUserId) {
          const { data: msgData } = await supabase
            .from("messages")
            .select("*")
            .eq("listing_id", listingId)
            .or(`and(sender_id.eq.${session.user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${session.user.id})`)
            .order("created_at", { ascending: true });
          const msgs = (msgData || []) as Message[];
          setMessages(msgs);
          msgs.forEach(m => knownIds.current.add(m.id));

          const unreadIds = msgs
            .filter(m => m.recipient_id === session.user.id && !m.read_at)
            .map(m => m.id);
          if (unreadIds.length > 0) {
            await supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .in("id", unreadIds);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [listingId, otherUserId, router]);

  // Supabase Realtime — replaces polling
  useEffect(() => {
    if (!user || !otherUserId || !listingId) return;

    const channel = supabase
      .channel(`messages:${listingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `listing_id=eq.${listingId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message | undefined;
          if (!newMsg || knownIds.current.has(newMsg.id)) return;

          const isRelevant =
            (newMsg.sender_id === user.id && newMsg.recipient_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.recipient_id === user.id);
          if (!isRelevant) return;

          knownIds.current.add(newMsg.id);
          setMessages(prev => [...prev, newMsg]);

          if (newMsg.recipient_id === user.id && !newMsg.read_at) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id)
              .then();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, otherUserId, listingId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!content.trim() || !user || !otherUserId || !listingId) return;
    setSending(true);
    const text = content.trim();
    setContent("");

    // Optimistic insert
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      listing_id: listingId,
      sender_id: user.id,
      recipient_id: otherUserId,
      content: text,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    knownIds.current.add(optimistic.id);
    setMessages(prev => [...prev, optimistic]);

    try {
      const { error } = await supabase.from("messages").insert({
        listing_id: listingId,
        sender_id: user.id,
        recipient_id: otherUserId,
        content: text,
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      knownIds.current.delete(optimistic.id);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full border-t-2 border-b-2 border-zinc-200 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-200 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Avatar src={otherUser?.avatar_url} size={8} />
          <div>
            <p className="text-zinc-200 font-medium">{otherUser?.full_name || "User"}</p>
            <p className="text-xs text-zinc-500">Re: {listing?.title || "Listing"}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-4 overflow-y-auto flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <p>No messages yet. Send the first message!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-xl px-4 py-2 ${
                  isMine ? "bg-zinc-200 text-zinc-900" : "bg-zinc-800 text-zinc-200"
                }`}>
                  <p>{msg.content}</p>
                  <div className="text-xs mt-1 text-zinc-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.read_at && isMine && <span className="ml-2">✓ Read</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="border-t border-zinc-800 bg-zinc-900/50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Input
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !sending && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200"
          />
          <Button onClick={sendMessage} disabled={!content.trim() || sending} className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
