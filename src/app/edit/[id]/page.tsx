"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trash2 } from "lucide-react";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const listingId = params?.id;
  
  const [listing, setListing] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // Fetch user session and listing data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        }
        setUser(session.user);
        
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*');
        if (categoriesData) setCategories(categoriesData);
        
        // Fetch listing if ID provided
        if (listingId) {
          const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .select(`
              *,
              categories!inner(name)
            `)
            .eq('id', listingId)
            .single();
            
          if (listingError) throw listingError;
          
          // Check if user owns this listing
          if (listingData.user_id !== session.user.id) {
            throw new Error("You don't have permission to edit this listing");
          }
          
          setListing(listingData);
          setTitle(listingData.title || "");
          setDescription(listingData.description || "");
          setPrice(listingData.price?.toString() || "");
          setCategoryId(listingData.category_id || "");
          setCondition(listingData.condition || "");
          setImages(listingData.images || []);
        }
      } catch (err: any) {
        setError(err.message);
        // Redirect to home if error
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2000);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [listingId, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!title.trim()) {
        throw new Error("Title is required");
      }
      
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        throw new Error("Please enter a valid price");
      }
      
      if (!categoryId) {
        throw new Error("Please select a category");
      }

      // Update the listing
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          price: priceNum,
          category_id: categoryId,
          condition: condition || null,
          images: images.length > 0 ? images : [],
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId);

      if (updateError) throw updateError;

      // Success!
      setSuccess("Listing updated successfully!");
      
      // Redirect to homepage after a brief delay
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="animate-spin rounded-full border-t-2 border-b-2 border-zinc-200 w-12 h-12"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-zinc-400">Loading listing...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-800 shadow-2xl">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-medium text-zinc-100">
              Edit Listing
            </h2>
            <Button 
              variant="outline"
              onClick={() => {
                router.push("/");
                router.refresh();
              }}
              className="text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 border-zinc-800"
            >
              Cancel
            </Button>
          </div>
          
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="p-3 text-sm text-green-400 bg-green-950/50 border border-green-900/50 rounded-md mb-4">
              {success}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Title
              </label>
              <Input
                type="text"
                placeholder="Enter item title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Description
              </label>
              <textarea
                placeholder="Describe your item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[80px] bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200 rounded-md px-3 py-2 resize-y"
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Price ($)
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-zinc-900/50 border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:ring-zinc-700 focus:border-zinc-600"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Condition (optional)
              </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full bg-zinc-900/50 border-zinc-800 rounded-md px-3 py-2 text-zinc-200 focus:ring-zinc-700 focus:border-zinc-600"
                >
                  <option value="">Select condition</option>
                  <option value="new">New</option>
                  <option value="like new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">
                Images (optional)
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700"
                />
                {images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {images.map((img, index) => (
                      <div key={index} className="flex items-center">
                        <img 
                          src={img} 
                          alt="Preview" 
                          className="w-16 h-16 object-cover rounded"
                        />
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newImages = [...images];
                            newImages.splice(index, 1);
                            setImages(newImages);
                          }}
                          className="ml-2 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="pt-4">
          <Button
            className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
            type="submit"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Listing"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}