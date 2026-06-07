"use client";

import { useState, useEffect } from "react";
import { supabase, clearSupabaseAuth } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Heart, Package } from "lucide-react";
import { Avatar } from "@/components/avatar";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [tab, setTab] = useState<"listings" | "favorites">("listings");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) { await clearSupabaseAuth(); router.push("/login"); return; }
        setUser(session.user);

        // All three queries are independent — run in parallel
        const [{ data: profileData }, { data: listingsData }, { data: favsData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", session.user.id).single(),
          supabase.from("listings").select("*, categories(name)").eq("user_id", session.user.id).order("created_at", { ascending: false }),
          supabase.from("favorites").select("*, listings!inner(*, categories!inner(name))").eq("user_id", session.user.id),
        ]);

        setProfile(profileData);
        if (profileData) {
          setFullName(profileData.full_name || "");
          setBio(profileData.bio || "");
          setLocation(profileData.location || "");
          setWebsite(profileData.website || "");
        }
        setListings(listingsData || []);
        setFavorites(favsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const saveProfile = async () => {
    setSaving(true);
    let avatarUrl = profile?.avatar_url;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      avatarUrl = publicUrl;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      bio,
      location,
      website,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    });
    setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
    setSaving(false);
    setEditing(false);
    setAvatarFile(null);
  };

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
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push("/")} className="text-zinc-400 hover:text-zinc-200">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button variant="ghost" onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} className="text-zinc-400 hover:text-zinc-200">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar src={profile?.avatar_url} size={16} />
                <div>
                  <CardTitle className="text-zinc-100 text-xl">{profile?.full_name || "Unnamed User"}</CardTitle>
                  <p className="text-zinc-500 text-sm">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setEditing(!editing)}>
                {editing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="relative cursor-pointer group">
                    <Avatar src={avatarFile ? URL.createObjectURL(avatarFile) : profile?.avatar_url} size={16} />
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-zinc-200 font-medium">Change</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  <div>
                    <p className="text-zinc-300 text-sm font-medium">{user?.email}</p>
                    <p className="text-zinc-500 text-xs">Click avatar to change photo</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Full Name</label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    className="w-full bg-zinc-800 border-zinc-700 rounded-md px-3 py-2 text-zinc-200 resize-y" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Location</label>
                    <Input value={location} onChange={e => setLocation(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Website</label>
                    <Input value={website} onChange={e => setWebsite(e.target.value)} className="bg-zinc-800 border-zinc-700 text-zinc-200" />
                  </div>
                </div>
                <Button onClick={saveProfile} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 text-zinc-400">
                {profile?.bio && <p>{profile.bio}</p>}
                {profile?.location && <p>📍 {profile.location}</p>}
                {profile?.website && <p>🔗 {profile.website}</p>}
                {!profile?.bio && !profile?.location && !profile?.website && (
                  <p className="text-zinc-600">No profile info yet.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 mb-6">
          <Button variant={tab === "listings" ? "default" : "outline"} onClick={() => setTab("listings")}>
            <Package className="h-4 w-4 mr-2" /> My Listings ({listings.length})
          </Button>
          <Button variant={tab === "favorites" ? "default" : "outline"} onClick={() => setTab("favorites")}>
            <Heart className="h-4 w-4 mr-2" /> Favorites ({favorites.length})
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(tab === "listings" ? listings : favorites.map((f: any) => f.listings).filter(Boolean)).map((item: any) => (
            <div key={item.id} className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
              onClick={() => router.push(`/listings/${item.id}`)}>
              <div className="aspect-video bg-zinc-800 flex items-center justify-center">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} className="object-cover w-full h-full" />
                ) : (
                  <div className="text-zinc-600 text-sm">No image</div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    item.is_sold ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                  }`}>{item.is_sold ? "SOLD" : "ACTIVE"}</span>
                  <span className="text-xs text-zinc-500">{item.categories?.name}</span>
                </div>
                <h3 className="text-zinc-200 font-medium truncate">{item.title}</h3>
                <p className="text-zinc-100 font-bold mt-1">${Number(item.price).toFixed(2)}</p>
              </div>
            </div>
          ))}
          {(tab === "listings" ? listings : favorites).length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">
              {tab === "listings" ? "You haven't created any listings yet." : "No favorites yet."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
