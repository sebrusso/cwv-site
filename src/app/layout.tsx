import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// import { Inter } from "next/font/google"; // Old import
import { inter } from "@/lib/fonts"; // New import for local Inter
import { UserProvider } from "@/contexts/UserContext";
import { NavigationBar } from "@/components/NavigationBar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  title: "Writing Evaluation Arena",
  description: "Evaluate writing quality from humans and AI models",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${inter.className} antialiased`}
      >
        <ErrorBoundary>
          <UserProvider>
            <main className="min-h-screen p-4 sm:p-6 lg:p-8">
              <NavigationBar />
              {children}
            </main>
          </UserProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
