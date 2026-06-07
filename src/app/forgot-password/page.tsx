"use client";

import { useState } from "react";
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
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="flex justify-center mb-4">
            <Badge variant="secondary" className="px-3 py-1 text-xs tracking-wider border-zinc-800">
              VAPOR ENGINE
            </Badge>
          </div>
          {sent ? (
            <>
              <div className="flex justify-center">
                <CheckCircle2 className="h-12 w-12 text-green-400" />
              </div>
              <CardTitle className="text-2xl font-medium tracking-tight text-zinc-100">
                Check your email
              </CardTitle>
              <CardDescription className="text-zinc-400">
                We&apos;ve sent a password reset link to <strong className="text-zinc-200">{email}</strong>
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-2xl font-medium tracking-tight text-zinc-100">
                Reset password
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Enter your email and we&apos;ll send you a recovery link.
              </CardDescription>
            </>
          )}
        </CardHeader>
        {!sent && (
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
          </CardContent>
        )}
        <CardFooter className="flex flex-col space-y-3 pt-4">
          {sent ? (
            <Button
              variant="outline"
              className="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
              onClick={() => setSent(false)}
            >
              Send again
            </Button>
          ) : (
            <Button
              className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium"
              onClick={handleReset}
              disabled={loading || !email}
            >
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          )}
          <Link
            href="/login"
            className="inline-flex items-center justify-center text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
