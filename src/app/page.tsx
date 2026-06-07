"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Trash2, Edit3, CheckCircle } from "lucide-react";

export default function MarketplacePage() {
  const router = useRouter();
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Fetch user session
  useEffect(() => {
    const getSession = async () => {
      console.log("[MarketplacePage] Getting session...");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("[MarketplacePage] Session result:", session);
      if (session?.user) {
        console.log("[MarketplacePage] User found:", session.user);
        setUser(session.user);
        // Load user's profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();
      } else {
        console.log("[MarketplacePage] No session user, redirecting to login");
        router.push("/login");
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[MarketplacePage] Auth state change:", session);
      if (session?.user) {
        setUser(session.user);
      } else {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Fetch listings with filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("*");

        if (categoriesData) {
          setCategories(categoriesData);
        }

        // Fetch listings with filters
        let query = supabase
          .from("listings")
          .select(
            `
            *,
            categories!inner(name),
            profiles!listings_user_id_fkey(full_name, avatar_url)
          `,
          )
          .eq("is_sold", false);

        // Apply filters
        if (searchTerm) {
          query = query.ilike("title", `%${searchTerm}%`);
        }

        if (selectedCategory) {
          query = query.eq("category_id", selectedCategory);
        }

        if (minPrice !== null) {
          query = query.gte("price", minPrice);
        }

        if (maxPrice !== null) {
          query = query.lte("price", maxPrice);
        }

        const { data: listingsData, error } = await query.order("created_at", {
          ascending: false,
        });

        if (error) throw error;
        if (listingsData) {
          setListings(listingsData);
        }
      } catch (err) {
        console.error("Error fetching listings:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, searchTerm, selectedCategory, minPrice, maxPrice, router]);

  // Handle creating a new listing
  const handleCreateListing = async () => {
    // This would open a modal/form - for now, just redirect to create page
    router.push("/create");
  };

  // Handle filtering
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value || null);
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMinPrice(isNaN(value) ? null : value);
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMaxPrice(isNaN(value) ? null : value);
  };

  // Handle marking as sold
  const handleMarkSold = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("listings")
        .update({ is_sold: true, sold_at: new Date().toISOString() })
        .eq("id", listingId);

      if (error) throw error;
      // Refetch listings
      // (The useEffect will refetch due to the updated data)
    } catch (err) {
      console.error("Error marking as sold:", err);
    }
  };

  // Handle deleting a listing
  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;

    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);

      if (error) throw error;
      // Refetch listings
    } catch (err) {
      console.error("Error deleting listing:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full border-t-2 border-b-2 border-zinc-200 w-12 h-12"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900/50 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-xs tracking-wider border-zinc-800"
              >
                VAPOR ENGINE
              </Badge>
              <h1 className="text-2xl font-medium text-zinc-100">
                Marketplace
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleCreateListing}
                className="text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border-zinc-800"
              >
                Create Listing
              </Button>

              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Sign out
                    supabase.auth.signOut();
                  }}
                  className="text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border-zinc-800"
                >
                  Sign Out ({user.email?.split("@")[0] || "User"})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="flex items-center">
              <Search className="h-4 w-4 text-zinc-500 mr-2" />
              <Input
                type="text"
                placeholder="Search listings..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="flex-1 bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Category
              </label>
              <select
                value={selectedCategory || ""}
                onChange={handleCategoryChange}
                className="w-full bg-zinc-900/50 border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:ring-zinc-700 focus:border-zinc-600"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Price */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Min Price ($)
              </label>
              <input
                type="number"
                placeholder="Min"
                value={minPrice ?? ""}
                onChange={handleMinPriceChange}
                className="w-full bg-zinc-900/50 border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:ring-zinc-700 focus:border-zinc-600"
              />
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Max Price ($)
              </label>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice ?? ""}
                onChange={handleMaxPriceChange}
                className="w-full bg-zinc-900/50 border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:ring-zinc-700 focus:border-zinc-600"
              />
            </div>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.length > 0 ? (
            listings.map((listing) => (
              <div
                key={listing.id}
                className="bg-zinc-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                {/* Listing Image Placeholder */}
                <div className="aspect-w-16 aspect-h-9 bg-zinc-800 flex items-center justify-center">
                  {listing.images && listing.images[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-zinc-500 text-center p-4">
                      <span className="material-symbols-outlined text-2xl">
                        image
                      </span>
                      <p className="mt-2 text-sm">No image</p>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        listing.is_sold
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {listing.is_sold ? "SOLD" : "FOR SALE"}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {listing.categories?.name || "Uncategorized"}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-medium text-zinc-100 line-clamp-2 mb-2">
                    {listing.title}
                  </h3>
                  <p className="text-zinc-400 text-sm line-clamp-3 mb-3">
                    {listing.description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl font-bold text-zinc-100">
                      ${listing.price?.toFixed(2) || "0.00"}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm">
                      <span className="material-symbols-outlined">person</span>
                      {listing.profiles?.full_name || "Anonymous"}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                    {listing.user_id === user.id ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/edit/${listing.id}`)}
                          className="flex-1 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border-zinc-800"
                        >
                          Edit
                        </Button>
                        {!listing.is_sold ? (
                          <Button
                            onClick={() => handleMarkSold(listing.id)}
                            className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          >
                            Mark as Sold
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => handleMarkSold(listing.id)}
                            className="flex-1 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border-zinc-800"
                          >
                            Mark as Available
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteListing(listing.id)}
                          className="flex-1 text-red-400 hover:bg-red-900/20"
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          // Open inquiry form - for now just alert
                          alert(
                            "Inquiry feature coming soon! You would be able to message the seller about this listing.",
                          );
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
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-zinc-500">
                No listings found matching your criteria.
              </p>
              {listings.length === 0 && (
                <Button onClick={handleCreateListing} className="mt-4">
                  Create Your First Listing
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Empty state when no filters match */}
        {listings.length === 0 &&
          searchTerm === "" &&
          selectedCategory === null &&
          minPrice === null &&
          maxPrice === null && (
            <div className="text-center py-12">
              <p className="text-zinc-500">
                No listings yet. Be the first to create one!
              </p>
              <Button onClick={handleCreateListing} className="mt-4">
                Create Your First Listing
              </Button>
            </div>
          )}
      </main>
    </div>
  );
}
