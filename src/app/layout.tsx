import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import HeaderNav from "@/components/HeaderNav";
import PageTransition from "@/components/PageTransition";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Khanani Innovations - Lead Sender",
  description: "Send and track client outreach emails and leads with Resend.",
  icons: {
    icon: "/logo/Logo-white.png",
    shortcut: "/logo/Logo-white.png",
    apple: "/logo/Logo-white.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Khanani Leads",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900" suppressHydrationWarning>
        <ToastProvider>
          <HeaderNav />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-5">
            <PageTransition>{children}</PageTransition>
          </main>

          <footer className="hidden md:block border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-550">
            &copy; {new Date().getFullYear()} Khanani Innovations. All rights reserved.
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
