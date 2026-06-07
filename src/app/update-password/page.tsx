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
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await clearSupabaseAuth();
        router.push("/login");
        return;
      }
      setChecking(false);
    };
    checkSession();
  }, [router]);

  const strength = getPasswordStrength(password);
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleUpdate = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full border-t-2 border-b-2 border-zinc-200 w-12 h-12" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="px-3 py-1 text-xs tracking-wider border-zinc-800">
              VAPOR ENGINE
            </Badge>
          </div>
          {success ? (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
              <CardTitle className="text-2xl font-medium tracking-tight text-zinc-100">
                Password updated
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Redirecting to marketplace...
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-medium tracking-tight text-zinc-100">
                Update password
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Enter your new password.
              </CardDescription>
            </>
          )}
        </CardHeader>
        {!success && (
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
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
              {password.length > 0 && (
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
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-200"
              />
              {mismatch && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>
          </CardContent>
        )}
        {!success && (
          <CardFooter className="flex flex-col space-y-3 pt-4">
            <Button
              className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
              onClick={handleUpdate}
              disabled={loading || !password || !confirmPassword || mismatch}
            >
              {loading ? "Updating..." : "Update password"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
