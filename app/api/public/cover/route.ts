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
  const rawTitle = request.nextUrl.searchParams.get("title") || "AI 前沿导航";
  const title = escapeXml(rawTitle.trim().slice(0, 32) || "AI 前沿导航");

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680" viewBox="0 0 1200 680">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060b18"/>
      <stop offset="55%" stop-color="#0f1832"/>
      <stop offset="100%" stop-color="#1b0f2f"/>
    </linearGradient>
    <radialGradient id="glowBlue" cx="0.15" cy="0.2" r="0.9">
      <stop offset="0%" stop-color="#2b9dff" stop-opacity="0.58"/>
      <stop offset="100%" stop-color="#2b9dff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="glowPurple" cx="0.82" cy="0.75" r="0.75">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="680" rx="24" fill="url(#bg)"/>
  <rect width="1200" height="680" rx="24" fill="url(#glowBlue)"/>
  <rect width="1200" height="680" rx="24" fill="url(#glowPurple)"/>

  <g opacity="0.2" stroke="#7cc8ff" stroke-width="1">
    <path d="M80 540 L410 270 L780 510 L1120 220" fill="none"/>
    <path d="M40 600 L360 360 L730 580 L1130 340" fill="none"/>
    <path d="M120 440 L420 200 L760 420 L1080 170" fill="none"/>
  </g>

  <rect x="92" y="84" width="1016" height="512" rx="28" fill="rgba(6, 11, 24, 0.35)" stroke="rgba(132, 173, 255, 0.28)"/>
  <text x="600" y="300" text-anchor="middle" font-size="88" font-family="Arial, sans-serif" fill="#f2f7ff" font-weight="700">${title}</text>
  <text x="600" y="362" text-anchor="middle" font-size="26" font-family="Arial, sans-serif" fill="#9fc0ff" letter-spacing="4">AI FRONTIER TECH RADAR</text>
  <text x="600" y="412" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#95a5c8">nav.lengziyu.cn</text>
</svg>
`.trim();

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
