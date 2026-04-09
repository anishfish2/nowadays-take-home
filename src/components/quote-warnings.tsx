"use client";

import { XCircle, AlertTriangle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Warning } from "@/types";
import { cn } from "@/lib/utils";

const severityConfig = {
  error: {
    icon: XCircle,
    bg: "bg-red-50/50 border-red-200/50",
    iconColor: "text-red-500",
    badgeClass: "text-red-700 bg-red-100 border-red-200",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50/50 border-amber-200/50",
    iconColor: "text-amber-500",
    badgeClass: "text-amber-700 bg-amber-100 border-amber-200",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50/50 border-blue-200/50",
    iconColor: "text-blue-500",
    badgeClass: "text-blue-700 bg-blue-100 border-blue-200",
  },
};

interface QuoteWarningsProps {
  warnings: Warning[];
}

export function QuoteWarnings({ warnings }: QuoteWarningsProps) {
  if (warnings.length === 0) return null;

  // Sort: errors first, then warnings, then info
  const sorted = [...warnings].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-2 animate-in fade-in duration-300">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Flags & Suggestions
      </p>
      {sorted.map((warning, i) => {
        const config = severityConfig[warning.severity];
        const Icon = config.icon;
        return (
          <div
            key={i}
            className={cn(
              "flex gap-3 p-3 rounded-xl border text-sm",
              config.bg
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", config.iconColor)} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0 font-mono", config.badgeClass)}
                >
                  {warning.code}
                </Badge>
              </div>
              <p className="text-foreground/80">{warning.message}</p>
              {warning.details && (
                <p className="text-xs text-muted-foreground mt-1">
                  {warning.details}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
