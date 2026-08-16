import type { Metadata, Viewport } from "next";
import { Open_Sans, Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

const SITE_URL = "https://hj-seven-alpha.vercel.app";
const TITLE = "House Job Application 2026-27 | Allied Hospital, Faisalabad";
const DESCRIPTION =
  "Online application form for House Job, Annual Session 2026-2027 - Allied Hospital-I / II & FTH, Faisalabad. Apply online and download your application as a PDF.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | House Job Application",
  },
  description: DESCRIPTION,
  applicationName: "House Job Application Portal",
  keywords: [
    "House Job",
    "House Job Application 2026",
    "Allied Hospital Faisalabad",
    "FTH Faisalabad",
    "Faisalabad Medical University",
    "FMU",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "House Job Application Portal",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
  verification: {
    google: "cuo6CYzs7K9fTAn9ZAapJ7tV24DmVqaItlaRbk6OQJM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05125c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${openSans.variable} ${manrope.variable}`}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
