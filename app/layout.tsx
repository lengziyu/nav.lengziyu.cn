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
  title: "AI 前沿导航",
  description: "聚焦最新模型、Agent、工具与前沿趋势的 AI 技术导航站",
  icons: {
    icon: "/ai-nav-logo.svg",
    shortcut: "/ai-nav-logo.svg",
    apple: "/ai-nav-logo.svg",
  },
};

const themeBootScript = `
(() => {
  try {
    const storageKey = "nav-theme";
    const savedTheme = window.localStorage.getItem(storageKey);
    const theme = savedTheme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${notoSansSc.variable} ${spaceGrotesk.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
