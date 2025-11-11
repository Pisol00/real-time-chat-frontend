import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "thai"],
  variable: "--font-sarabun",
});

export const metadata: Metadata = {
  title: "RealTime Chat",
  description: "แอปพลิเคชันแชทแบบเรียลไทม์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
