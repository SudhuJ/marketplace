"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import { supabase, clearSupabaseAuth } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { useCategories, useListings, useToggleSold, useDeleteListing } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Trash2, Edit3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export function ListingGrid() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: categories = [] } = useCategories();
  const {
    data: listings = [],
    isLoading,
    isFetching,
  } = useListings({
    search: debouncedSearch,
    categoryId: selectedCategory,
    minPrice,
    maxPrice,
    sortBy,
  });

  const toggleSold = useToggleSold();
  const deleteListing = useDeleteListing();

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          await clearSupabaseAuth();
          router.push("/login");
          return;
        }
      } catch {
        await clearSupabaseAuth();
        router.push("/login");
        return;
      }
      setAuthLoaded(true);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        if (!session) router.push("/login");
      }
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleToggleSold = (listingId: string, currentlySold: boolean) => {
    toggleSold.mutate({ listingId, isSold: currentlySold });
  };

  const handleDeleteListing = () => {
    if (!deleteTarget) return;
    deleteListing.mutate(deleteTarget);
    setDeleteTarget(null);
  };

  if (!authLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <HeaderSkeleton />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FilterSkeleton />
          <ListingGridSkeleton />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full border-t-2 border-b-2 border-zinc-200 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="px-3 py-1 text-xs tracking-wider border-zinc-800">
                VAPOR ENGINE
              </Badge>
              <h1 className="text-2xl font-medium text-zinc-100">Marketplace</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => router.push("/messages")} className="text-zinc-400 hover:text-zinc-200">
                Messages
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push("/profile")} className="text-zinc-400 hover:text-zinc-200">
                Profile
              </Button>
              <Button variant="outline" onClick={() => router.push("/create")} className="text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border-zinc-800">
                Create Listing
              </Button>
              <Button variant="outline" onClick={() => supabase.auth.signOut()} className="text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border-zinc-800">
                Sign Out ({user.email?.split("@")[0] || "User"})
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex items-center">
              <Search className="h-4 w-4 text-zinc-500 mr-2 flex-shrink-0" />
              <Input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Category</label>
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full bg-zinc-900/50 border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:ring-zinc-700 focus:border-zinc-600"
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Min Price ($)</label>
              <input
                type="number"
                placeholder="Min"
                value={minPrice ?? ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setMinPrice(isNaN(v) ? null : v);
                }}
                className="w-full bg-zinc-900/50 border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:ring-zinc-700 focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Max Price ($)</label>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice ?? ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setMaxPrice(isNaN(v) ? null : v);
                }}
                className="w-full bg-zinc-900/50 border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:ring-zinc-700 focus:border-zinc-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-zinc-900/50 border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:ring-zinc-700 focus:border-zinc-600"
              >
                <option value="created_at_desc">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="title_asc">Title: A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {isFetching && !isLoading && (
          <div className="text-xs text-zinc-500 mb-2">Updating…</div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.length > 0
            ? listings.map((listing: any) => (
                <div
                  key={listing.id}
                  className="bg-zinc-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => router.push(`/listings/${listing.id}`)}
                >
                  <div className="aspect-video bg-zinc-800 flex items-center justify-center overflow-hidden">
                    {listing.images && listing.images[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="text-zinc-600 text-center">
                        <p className="text-sm">No image</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${listing.is_sold ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                        {listing.is_sold ? "SOLD" : "FOR SALE"}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {listing.categories?.name || "Uncategorized"}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-medium text-zinc-100 line-clamp-2 mb-2">{listing.title}</h3>
                    <p className="text-zinc-400 text-sm line-clamp-3 mb-3">{listing.description || "No description available"}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl font-bold text-zinc-100">${Number(listing.price).toFixed(2)}</div>
                      <div className="flex items-center gap-2 text-zinc-400 text-sm">
                        {listing.profiles?.full_name || "Anonymous"}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                      {listing.user_id === user.id ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); router.push(`/edit/${listing.id}`); }}
                            className="flex-1 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border-zinc-800"
                          >
                            <Edit3 className="h-3 w-3 mr-1" /> Edit
                          </Button>
                          {!listing.is_sold ? (
                            <Button
                              onClick={(e) => { e.stopPropagation(); handleToggleSold(listing.id, false); }}
                              className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            >
                              Mark as Sold
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleToggleSold(listing.id, true); }}
                              className="flex-1 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border-zinc-800"
                            >
                              Mark as Available
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(listing.id); }}
                            className="flex-1 text-red-400 hover:bg-red-900/20"
                          >
                            <Trash2 className="h-3 w-3 mr-1" /> Delete
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/messages/${listing.id}?other=${listing.user_id}`);
                          }}
                          className="flex-1 bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                        >
                          Contact Seller
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            : !isLoading && (
                <div className="col-span-full text-center py-12">
                  <p className="text-zinc-500">No listings found matching your criteria.</p>
                  <Button onClick={() => router.push("/create")} className="mt-4">
                    Create Your First Listing
                  </Button>
                </div>
              )}
        </div>
      </main>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Delete Listing</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete this listing? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteListing}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <header className="bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    </header>
  );
}

function FilterSkeleton() {
  return (
    <div className="mb-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}

function ListingGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-zinc-900 rounded-lg overflow-hidden">
          <Skeleton className="aspect-video w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
