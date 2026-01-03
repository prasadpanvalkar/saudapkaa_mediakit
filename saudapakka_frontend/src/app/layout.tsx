import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Load the font
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SaudaPakka | 100% Verified Real Estate",
  description: "Find your perfect home with confidence. 100% verified listings, zero hassle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased text-gray-900 bg-white`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}