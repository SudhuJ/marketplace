"use client";

import { useState, useEffect } from "react";
import { supabase, clearSupabaseAuth } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, ArrowLeft, Trash2, Edit3, XCircle } from "lucide-react";
import { Avatar } from "@/components/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ListingDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          await clearSupabaseAuth();
          router.push("/login");
          return;
        }
        setUser(session.user);

        const { data: listingData, error: listingError } = await supabase
          .from("listings")
          .select("*, categories!inner(name)")
          .eq("id", params.id)
          .single();

        if (listingError) throw listingError;
        setListing(listingData);

        // Profile and favorites are independent — run in parallel
        const [{ data: profileData }, { data: favData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", listingData.user_id).single(),
          supabase.from("favorites").select("id").eq("user_id", session.user.id).eq("listing_id", params.id).maybeSingle(),
        ]);
        setSeller(profileData);
        setIsFavorited(!!favData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, router]);

  // Dynamic page title for SEO
  useEffect(() => {
    if (listing?.title) {
      document.title = `${listing.title} — Vapor Engine`;
    }
  }, [listing]);

  const toggleFavorite = async () => {
    if (!user || !listing) return;
    if (isFavorited) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listing.id);
      setIsFavorited(false);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, listing_id: listing.id });
      setIsFavorited(true);
    }
  };

  const handleDelete = async () => {
    await supabase.from("listings").delete().eq("id", listing.id);
    router.push("/");
  };

  const handleToggleSold = async () => {
    await supabase
      .from("listings")
      .update({
        is_sold: !listing.is_sold,
        sold_at: listing.is_sold ? null : new Date().toISOString(),
      })
      .eq("id", listing.id);
    setListing({ ...listing, is_sold: !listing.is_sold, sold_at: listing.is_sold ? null : new Date().toISOString() });
  };

  const handleContact = () => {
    router.push(`/messages/${listing.id}?other=${listing.user_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full border-t-2 border-b-2 border-zinc-200 w-12 h-12" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{error || "Listing not found"}</p>
          <Button onClick={() => router.push("/")}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === listing.user_id;

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/")} className="text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={() => router.push(`/edit/${listing.id}`)}>
                  <Edit3 className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleToggleSold} className={listing.is_sold ? "text-green-400" : ""}>
                  {listing.is_sold ? "Mark Available" : "Mark Sold"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" onClick={toggleFavorite}>
              <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-zinc-400"}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden">
              {listing.images?.[0] ? (
                <img src={listing.images[0]} alt={listing.title} className="object-cover w-full h-full" />
              ) : (
                <div className="text-zinc-600 text-center">
                  <XCircle className="h-16 w-16 mx-auto mb-2" />
                  <p>No image</p>
                </div>
              )}
            </div>
            {listing.images && listing.images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {listing.images.map((img: string, i: number) => (
                  <div key={i} className="w-20 h-20 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={img} alt="" className="object-cover w-full h-full" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{listing.categories?.name}</Badge>
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                listing.is_sold ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
              }`}>
                {listing.is_sold ? "SOLD" : "FOR SALE"}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-zinc-100 mb-4">{listing.title}</h1>
            <div className="text-4xl font-bold text-zinc-100 mb-6">${Number(listing.price).toFixed(2)}</div>

            {listing.condition && (
              <div className="mb-4">
                <span className="text-zinc-500 text-sm">Condition: </span>
                <span className="text-zinc-300 capitalize">{listing.condition}</span>
              </div>
            )}

            <p className="text-zinc-400 mb-8 leading-relaxed">
              {listing.description || "No description provided."}
            </p>

            <div className="border-t border-zinc-800 pt-6 mb-6">
              <h3 className="text-zinc-300 font-medium mb-3">Seller</h3>
              <div className="flex items-center gap-3">
                <Avatar src={seller?.avatar_url} size={10} />
                <div>
                  <p className="text-zinc-200">{seller?.full_name || "Anonymous"}</p>
                  {seller?.location && <p className="text-zinc-500 text-sm">{seller.location}</p>}
                </div>
              </div>
            </div>

            {!isOwner && (
              <Button onClick={handleContact} className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium">
                <MessageCircle className="h-5 w-5 mr-2" /> Contact Seller
              </Button>
            )}
          </div>
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Delete Listing</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
