"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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

  // Helper to check if we're using mock Supabase
  const useMockSupabase = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return supabaseUrl.includes("127.0.0.1:54321");
  };

  // Clear mock session helper
  const clearMockSession = () => {
    // In mock mode, we just reset the mockUser in supabase client
    // Since we can't directly access it, we'll sign out which does the same
    supabase.auth.signOut();
  };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear any invalid session on mount
  // This helps with the "Invalid Refresh Token" error
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const clearInvalidSession = async () => {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        // Ignore errors during signOut
      }
    };
    
    // Clear session on initial load to avoid invalid token issues
    clearInvalidSession();
  }, []);

  const handleAuth = async (action: "login" | "signup") => {
    setLoading(true);
    setError(null);

    try {
      if (action === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        
        // For mock Supabase, simulate email confirmation
        if (useMockSupabase()) {
          alert("Mock sign up successful! In a real app, check your email for confirmation.");
          // Auto-login for demo purposes in mock mode - session is handled automatically
          router.push("/");
          router.refresh();
        } else {
          alert(
            "Check your email for the confirmation link! (In local dev, check the terminal)",
          );
        }
      } else {
        const { error: signInError, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;

        // Success! Redirect to the marketplace grid
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      // Handle specific Supabase auth errors
      if (err.message?.includes("Invalid Refresh Token")) {
        // Clear the invalid session and try again
        await supabase.auth.signOut();
        clearMockSession();
        setError("Your session has expired. Please try logging in again.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <Badge
              variant="secondary"
              className="px-3 py-1 text-xs tracking-wider border-zinc-800"
            >
              VAPOR ENGINE
            </Badge>
          </div>
          <CardTitle className="text-2xl font-medium tracking-tight text-zinc-100">
            Welcome back
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Enter your credentials to access the marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200"
            />
          </div>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 pt-4">
          <Button
            className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
            onClick={() => handleAuth("login")}
            disabled={loading}
          >
            {loading ? "Processing..." : "Sign In"}
          </Button>
          <Button
            variant="outline"
            className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
            onClick={() => handleAuth("signup")}
            disabled={loading}
          >
            Create an account
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}