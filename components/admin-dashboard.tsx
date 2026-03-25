"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CategoryStyle = "CARD" | "LIST";
type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";
type AdminMenuKey = "overview" | "categories" | "publish" | "review";

type AdminCategory = {
  id: string;
  name: string;
  style: CategoryStyle;
  description: string | null;
  _count?: {
    sites: number;
    submissions: number;
  };
};

type AdminSubmission = {
  id: string;
  title: string;
  description: string;
  url: string;
  proposerName: string;
  contact: string | null;
  tags: string[];
  status: SubmissionStatus;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    style: CategoryStyle;
  } | null;
  createdAt: string;
};

type AdminSite = {
  id: string;
  title: string;
  description: string;
  url: string;
  coverImageUrl: string | null;
  likes: number;
  views: number;
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  category: {
    id: string;
    name: string;
    style: CategoryStyle;
  };
  publisherName: string;
};

const MENUS: Array<{ key: AdminMenuKey; label: string; desc: string }> = [
  { key: "overview", label: "仪表盘", desc: "总览" },
  { key: "categories", label: "分类管理", desc: "目录风格" },
  { key: "publish", label: "发布站点", desc: "管理员发布" },
  { key: "review", label: "投稿审核", desc: "访客推荐" },
];

const CHART_COLORS = ["#4f8cff", "#ff8a3d", "#53c2aa", "#8f7dff", "#ff6c8f", "#2b9dff"];

