import type { Metadata } from "next";
import { Noto_Sans_SC, Space_Grotesk } from "next/font/google";

import "./globals.css";

const notoSansSc = Noto_Sans_SC({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI 与前端导航",
  description: "支持投稿审核和后台管理的开源导航站",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${notoSansSc.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
