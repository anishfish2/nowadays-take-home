"use client";

import Image from "next/image";

export function Header() {
  return (
    <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/nowadays-icon.svg"
            alt="Nowadays"
            width={208}
            height={57}
            className="h-10 w-auto"
            priority
          />
          <span className="text-border">|</span>
          <span className="text-sm font-medium text-muted-foreground tracking-tight">
            Quote Parser
          </span>
        </div>
      </div>
    </header>
  );
}
