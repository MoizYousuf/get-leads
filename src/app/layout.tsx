import type { Metadata } from "next";
import { Inter } from "next/font/google";
import HeaderNav from "@/components/HeaderNav";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Khanani Innovations - Lead Sender",
  description: "Send and track client outreach emails and leads with Resend.",
  icons: {
    icon: "/logo/Logo-white.png",
    shortcut: "/logo/Logo-white.png",
    apple: "/logo/Logo-white.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans" suppressHydrationWarning>
        <HeaderNav />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5">
          {children}
        </main>

        <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Khanani Innovations. All rights reserved.
        </footer>
      </body>
    </html>
  );
}
