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
            width={36}
            height={36}
            className="rounded-lg"
          />
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
