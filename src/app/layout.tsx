import Script from "next/script";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FounderCal.org — Accelerator Deadline Calendar",
    template: "%s | FounderCal.org",
  },
  description:
    "FounderCal.org surfaces active startup accelerators, fellowships, grants, and demo days across AI, climate, crypto, frontier tech, and more.",
  keywords: [
    "accelerator deadlines",
    "startup accelerator calendar",
    "founder opportunities",
    "ai accelerator application dates",
    "crypto accelerator 2025",
    "crypto accelerator 2026",
    "founder fellowship timeline",
    "demo day schedule",
    "grant programs for startups",
  ],
  openGraph: {
    title: "FounderCal.org — Accelerator Deadline Calendar",
    description:
      "Track accelerator deadlines, fellowships, and funding programs across every region with FounderCal.org.",
    url: "https://foundercal.org/",
    siteName: "FounderCal.org",
    images: [
      {
        url: "https://foundercal.org/og-image.png",
        width: 1200,
        height: 630,
        alt: "FounderCal.org calendar preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FounderCal.org — Accelerator Deadline Calendar",
    description:
      "Never miss accelerator deadlines, fellowships, or demo days. FounderCal.org keeps every program on one calendar.",
    site: "@Web3Igor",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-V0KK1KZQG7"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-V0KK1KZQG7');
          `}
        </Script>
        {children}
        <Analytics/>
      </body>
    </html>
  );
}
