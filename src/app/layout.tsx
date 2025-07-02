import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// import { Inter } from "next/font/google"; // Old import
import { inter } from "@/lib/fonts"; // New import for local Inter
import { UserProvider } from "@/contexts/UserContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { NavigationBar } from "@/components/NavigationBar";
import { OnboardingDebugPanel } from "@/components/OnboardingDebugPanel";
import { AuthDebugPanel } from "@/components/AuthDebugPanel";
import { PageViewLogger } from "@/components/PageViewLogger";
import { getServerConfig } from "@/lib/server-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// const inter = Inter({ subsets: ["latin"] }); // Old initialization

export const metadata: Metadata = {
  title: "LitBench - Writing Evaluation Arena",
  description: "Benchmark and dataset for automated creative writing evaluation, featuring thousands of pairwise, human-labeled story comparisons",
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#da532c',
    'msapplication-config': '/browserconfig.xml'
  }
};

export function generateViewport(): Viewport {
  return {
    themeColor: '#ffffff'
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = getServerConfig();
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${inter.className} antialiased`}
      >
        <ToastProvider>
          <UserProvider>
            <PageViewLogger />
            <main className="min-h-screen p-4 sm:p-6 lg:p-8">
              {!config.features.mvpMode && <NavigationBar />}
              {children}
            </main>
              {config.app.debugMode && (
              <>
                <OnboardingDebugPanel />
                <AuthDebugPanel />
              </>
            )}
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
