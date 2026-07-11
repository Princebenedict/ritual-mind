import type {Metadata, Viewport} from "next";
// @ts-ignore
import "./globals.css";
import {Providers} from "./providers";
import {Shell} from "@/components/layout/shell";
import AmbientBackground from "@/components/AmbientBackground";

export const metadata: Metadata = {
  title: {default: "Ritual Mind", template: "%s · Ritual Mind"},
  description:
    "The reputation and intelligence layer for Ritual Chain. Every wallet becomes a scored identity, recomputed inside a trusted execution environment and attested on chain.",
  applicationName: "Ritual Mind",
  metadataBase: new URL("https://ritualmind.xyz"),
};

export const viewport: Viewport = {
  themeColor: "#07151C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fonts load at runtime in the browser. The build stays hermetic and falls back
            to a system stack if the fonts cannot be reached. Two weights only per family. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg-base font-sans text-ink antialiased">
        <AmbientBackground />
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
