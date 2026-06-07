"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, clearSupabaseAuth } from "@/lib/supabase";
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
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];
const strengthColors = [
  "",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
  "bg-emerald-500",
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push("/");
          return;
        }
      } catch {}
      await clearSupabaseAuth();
      setChecking(false);
    };
    checkSession();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full border-t-2 border-b-2 border-zinc-200 w-12 h-12" />
      </div>
    );
  }

  const handleAuth = async (action: "login" | "signup") => {
    setLoading(true);
    setError(null);
    try {
      if (action === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
        });
        if (signUpError) throw signUpError;
        router.push("/");
        router.refresh();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email, password,
        });
        if (signInError) throw signInError;
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="px-3 py-1 text-xs tracking-wider border-zinc-800">
              VAPOR ENGINE
            </Badge>
          </div>
          <CardTitle className="text-2xl font-medium tracking-tight text-zinc-100">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-zinc-400">
            {mode === "login"
              ? "Enter your credentials to access the marketplace."
              : "Sign up to start buying and selling."}
          </CardDescription>
        </CardHeader>

        <div className="px-6 pb-2">
          <div className="flex bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "login"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "signup"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        <CardContent className="space-y-4 pt-4">
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
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {mode === "signup" && password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i < strength ? strengthColors[strength] : "bg-zinc-800"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-zinc-500">
                  {strengthLabels[strength]} password
                </p>
              </div>
            )}
          </div>
          {mode === "login" && (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-4">
          <Button
            className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
            onClick={() => handleAuth(mode)}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : mode === "login"
                ? "Sign In"
                : "Create account"}
          </Button>
          {mode === "signup" && (
            <p className="text-xs text-zinc-500 text-center">
              By creating an account, you agree to our terms of service.
            </p>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}
