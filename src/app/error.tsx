"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 rounded-full bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-2xl">!</span>
        </div>
        <h2 className="text-xl font-medium text-zinc-100 mb-2">
          Something went wrong
        </h2>
        <p className="text-zinc-500 text-sm mb-6">
          {error.message || "The application failed to load."}
        </p>
        <Button
          onClick={reset}
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
