import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { BarterProvider } from "@/lib/store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastDismissWrapper } from "@/components/ui/toast-dismiss-wrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "BARTER-X | Trade What You Have. Get What You Want.",
  description:
    "The world's first smart exchange platform. No money needed. Create offers, connect with others, and let our engine find perfect multi-party trades.",
  manifest: "/manifest.json",
  openGraph: {
    title: "BARTER-X | Trade What You Have. Get What You Want.",
    description: "The world's first smart exchange platform. No money needed. Create offers, connect with others, and let our engine find perfect multi-party trades.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BARTER-X | Trade What You Have. Get What You Want.",
    description: "The world's first smart exchange platform. No money needed.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <BarterProvider>
            <ToastDismissWrapper>
              {children}
            </ToastDismissWrapper>
            <Toaster
              theme="dark"
              position="top-center"
              toastOptions={{
                style: {
                  background: "hsl(0 0% 9%)",
                  border: "1px solid hsl(0 0% 14%)",
                  color: "hsl(0 0% 96%)",
                },
                className: "cursor-pointer",
              }}
            />
          </BarterProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
