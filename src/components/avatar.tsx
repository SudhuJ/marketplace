"use client";

import { useState } from "react";
import { User } from "lucide-react";

type Props = {
  src?: string | null;
  alt?: string;
  size?: number;
  className?: string;
};

export function Avatar({ src, alt = "", size = 10, className = "" }: Props) {
  const [error, setError] = useState(false);
  const dim = size * 4;

  if (src && !error) {
    return (
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className={`rounded-full object-cover bg-zinc-700 flex-shrink-0 ${className}`}
        style={{ width: dim, height: dim }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 flex-shrink-0 ${className}`}
      style={{ width: dim, height: dim }}
    >
      <User size={size * 2} />
    </div>
  );
}
