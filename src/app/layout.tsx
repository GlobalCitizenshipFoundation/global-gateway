import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionContextProvider } from "@/context/SessionContextProvider";
import { Toaster } from "@/components/ui/sonner";
import React from "react";
import { ThemeProvider } from "next-themes";
import { Header } from "@/components/layout/Header";
import { LayoutContextProvider } from "@/context/LayoutContext"; // Import LayoutContextProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Global Gateway",
  description: "A Unified Platform for Programs, Fellowships, Hiring, and Awards Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen h-full`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionContextProvider>
            <LayoutContextProvider>
              <Header /> {/* Universal Header */}
              <div className="flex flex-1 overflow-hidden"> {/* Added overflow-hidden here */}
                {children}
              </div>
            </LayoutContextProvider>
            <Toaster />
          </SessionContextProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}