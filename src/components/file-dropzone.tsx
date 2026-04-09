"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
}

export function FileDropzone({ file, onFileSelect, disabled }: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/html": [".html", ".htm"],
      "message/rfc822": [".eml"],
      "application/vnd.ms-outlook": [".msg"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
    disabled,
  });

  if (file) {
    return (
      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileSelect(null);
            }}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
            disabled={disabled}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200",
        isDragActive
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border hover:border-primary/40 hover:bg-primary/[0.02]",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
            isDragActive ? "bg-primary/10" : "bg-muted"
          )}
        >
          <Upload
            className={cn(
              "w-5 h-5 transition-colors",
              isDragActive ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {isDragActive ? "Drop your file here" : "Drop a file or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, HTML, XLSX, EML, MSG, DOCX up to 20MB
          </p>
        </div>
      </div>
    </div>
  );
}
