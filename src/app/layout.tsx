import type { Metadata } from "next";
import { Geist, Geist_Mono, Urbanist } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from "@/lib/privy";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Isaura",  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${urbanist.variable} antialiased`}
      >
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
