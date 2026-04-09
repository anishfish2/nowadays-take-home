"use client";

import {
  Bed,
  DoorOpen,
  UtensilsCrossed,
  Receipt,
  DollarSign,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  ChevronDown,
  Eye,
  Shield,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuoteWarnings } from "@/components/quote-warnings";
import type { ParsedQuote, LineItem, ContractTerms } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

function formatCurrency(amount: number | null | undefined, currency: string = "USD"): string {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function confidenceColor(score: number): string {
  if (score >= 0.7) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 0.4) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function confidenceLabel(score: number): string {
  if (score >= 0.7) return "High confidence";
  if (score >= 0.4) return "Medium confidence";
  return "Low confidence";
}

const categoryConfig = {
  guestroom: {
    label: "Guestrooms",
    icon: Bed,
    color: "text-blue-600 bg-blue-50",
  },
  meeting_room: {
    label: "Meeting Rooms",
    icon: DoorOpen,
    color: "text-violet-600 bg-violet-50",
  },
  food_beverage: {
    label: "Food & Beverage",
    icon: UtensilsCrossed,
    color: "text-orange-600 bg-orange-50",
  },
  other: {
    label: "Other",
    icon: Receipt,
    color: "text-slate-600 bg-slate-50",
  },
};

interface TotalCardProps {
  label: string;
  amount: number | null;
  allInAmount?: number | null;
  icon: React.ElementType;
  iconBg: string;
  currency: string;
  delay: number;
  showEnhanced: boolean;
}

function TotalCard({ label, amount, allInAmount, icon: Icon, iconBg, currency, delay, showEnhanced }: TotalCardProps) {
  const showAllIn = showEnhanced && allInAmount && allInAmount !== amount;
  return (
    <Card
      className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-2xl font-semibold tracking-tight mt-1">
              {formatCurrency(amount, currency)}
            </p>
            {showAllIn && (
              <p className="text-xs text-muted-foreground mt-0.5">
                All-in: {formatCurrency(allInAmount, currency)}
              </p>
            )}
          </div>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractTermsSection({ terms, currency }: { terms: ContractTerms; currency: string }) {
  const [expanded, setExpanded] = useState(false);

  const hasContent =
    terms.attrition_percentage !== null ||
    terms.cancellation_tiers.length > 0 ||
    terms.decision_deadline ||
    terms.commission_percentage !== null ||
    terms.minimum_spend !== null;

  if (!hasContent) return null;

  return (
    <div className="animate-in fade-in duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <Shield className="w-4 h-4" />
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
        Contract Terms
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {terms.attrition_percentage !== null && (
              <div className="p-3 rounded-xl bg-white border border-border/50">
                <p className="text-xs text-muted-foreground">Attrition</p>
                <p className="text-sm font-semibold">{terms.attrition_percentage}%</p>
              </div>
            )}
            {terms.commission_percentage !== null && (
              <div className="p-3 rounded-xl bg-white border border-border/50">
                <p className="text-xs text-muted-foreground">Commission</p>
                <p className="text-sm font-semibold">{terms.commission_percentage}%</p>
              </div>
            )}
            {terms.minimum_spend !== null && (
              <div className="p-3 rounded-xl bg-white border border-border/50">
                <p className="text-xs text-muted-foreground">Min Spend</p>
                <p className="text-sm font-semibold">{formatCurrency(terms.minimum_spend, currency)}</p>
              </div>
            )}
            {terms.decision_deadline && (
              <div className="p-3 rounded-xl bg-white border border-border/50">
                <p className="text-xs text-muted-foreground">Deadline</p>
                <p className="text-sm font-semibold">{terms.decision_deadline}</p>
              </div>
            )}
          </div>

          {terms.cancellation_tiers.length > 0 && (
            <div className="p-3 rounded-xl bg-white border border-border/50">
              <p className="text-xs text-muted-foreground mb-2">Cancellation Schedule</p>
              <div className="space-y-1">
                {terms.cancellation_tiers.map((tier, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{tier.days_before_event} days</span>
                    <span className="font-medium">{tier.penalty_percentage}% penalty</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface QuoteResultsProps {
  quote: ParsedQuote;
}

export function QuoteResults({ quote }: QuoteResultsProps) {
  const [showLineItems, setShowLineItems] = useState(false);
  const [showEnhanced, setShowEnhanced] = useState(false);

  const hasEnhancedData =
    (quote.warnings && quote.warnings.length > 0) ||
    quote.contract_terms !== null ||
    (quote.options && quote.options.length > 0) ||
    quote.all_in_total !== null ||
    quote.line_items.some((item) => item.waived || item.all_in_amount);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with hotel info + confidence */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          {quote.hotel_name && (
            <h2 className="text-xl font-semibold tracking-tight">
              {quote.hotel_name}
            </h2>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {quote.hotel_location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {quote.hotel_location}
              </span>
            )}
            {quote.event_dates && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {quote.event_dates}
              </span>
            )}
            {quote.contact_name && (
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                {quote.contact_name}
              </span>
            )}
          </div>
          {quote.event_name && (
            <p className="text-sm text-muted-foreground">{quote.event_name}</p>
          )}
        </div>
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-xs font-medium",
            confidenceColor(quote.confidence_score)
          )}
        >
          {confidenceLabel(quote.confidence_score)} ({Math.round(quote.confidence_score * 100)}%)
        </Badge>
      </div>

      {/* Grand total */}
      {quote.total_quote !== null && (
        <Card
          className="border-primary/20 bg-primary/[0.03] shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
          style={{ animationDelay: "50ms", animationFillMode: "backwards" }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">
                  Total Quote
                </p>
                <p className="text-3xl font-bold tracking-tight mt-1 text-foreground">
                  {formatCurrency(quote.total_quote, quote.currency)}
                </p>
                {showEnhanced && quote.all_in_total && quote.all_in_total !== quote.total_quote && (
                  <p className="text-sm text-muted-foreground mt-1">
                    All-in estimate: {formatCurrency(quote.all_in_total, quote.currency)}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category totals grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TotalCard
          label="Guestrooms"
          amount={quote.guestroom_total}
          icon={Bed}
          iconBg="text-blue-600 bg-blue-50"
          currency={quote.currency}
          delay={100}
          showEnhanced={showEnhanced}
        />
        <TotalCard
          label="Meeting Rooms"
          amount={quote.meeting_room_total}
          icon={DoorOpen}
          iconBg="text-violet-600 bg-violet-50"
          currency={quote.currency}
          delay={150}
          showEnhanced={showEnhanced}
        />
        <TotalCard
          label="Food & Beverage"
          amount={quote.food_beverage_total}
          icon={UtensilsCrossed}
          iconBg="text-orange-600 bg-orange-50"
          currency={quote.currency}
          delay={200}
          showEnhanced={showEnhanced}
        />
        <TotalCard
          label="Other Costs"
          amount={quote.other_total}
          icon={Receipt}
          iconBg="text-slate-600 bg-slate-50"
          currency={quote.currency}
          delay={250}
          showEnhanced={showEnhanced}
        />
      </div>

      {/* Line items */}
      {quote.line_items.length > 0 && (
        <div className="animate-in fade-in duration-500" style={{ animationDelay: "300ms", animationFillMode: "backwards" }}>
          <button
            onClick={() => setShowLineItems(!showLineItems)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                showLineItems && "rotate-180"
              )}
            />
            {showLineItems ? "Hide" : "Show"} line items ({quote.line_items.length})
          </button>

          {showLineItems && (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {quote.line_items.map((item: LineItem, i: number) => {
                const config = categoryConfig[item.category];
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-border/50"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          config.color
                        )}
                      >
                        <config.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{item.description}</p>
                          {showEnhanced && item.waived && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 bg-emerald-50 border-emerald-200 shrink-0">
                              Waived
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config.label}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatCurrency(item.amount, quote.currency)}
                      </p>
                      {showEnhanced && item.all_in_amount && item.all_in_amount !== item.amount && (
                        <p className="text-xs text-muted-foreground tabular-nums">
                          All-in: {formatCurrency(item.all_in_amount, quote.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {quote.notes && (
        <div
          className="flex gap-3 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50 animate-in fade-in duration-500"
          style={{ animationDelay: "350ms", animationFillMode: "backwards" }}
        >
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Parser Notes</p>
            <p className="text-sm text-amber-700 mt-1 whitespace-pre-wrap">
              {quote.notes}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Analysis Toggle */}
      {hasEnhancedData && (
        <div className="pt-2 border-t border-border/30">
          <button
            onClick={() => setShowEnhanced(!showEnhanced)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              showEnhanced
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Eye className="w-4 h-4" />
            {showEnhanced ? "Hide" : "Show"} Enhanced Analysis
          </button>
        </div>
      )}

      {/* Enhanced sections — only visible when toggled on */}
      {showEnhanced && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Contract Terms */}
          {quote.contract_terms && (
            <ContractTermsSection terms={quote.contract_terms} currency={quote.currency} />
          )}

          {/* Options */}
          {quote.options && quote.options.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="w-4 h-4" />
                Alternative Options ({quote.options.length})
              </div>
              {quote.options.map((option, i) => (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold mb-2">{option.option_name}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-medium">{formatCurrency(option.total, quote.currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Rooms: </span>
                        <span className="font-medium">{formatCurrency(option.guestroom_total, quote.currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Meeting: </span>
                        <span className="font-medium">{formatCurrency(option.meeting_room_total, quote.currency)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">F&B: </span>
                        <span className="font-medium">{formatCurrency(option.food_beverage_total, quote.currency)}</span>
                      </div>
                    </div>
                    {option.notes && (
                      <p className="text-xs text-muted-foreground mt-2">{option.notes}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Warnings */}
          {quote.warnings && quote.warnings.length > 0 && (
            <QuoteWarnings warnings={quote.warnings} />
          )}
        </div>
      )}
    </div>
  );
}
