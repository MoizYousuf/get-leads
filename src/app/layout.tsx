import type { Metadata } from "next";
import HeaderNav from "@/components/HeaderNav";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

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
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900" suppressHydrationWarning>
        <ToastProvider>
          <HeaderNav />

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5">
            {children}
          </main>

          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-550">
            &copy; {new Date().getFullYear()} Khanani Innovations. All rights reserved.
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
