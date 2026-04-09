import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const satoshi = localFont({
  src: [
    { path: "../../public/fonts/satoshi-regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/satoshi-medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/satoshi-bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-satoshi",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hotel Quote Parser | Nowadays",
  description:
    "Parse hotel quote emails and extract key financial data points for event planning.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAFA]">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
