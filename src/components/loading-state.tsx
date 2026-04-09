"use client";

import { Sparkles } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-primary animate-pulse" />
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-primary/5 animate-ping opacity-75" />
      </div>
      <p className="mt-6 text-lg font-medium text-foreground">
        Analyzing quote...
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Extracting financial data from your document
      </p>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary/40 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
