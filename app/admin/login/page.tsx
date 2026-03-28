"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import ThemeToggle from "@/components/theme-toggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const result = (await response.json().catch(() => ({ message: "登录失败" }))) as {
      message?: string;
    };

    if (!response.ok) {
      setMessage(result.message ?? "登录失败");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-toolbar">
        <ThemeToggle />
      </div>
      <form className="admin-login-card" onSubmit={onSubmit}>
        <div className="admin-login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ai-nav-logo.svg" alt="AI 导航" />
          <div>
            <div className="admin-login-eyebrow">Login</div>
            <h1>后台登录</h1>
          </div>
        </div>
        <p>欢迎回来，请输入管理密码继续。</p>
        <label className="admin-login-label" htmlFor="admin-password">
          管理密码
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          placeholder="ADMIN_PASSWORD"
          onChange={(event) => setPassword(event.target.value)}
        />
        {message ? <div className="admin-login-message">{message}</div> : null}
        <button type="submit" className="admin-login-submit" disabled={loading}>
          {loading ? "登录中..." : "登录后台"}
        </button>
        <div className="admin-login-links">
          <Link href="/" className="admin-login-back">
            返回前端首页
          </Link>
        </div>
      </form>
    </main>
  );
}
