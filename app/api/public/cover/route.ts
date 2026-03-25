import { NextRequest, NextResponse } from "next/server";

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function GET(request: NextRequest) {
  const rawTitle = request.nextUrl.searchParams.get("title") || "AI 导航";
  const title = escapeXml(rawTitle.trim().slice(0, 32) || "AI 导航");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680" viewBox="0 0 1200 680">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8f1ff"/>
      <stop offset="100%" stop-color="#ffeede"/>
    </linearGradient>
    <linearGradient id="badge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2087f4"/>
      <stop offset="100%" stop-color="#ff7a24"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="680" rx="24" fill="url(#bg)"/>
  <rect x="70" y="70" width="220" height="220" rx="28" fill="url(#badge)"/>
  <text x="180" y="195" text-anchor="middle" font-size="86" font-family="Arial, sans-serif" fill="#fff" font-weight="700">AI</text>
  <text x="70" y="390" font-size="74" font-family="Arial, sans-serif" fill="#1f2737" font-weight="700">${title}</text>
  <text x="70" y="450" font-size="28" font-family="Arial, sans-serif" fill="#6d7688">Auto Generated Cover</text>
  <text x="70" y="500" font-size="22" font-family="Arial, sans-serif" fill="#6d7688">nav.lengziyu.cn</text>
</svg>
`.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
