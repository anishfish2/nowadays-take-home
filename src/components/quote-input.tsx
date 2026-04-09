"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/file-dropzone";
import { Sparkles, ClipboardPaste, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteInputProps {
  onParse: (data: { content?: string; file?: File; inputType: string }) => void;
  isLoading: boolean;
}

export function QuoteInput({ onParse, isLoading }: QuoteInputProps) {
  const [activeTab, setActiveTab] = useState("paste");
  const [pastedContent, setPastedContent] = useState("");
  const [inputType, setInputType] = useState<"html" | "text">("html");
  const [file, setFile] = useState<File | null>(null);

  const canSubmit = activeTab === "paste" ? pastedContent.trim().length > 0 : file !== null;

  const handleSubmit = () => {
    if (!canSubmit || isLoading) return;

    if (activeTab === "paste") {
      onParse({ content: pastedContent, inputType });
    } else {
      onParse({ file: file!, inputType: "file" });
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50 rounded-xl p-1">
          <TabsTrigger
            value="paste"
            className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
          >
            <ClipboardPaste className="w-4 h-4" />
            Paste Content
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="rounded-lg text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="mt-4 space-y-3">
          {/* HTML/Text toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Format:</span>
            <div className="flex rounded-lg bg-muted/50 p-0.5">
              {(["html", "text"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setInputType(type)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all",
                    inputType === type
                      ? "bg-white shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {type === "html" ? "HTML" : "Plain Text"}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder={
              inputType === "html"
                ? "Paste the hotel quote email HTML here..."
                : "Paste the hotel quote email text here..."
            }
            value={pastedContent}
            onChange={(e) => setPastedContent(e.target.value)}
            className="min-h-[280px] rounded-2xl border-border bg-white resize-y text-sm leading-relaxed p-4 focus-visible:ring-primary/30"
            disabled={isLoading}
          />
        </TabsContent>

        <TabsContent value="upload" className="mt-4">
          <FileDropzone file={file} onFileSelect={setFile} disabled={isLoading} />
        </TabsContent>
      </Tabs>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || isLoading}
        className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-40"
        size="lg"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Parse Quote
      </Button>
    </div>
  );
}
