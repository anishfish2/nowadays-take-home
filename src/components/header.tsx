"use client";

import { FileText } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Quote Parser
            </h1>
            <p className="text-xs text-muted-foreground -mt-0.5">by Nowadays</p>
          </div>
        </div>
      </div>
    </header>
  );
}
