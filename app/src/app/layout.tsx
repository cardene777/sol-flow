import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n";

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sol-Flow - Solidity Contract Visualizer",
  description: "Visualize Solidity smart contract dependencies, inheritance structures, and function flows as interactive diagrams.",
  metadataBase: new URL("https://sol-flow.vercel.app"),
  openGraph: {
    title: "Sol-Flow - Solidity Contract Visualizer",
    description: "Visualize Solidity smart contract dependencies, inheritance structures, and function flows as interactive diagrams.",
    siteName: "Sol-Flow",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sol-Flow - Solidity Contract Visualizer",
    description: "Visualize Solidity smart contract dependencies, inheritance structures, and function flows as interactive diagrams.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
