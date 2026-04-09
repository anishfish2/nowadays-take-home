"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { QuoteInput } from "@/components/quote-input";
import { QuoteResults } from "@/components/quote-results";
import { LoadingState } from "@/components/loading-state";
import { toast } from "sonner";
import type { ParsedQuote } from "@/types";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ParsedQuote | null>(null);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async (data: {
    content?: string;
    file?: File;
    inputType: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setPageImages([]);

    try {
      const formData = new FormData();

      if (data.file) {
        formData.append("file", data.file);
      } else if (data.content) {
        formData.append("content", data.content);
        formData.append("inputType", data.inputType);
      }

      const response = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to parse quote");
      }

      setResult(json.quote);
      setPageImages(json.pageImages || []);
      toast.success("Quote parsed successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Hero section */}
          <div className="text-center mb-10 pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-white text-sm text-muted-foreground mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              AI-Powered Extraction
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Hotel Quote Parser
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Paste an email or upload a document to instantly extract pricing
              details from hotel quotes.
            </p>
          </div>

          {/* Input section */}
          <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6">
            <QuoteInput onParse={handleParse} isLoading={isLoading} />
          </div>

          {/* Results section */}
          <div className="mt-8">
            {isLoading && <LoadingState />}

            {error && !isLoading && (
              <div className="text-center py-12 animate-in fade-in duration-300">
                <p className="text-sm text-destructive">{error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please try again or use a different format.
                </p>
              </div>
            )}

            {result && !isLoading && (
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6">
                <QuoteResults quote={result} pageImages={pageImages} />
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
