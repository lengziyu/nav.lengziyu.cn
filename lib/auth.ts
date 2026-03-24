import { createHash, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "nav_admin_session";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "admin123";
}

function buildToken(password = getAdminPassword()) {
  return createHash("sha256").update(`nav-admin:${password}`).digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminToken(token?: string) {
  if (!token) {
    return false;
  }

  return safeEqual(token, buildToken());
}

export function setAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: buildToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function isAdminRequest(request: NextRequest) {
  return verifyAdminToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

export function validateAdminPassword(password: string) {
  return safeEqual(password, getAdminPassword());
}
