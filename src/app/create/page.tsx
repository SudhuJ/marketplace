"use client";

import { useState, useEffect } from "react";
import { supabase, clearSupabaseAuth } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export default function CreateListingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
      } catch (_err) {
        console.error('Error fetching categories:', _err);
      }
    };
    
    fetchCategories();
  }, []);

  const uploadImages = async (userId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('listing-images')
        .upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        await clearSupabaseAuth();
        router.push("/login");
        return;
      }

      if (!title.trim()) throw new Error("Title is required");
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) throw new Error("Please enter a valid price");
      if (!categoryId) throw new Error("Please select a category");

      let imageUrls = images;
      if (imageFiles.length > 0) {
        setUploading(true);
        imageUrls = await uploadImages(session.user.id);
      }

      const { error: listingError } = await supabase
        .from('listings')
        .insert({
          user_id: session.user.id,
          title: title.trim(),
          description: description.trim() || null,
          price: priceNum,
          category_id: categoryId,
          condition: condition || null,
          images: imageUrls,
          is_sold: false
        });

      if (listingError) throw listingError;

      // Success!
      setSuccess("Listing created successfully!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setCategoryId("");
      setCondition("");
      setImages([]);
      setImageFiles([]);
      
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      setImageFiles(prev => [...prev, file]);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-800 shadow-2xl">
        <CardHeader className="pb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-medium text-zinc-100">
              Create New Listing
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
                  multiple
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
            <Button
              className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
              type="submit"
              disabled={submitting}
            >
              {uploading ? "Uploading images..." : submitting ? "Creating..." : "Create Listing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}