export default function AdminDashboard() {
  const router = useRouter();

  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>("overview");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [sites, setSites] = useState<AdminSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryStyle, setCategoryStyle] = useState<CategoryStyle>("CARD");

  const [siteTitle, setSiteTitle] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteCoverImage, setSiteCoverImage] = useState("");
  const [siteCategoryId, setSiteCategoryId] = useState("");
  const [siteTags, setSiteTags] = useState("");
  const [editingSiteId, setEditingSiteId] = useState("");

  const [reviewCategoryMap, setReviewCategoryMap] = useState<Record<string, string>>({});

  const stats = useMemo(() => {
    const likes = sites.reduce((sum, site) => sum + site.likes, 0);
    const views = sites.reduce((sum, site) => sum + site.views, 0);

    return {
      totalSites: sites.length,
      pendingSubmissions: submissions.length,
      likes,
      views,
    };
  }, [sites, submissions]);

  const categoryMetrics = useMemo(() => {
    return categories.map((category) => {
      const siteInCategory = sites.filter((site) => site.category.id === category.id);
      const likes = siteInCategory.reduce((sum, site) => sum + site.likes, 0);
      const views = siteInCategory.reduce((sum, site) => sum + site.views, 0);

      return {
        name: category.name,
        likes,
        views,
        count: siteInCategory.length,
      };
    });
  }, [categories, sites]);

  const topViewedSites = useMemo(() => {
    return [...sites]
      .sort((a, b) => b.views - a.views)
      .slice(0, 8)
      .map((site) => ({
        name: site.title.length > 12 ? `${site.title.slice(0, 12)}…` : site.title,
        views: site.views,
        likes: site.likes,
      }));
  }, [sites]);

  const fetchJson = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      const response = await fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        throw new Error("请先登录后台");
      }

      const result = (await response.json().catch(() => ({ message: "请求失败" }))) as T & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message ?? "请求失败");
      }

      return result;
    },
    [router],
  );

  const refreshData = useCallback(async () => {
    setLoading(true);

    try {
      const [categoryResult, submissionResult, siteResult] = await Promise.all([
        fetchJson<{ categories: AdminCategory[] }>("/api/admin/categories"),
        fetchJson<{ submissions: AdminSubmission[] }>("/api/admin/submissions?status=PENDING"),
        fetchJson<{ sites: AdminSite[] }>("/api/admin/sites"),
      ]);

      setCategories(categoryResult.categories);
      setSubmissions(submissionResult.submissions);
      setSites(siteResult.sites);
      setSiteCategoryId((prev) => prev || categoryResult.categories[0]?.id || "");

      setReviewCategoryMap((prev) => {
        const next = { ...prev };

        for (const submission of submissionResult.submissions) {
          if (!next[submission.id]) {
            next[submission.id] = submission.categoryId ?? categoryResult.categories[0]?.id ?? "";
          }
        }

        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [fetchJson]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  async function onCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      await fetchJson<{ category: AdminCategory }>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: categoryName,
          description: categoryDescription,
          style: categoryStyle,
        }),
      });

      setCategoryName("");
      setCategoryDescription("");
      setCategoryStyle("CARD");
      setMessage("分类创建成功");
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "分类创建失败");
    }
  }

  function parseTagInput(raw: string) {
    return raw
      .split(/[,，\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function resetSiteForm() {
    setSiteTitle("");
    setSiteDescription("");
    setSiteUrl("");
    setSiteCoverImage("");
    setSiteTags("");
    setEditingSiteId("");
  }

  function onPickEditSite(site: AdminSite) {
    setEditingSiteId(site.id);
    setSiteTitle(site.title);
    setSiteDescription(site.description);
    setSiteUrl(site.url);
    setSiteCoverImage(site.coverImageUrl ?? "");
    setSiteCategoryId(site.category.id);
    setSiteTags(site.tags.map((tag) => tag.name).join(", "));
    setActiveMenu("publish");
    setMessage(`正在编辑：${site.title}`);
  }

  async function onCreateSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      await fetchJson<{ site: AdminSite }>("/api/admin/sites", {
        method: "POST",
        body: JSON.stringify({
          title: siteTitle,
          description: siteDescription,
          url: siteUrl,
          coverImageUrl: siteCoverImage || undefined,
          categoryId: siteCategoryId,
          tags: parseTagInput(siteTags),
        }),
      });

      resetSiteForm();
      setMessage("站点发布成功");
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "站点发布失败");
    }
  }

  async function onUpdateSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!editingSiteId) {
      setMessage("请先选择要编辑的站点");
      return;
    }

    try {
      await fetchJson<{ site: AdminSite }>(`/api/admin/sites/${editingSiteId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: siteTitle,
          description: siteDescription,
          url: siteUrl,
          coverImageUrl: siteCoverImage || undefined,
          categoryId: siteCategoryId,
          tags: parseTagInput(siteTags),
        }),
      });

      resetSiteForm();
      setMessage("站点更新成功");
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "站点更新失败");
    }
  }

  async function onReviewSubmission(submission: AdminSubmission, action: "approve" | "reject") {
    setMessage("");

    try {
      await fetchJson<{ ok?: boolean }>(`/api/admin/submissions/${submission.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          action,
          categoryId: action === "approve" ? reviewCategoryMap[submission.id] : undefined,
        }),
      });

      setMessage(action === "approve" ? "投稿已通过" : "投稿已拒绝");
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "审核失败");
    }
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ai-nav-logo.svg" alt="AI 导航" />
          <div>
            <strong>AI 导航管理后台</strong>
            <small>Navigation Control Panel</small>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <Link href="/" target="_blank" rel="noreferrer">
            返回前端
          </Link>
          <button type="button" onClick={() => void onLogout()}>
            退出登录
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title">菜单</div>
          {MENUS.map((menu) => (
            <button
              key={menu.key}
              type="button"
              className={`admin-menu-item ${activeMenu === menu.key ? "active" : ""}`}
              onClick={() => setActiveMenu(menu.key)}
            >
              <span>{menu.label}</span>
              <small>{menu.desc}</small>
            </button>
          ))}
        </aside>

        <main className="admin-main">
          {message ? <div className="admin-message">{message}</div> : null}
          {loading ? <div className="admin-loading">加载中...</div> : null}

          {activeMenu === "overview" ? (
            <section className="admin-panel-group">
              <div className="admin-stat-grid">
                <div className="admin-stat-card">
                  <strong>{stats.totalSites}</strong>
                  <small>已发布站点</small>
                </div>
                <div className="admin-stat-card">
                  <strong>{stats.pendingSubmissions}</strong>
                  <small>待审核投稿</small>
                </div>
                <div className="admin-stat-card">
                  <strong>{stats.likes}</strong>
                  <small>总点赞</small>
                </div>
                <div className="admin-stat-card">
                  <strong>{stats.views}</strong>
                  <small>总浏览</small>
                </div>
              </div>

              <div className="admin-chart-grid">
                <section className="admin-card chart-card">
                  <h2>分类热度对比</h2>
                  <div className="admin-chart-box">
                    <ResponsiveContainer width="100%" height={270}>
                      <BarChart data={categoryMetrics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf5" />
                        <XAxis dataKey="name" tick={{ fill: "#627089", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#627089", fontSize: 12 }} />
                        <Tooltip
                          cursor={{ fill: "rgba(79, 140, 255, 0.08)" }}
                          contentStyle={{
                            borderRadius: 10,
                            border: "1px solid #dde4f0",
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="views" fill="#4f8cff" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="likes" fill="#ff8a3d" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                <section className="admin-card chart-card">
                  <h2>分类占比</h2>
                  <div className="admin-chart-box">
                    <ResponsiveContainer width="100%" height={270}>
                      <PieChart>
                        <Pie
                          data={categoryMetrics}
                          dataKey="count"
                          nameKey="name"
                          innerRadius={52}
                          outerRadius={92}
                          paddingAngle={2}
                        >
                          {categoryMetrics.map((entry, index) => (
                            <Cell
                              key={`${entry.name}-${entry.count}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: "1px solid #dde4f0",
                            fontSize: 12,
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="admin-chart-legend">
                      {categoryMetrics.map((item, index) => (
                        <div key={item.name}>
                          <i
                            style={{
                              backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                            }}
                          />
                          <span>{item.name}</span>
                          <b>{item.count}</b>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>

              <section className="admin-card full-width">
                <h2>浏览 Top 8</h2>
                <div className="admin-chart-box compact">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={topViewedSites}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf5" />
                      <XAxis dataKey="name" tick={{ fill: "#627089", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#627089", fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: "rgba(79, 140, 255, 0.08)" }}
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid #dde4f0",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="views" fill="#2d9cff" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="admin-card full-width">
                <h2>最近发布</h2>
                <div className="site-table">
                  {sites.slice(0, 20).map((site) => (
                    <div key={site.id} className="site-table-row">
                      <strong>{site.title}</strong>
                      <span>{site.category.name}</span>
                      <span>{site.publisherName}</span>
                      <span>❤ {site.likes}</span>
                      <span>👁 {site.views}</span>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          ) : null}

          {activeMenu === "categories" ? (
            <section className="admin-panel-group">
              <section className="admin-card">
                <h2>新增分类</h2>
                <form className="admin-form admin-form-grid" onSubmit={onCreateCategory}>
                  <input
                    className="field-half"
                    required
                    value={categoryName}
                    placeholder="分类名，例如 AI 工具"
                    onChange={(event) => setCategoryName(event.target.value)}
                  />
                  <input
                    className="field-half"
                    value={categoryDescription}
                    placeholder="分类说明（可选）"
                    onChange={(event) => setCategoryDescription(event.target.value)}
                  />
                  <select
                    className="field-third"
                    value={categoryStyle}
                    onChange={(event) => setCategoryStyle(event.target.value as CategoryStyle)}
                  >
                    <option value="CARD">卡片风格</option>
                    <option value="LIST">列表风格</option>
                  </select>
                  <button className="field-third" type="submit">
                    创建分类
                  </button>
                </form>
              </section>

              <section className="admin-card full-width">
                <h2>分类列表</h2>
                <div className="category-list">
                  {categories.map((category) => (
                    <div key={category.id} className="category-row">
                      <strong>{category.name}</strong>
                      <span>{category.description || "-"}</span>
                      <small>{category.style === "CARD" ? "卡片" : "列表"}</small>
                      <small>站点 {category._count?.sites ?? 0}</small>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          ) : null}

          {activeMenu === "publish" ? (
            <section className="admin-panel-group">
              <section className="admin-card">
                <h2>{editingSiteId ? "编辑站点" : "管理员发布站点"}</h2>
                <form className="admin-form admin-form-grid" onSubmit={editingSiteId ? onUpdateSite : onCreateSite}>
                  <input
                    className="field-half"
                    required
                    value={siteTitle}
                    placeholder="站点标题"
                    onChange={(event) => setSiteTitle(event.target.value)}
                  />
                  <input
                    className="field-half"
                    required
                    value={siteUrl}
                    placeholder="站点 URL"
                    onChange={(event) => setSiteUrl(event.target.value)}
                  />
                  <textarea
                    className="field-full"
                    required
                    value={siteDescription}
                    placeholder="站点描述"
                    onChange={(event) => setSiteDescription(event.target.value)}
                  />
                  <input
                    className="field-half"
                    value={siteCoverImage}
                    placeholder="封面 URL（可选）"
                    onChange={(event) => setSiteCoverImage(event.target.value)}
                  />
                  <select
                    className="field-third"
                    required
                    value={siteCategoryId}
                    onChange={(event) => setSiteCategoryId(event.target.value)}
                  >
                    <option value="">请选择分类</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="field-third"
                    value={siteTags}
                    placeholder="标签，逗号分隔"
                    onChange={(event) => setSiteTags(event.target.value)}
                  />
                  <button className="field-third" type="submit">
                    {editingSiteId ? "保存修改" : "发布站点"}
                  </button>
                  {editingSiteId ? (
                    <button className="field-third btn-ghost" type="button" onClick={() => resetSiteForm()}>
                      取消编辑
                    </button>
                  ) : null}
                </form>
              </section>

              <section className="admin-card full-width">
                <h2>已发布站点（点击编辑）</h2>
                <div className="site-table">
                  {sites.slice(0, 80).map((site) => (
                    <div key={site.id} className="site-table-row site-table-row-edit">
                      <strong>{site.title}</strong>
                      <span>{site.category.name}</span>
                      <span>{site.tags.map((tag) => tag.name).join(" / ") || "-"}</span>
                      <button type="button" className="btn-ghost" onClick={() => onPickEditSite(site)}>
                        编辑
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </section>
          ) : null}

          {activeMenu === "review" ? (
            <section className="admin-panel-group">
              <section className="admin-card full-width">
                <h2>待审核投稿</h2>
                {!loading && submissions.length === 0 ? <div className="admin-empty">暂无待审核投稿</div> : null}
                <div className="submission-list">
                  {submissions.map((submission) => (
                    <article key={submission.id} className="submission-item">
                      <header>
                        <h3>{submission.title}</h3>
                        <small>{new Date(submission.createdAt).toLocaleString()}</small>
                      </header>
                      <p>{submission.description}</p>
                      <a href={submission.url} target="_blank" rel="noreferrer">
                        {submission.url}
                      </a>
                      <div className="submission-meta">
                        <span>投稿人：{submission.proposerName}</span>
                        <span>标签：{submission.tags.join(" / ") || "无"}</span>
                      </div>
                      <div className="submission-actions">
                        <select
                          value={reviewCategoryMap[submission.id] ?? ""}
                          onChange={(event) =>
                            setReviewCategoryMap((prev) => ({
                              ...prev,
                              [submission.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="">请选择通过后的分类</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={() => void onReviewSubmission(submission, "approve")}>通过</button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => void onReviewSubmission(submission, "reject")}
                        >
                          拒绝
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
