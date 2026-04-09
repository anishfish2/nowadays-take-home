"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Bed,
  UtensilsCrossed,
  DoorOpen,
  FileText,
  ArrowLeft,
  TrendingUp,
  Hash,
  MapPin,
  Calendar,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface QuoteSummary {
  id: string;
  created_at: string;
  hotel_name: string | null;
  hotel_location: string | null;
  event_name: string | null;
  event_dates: string | null;
  total_quote: number | null;
  guestroom_total: number | null;
  meeting_room_total: number | null;
  food_beverage_total: number | null;
  other_total: number | null;
  all_in_total: number | null;
  confidence_score: number;
  currency: string;
  source_type: string;
  original_filename: string | null;
  warnings: Array<{ severity: string; code: string; message: string }>;
}

function formatCurrency(amount: number | null, currency: string = "USD"): string {
  if (amount === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function confidenceColor(score: number): string {
  if (score >= 0.7) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 0.4) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function sourceLabel(type: string): string {
  const labels: Record<string, string> = {
    paste_html: "HTML Paste",
    paste_text: "Text Paste",
    upload_pdf: "PDF",
    upload_html: "HTML File",
    upload_xlsx: "Excel",
  };
  return labels[type] || type;
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  delay: number;
}

function StatCard({ label, value, icon: Icon, iconBg, delay }: StatCardProps) {
  return (
    <Card
      className="border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-semibold tracking-tight mt-1">{value}</p>
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/quotes")
      .then((res) => res.json())
      .then((data) => {
        setQuotes(data.quotes || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Summary stats
  const totalQuotes = quotes.length;
  const totalValue = quotes.reduce((sum, q) => sum + (q.total_quote || 0), 0);
  const avgConfidence = totalQuotes > 0
    ? quotes.reduce((sum, q) => sum + q.confidence_score, 0) / totalQuotes
    : 0;
  const totalWarnings = quotes.reduce(
    (sum, q) => sum + (q.warnings?.filter((w) => w.severity === "error" || w.severity === "warning").length || 0),
    0
  );

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(quotes.map((q) => q.id)));
    }
    setAllExpanded(!allExpanded);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 py-10">
          {/* Back link + title */}
          <div className="flex items-center gap-3 mb-8">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Parsed Quotes</h2>
              <p className="text-sm text-muted-foreground">
                History of all parsed hotel quotes
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Loading...</div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <StatCard label="Total Quotes" value={String(totalQuotes)} icon={Hash} iconBg="text-primary bg-primary/10" delay={0} />
                <StatCard label="Total Value" value={formatCurrency(totalValue)} icon={DollarSign} iconBg="text-emerald-600 bg-emerald-50" delay={50} />
                <StatCard label="Avg Confidence" value={`${Math.round(avgConfidence * 100)}%`} icon={TrendingUp} iconBg="text-blue-600 bg-blue-50" delay={100} />
                <StatCard label="Warnings" value={String(totalWarnings)} icon={AlertTriangle} iconBg="text-amber-600 bg-amber-50" delay={150} />
              </div>

              {totalQuotes === 0 ? (
                <div className="text-center py-20">
                  <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No quotes parsed yet.</p>
                  <Link href="/" className="text-sm text-primary hover:underline mt-2 inline-block">
                    Parse your first quote
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Expand all / Collapse all */}
                  <div className="flex justify-end">
                    <button
                      onClick={toggleExpandAll}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
                    >
                      {allExpanded ? "Collapse All" : "Expand All"}
                    </button>
                  </div>

                  {quotes.map((quote, i) => (
                    <Card
                      key={quote.id}
                      className={cn(
                        "border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2",
                        expandedIds.has(quote.id) && "ring-2 ring-primary/20"
                      )}
                      style={{ animationDelay: `${200 + i * 50}ms`, animationFillMode: "backwards" }}
                      onClick={() => toggleExpand(quote.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold truncate">
                                {quote.hotel_name || "Unknown Hotel"}
                              </h3>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                                {sourceLabel(quote.source_type)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn("text-[10px] px-1.5 py-0 shrink-0", confidenceColor(quote.confidence_score))}
                              >
                                {Math.round(quote.confidence_score * 100)}%
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              {quote.hotel_location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {quote.hotel_location}
                                </span>
                              )}
                              {quote.event_dates && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {quote.event_dates}
                                </span>
                              )}
                              <span className="text-muted-foreground/50">
                                Parsed {formatDate(quote.created_at)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 shrink-0">
                            <div className="text-right">
                              <p className="text-lg font-bold tabular-nums">
                                {formatCurrency(quote.total_quote, quote.currency)}
                              </p>
                              {quote.original_filename && (
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {quote.original_filename}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleDelete(quote.id, e)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors group"
                              title="Delete quote"
                            >
                              <X className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-red-500" />
                            </button>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {expandedIds.has(quote.id) && (
                          <div className="mt-4 pt-4 border-t border-border/30 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50">
                                <Bed className="w-4 h-4 text-blue-600" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Guestrooms</p>
                                  <p className="text-sm font-semibold tabular-nums">
                                    {formatCurrency(quote.guestroom_total, quote.currency)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-50/50">
                                <DoorOpen className="w-4 h-4 text-violet-600" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Meeting</p>
                                  <p className="text-sm font-semibold tabular-nums">
                                    {formatCurrency(quote.meeting_room_total, quote.currency)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50/50">
                                <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">F&B</p>
                                  <p className="text-sm font-semibold tabular-nums">
                                    {formatCurrency(quote.food_beverage_total, quote.currency)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/50">
                                <DollarSign className="w-4 h-4 text-slate-600" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Other</p>
                                  <p className="text-sm font-semibold tabular-nums">
                                    {formatCurrency(quote.other_total, quote.currency)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {quote.warnings && quote.warnings.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {quote.warnings.map((w, j) => (
                                  <Badge
                                    key={j}
                                    variant="outline"
                                    className={cn(
                                      "text-[10px]",
                                      w.severity === "error" && "text-red-600 bg-red-50 border-red-200",
                                      w.severity === "warning" && "text-amber-600 bg-amber-50 border-amber-200",
                                      w.severity === "info" && "text-blue-600 bg-blue-50 border-blue-200"
                                    )}
                                  >
                                    {w.code}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
