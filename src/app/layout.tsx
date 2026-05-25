import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "House Job Application 2026-27",
  description:
    "Application form for House Job - Allied Hospital-I / II & FTH, Faisalabad",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
