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
const PUBLISH_PAGE_SIZE = 12;

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
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [siteModalMode, setSiteModalMode] = useState<"create" | "edit">("create");
  const [publishCategoryFilter, setPublishCategoryFilter] = useState("all");
  const [publishPage, setPublishPage] = useState(1);
  const [aiAnalyzeUrl, setAiAnalyzeUrl] = useState("");
  const [aiModels, setAiModels] = useState<string[]>([]);
  const [aiModel, setAiModel] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [autoCreateCategory, setAutoCreateCategory] = useState(true);
  const [suggestedCategoryName, setSuggestedCategoryName] = useState("");
  const [suggestedCategoryStyle, setSuggestedCategoryStyle] = useState<CategoryStyle>("CARD");
  const [quickCategoryModalOpen, setQuickCategoryModalOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState("");
  const [quickCategoryDescription, setQuickCategoryDescription] = useState("");
  const [quickCategoryStyle, setQuickCategoryStyle] = useState<CategoryStyle>("CARD");

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

  const filteredPublishSites = useMemo(() => {
    if (publishCategoryFilter === "all") {
      return sites;
    }
    return sites.filter((site) => site.category.id === publishCategoryFilter);
  }, [publishCategoryFilter, sites]);

  const publishTotalPages = Math.max(1, Math.ceil(filteredPublishSites.length / PUBLISH_PAGE_SIZE));

  const pagedPublishSites = useMemo(() => {
    const start = (publishPage - 1) * PUBLISH_PAGE_SIZE;
    return filteredPublishSites.slice(start, start + PUBLISH_PAGE_SIZE);
  }, [filteredPublishSites, publishPage]);

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

  useEffect(() => {
    setPublishPage(1);
  }, [publishCategoryFilter]);

  useEffect(() => {
    if (publishPage > publishTotalPages) {
      setPublishPage(publishTotalPages);
    }
  }, [publishPage, publishTotalPages]);

  useEffect(() => {
    if (activeMenu !== "publish" || aiModels.length > 0) {
      return;
    }

    void fetchJson<{ models: string[]; message?: string }>("/api/admin/ai/models")
      .then((result) => {
        setAiModels(result.models ?? []);
        if (!aiModel && result.models?.[0]) {
          setAiModel(result.models[0]);
        }
        if (result.message) {
          setAiMessage(result.message);
        }
      })
      .catch((error) => {
        setAiMessage(error instanceof Error ? error.message : "模型加载失败");
      });
  }, [activeMenu, aiModel, aiModels.length, fetchJson]);

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
    setAiAnalyzeUrl("");
    setAiMessage("");
    setSuggestedCategoryName("");
    setSuggestedCategoryStyle("CARD");
  }

  function onOpenCreateSiteModal() {
    resetSiteForm();
    setSiteModalMode("create");
    setSiteCategoryId((prev) => prev || categories[0]?.id || "");
    setSiteModalOpen(true);
  }

  function onCloseSiteModal() {
    setSiteModalOpen(false);
    resetSiteForm();
  }

  function onPickEditSite(site: AdminSite) {
    setEditingSiteId(site.id);
    setSiteModalMode("edit");
    setSiteTitle(site.title);
    setSiteDescription(site.description);
    setSiteUrl(site.url);
    setSiteCoverImage(site.coverImageUrl ?? "");
    setSiteCategoryId(site.category.id);
    setSiteTags(site.tags.map((tag) => tag.name).join(", "));
    setSiteModalOpen(true);
    setMessage("");
  }

  async function onAnalyzeUrl() {
    setAiMessage("");
    if (!aiAnalyzeUrl.trim()) {
      setAiMessage("请先输入要解析的链接");
      return;
    }
    if (!aiModel) {
      setAiMessage("请先选择 Ollama 模型");
      return;
    }

    setAiLoading(true);
    try {
      const result = await fetchJson<{
        message?: string;
        data?: {
          title: string;
          description: string;
          tags: string[];
          coverImageUrl: string;
          categoryName: string;
          categoryStyle: CategoryStyle;
          matchedCategoryId: string;
        };
      }>("/api/admin/ai/analyze", {
        method: "POST",
        body: JSON.stringify({
          url: aiAnalyzeUrl.trim(),
          model: aiModel,
        }),
      });

      const data = result.data;
      if (!data) {
        setAiMessage(result.message || "AI 返回为空");
        return;
      }

      setSiteTitle(data.title || "");
      setSiteDescription(data.description || "");
      setSiteUrl(aiAnalyzeUrl.trim());
      if (data.coverImageUrl) {
        setSiteCoverImage(data.coverImageUrl);
      }
      setSiteTags((data.tags ?? []).join(", "));
      setSuggestedCategoryName(data.categoryName || "");
      setSuggestedCategoryStyle(data.categoryStyle || "CARD");

      if (data.matchedCategoryId) {
        setSiteCategoryId(data.matchedCategoryId);
        setAiMessage(`AI 已匹配分类：${data.categoryName}`);
      } else if (data.categoryName) {
        setSiteCategoryId("");
        setAiMessage(`AI 推荐新分类：${data.categoryName}（可自动创建）`);
      } else {
        setAiMessage(result.message || "AI 解析完成，请检查并微调后保存");
      }
    } catch (error) {
      setAiMessage(error instanceof Error ? error.message : "AI 解析失败");
    } finally {
      setAiLoading(false);
    }
  }

  async function ensureSiteCategoryId() {
    if (siteCategoryId) {
      return siteCategoryId;
    }

    const newCategoryName = suggestedCategoryName.trim();
    if (!autoCreateCategory || !newCategoryName) {
      throw new Error("请先选择分类，或启用自动创建分类");
    }

    const created = await fetchJson<{ category: AdminCategory }>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({
        name: newCategoryName,
        description: "AI 自动识别创建",
        style: suggestedCategoryStyle,
      }),
    });

    setCategories((prev) => [created.category, ...prev]);
    setSiteCategoryId(created.category.id);
    return created.category.id;
  }

  async function onCreateCategoryQuick(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      await fetchJson<{ category: AdminCategory }>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: quickCategoryName,
          description: quickCategoryDescription,
          style: quickCategoryStyle,
        }),
      });

      setQuickCategoryName("");
      setQuickCategoryDescription("");
      setQuickCategoryStyle("CARD");
      setQuickCategoryModalOpen(false);
      setMessage("分类创建成功");
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "分类创建失败");
    }
  }

  async function onCreateSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const resolvedCategoryId = await ensureSiteCategoryId();

      await fetchJson<{ site: AdminSite }>("/api/admin/sites", {
        method: "POST",
        body: JSON.stringify({
          title: siteTitle,
          description: siteDescription,
          url: siteUrl,
          coverImageUrl: siteCoverImage || undefined,
          categoryId: resolvedCategoryId,
          tags: parseTagInput(siteTags),
        }),
      });

      resetSiteForm();
      setSiteModalOpen(false);
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
      const resolvedCategoryId = await ensureSiteCategoryId();

      await fetchJson<{ site: AdminSite }>(`/api/admin/sites/${editingSiteId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: siteTitle,
          description: siteDescription,
          url: siteUrl,
          coverImageUrl: siteCoverImage || undefined,
          categoryId: resolvedCategoryId,
          tags: parseTagInput(siteTags),
        }),
      });

      resetSiteForm();
      setSiteModalOpen(false);
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
              <section className="admin-card full-width">
                <div className="admin-site-toolbar">
                  <h2>站点管理</h2>
                  <div className="admin-site-toolbar-actions">
                    <select
                      value={publishCategoryFilter}
                      onChange={(event) => setPublishCategoryFilter(event.target.value)}
                    >
                      <option value="all">全部分类</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="btn-primary" onClick={onOpenCreateSiteModal}>
                      新增站点
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setQuickCategoryModalOpen(true)}>
                      新增分类
                    </button>
                  </div>
                </div>

                <div className="site-table">
                  {pagedPublishSites.map((site) => (
                    <div key={site.id} className="site-table-row site-table-row-edit">
                      <strong>{site.title}</strong>
                      <span>{site.category.name}</span>
                      <span>{site.tags.map((tag) => tag.name).join(" / ") || "-"}</span>
                      <button type="button" className="btn-ghost" onClick={() => onPickEditSite(site)}>
                        编辑
                      </button>
                    </div>
                  ))}
                  {!loading && filteredPublishSites.length === 0 ? (
                    <div className="admin-empty">当前分类下暂无站点</div>
                  ) : null}
                </div>

                <div className="admin-pagination">
                  <small>
                    共 {filteredPublishSites.length} 条，第 {publishPage}/{publishTotalPages} 页
                  </small>
                  <div>
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={publishPage <= 1}
                      onClick={() => setPublishPage((prev) => Math.max(1, prev - 1))}
                    >
                      上一页
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={publishPage >= publishTotalPages}
                      onClick={() => setPublishPage((prev) => Math.min(publishTotalPages, prev + 1))}
                    >
                      下一页
                    </button>
                  </div>
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

          {siteModalOpen ? (
            <div className="modal-mask" onClick={onCloseSiteModal}>
              <div className="modal-panel admin-site-modal" onClick={(event) => event.stopPropagation()}>
                <h3>{siteModalMode === "edit" ? "编辑站点" : "新增站点"}</h3>
                <p>填写站点信息后保存，支持分类和标签。</p>

                <div className="ai-assist-panel">
                  <strong>AI 链接解析</strong>
                  <div className="ai-assist-row">
                    <input
                      value={aiAnalyzeUrl}
                      placeholder="粘贴 GitHub / 官网链接，例如 https://github.com/vercel/next.js"
                      onChange={(event) => setAiAnalyzeUrl(event.target.value)}
                    />
                    <select value={aiModel} onChange={(event) => setAiModel(event.target.value)}>
                      <option value="">请选择模型</option>
                      {aiModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="btn-ghost" disabled={aiLoading} onClick={() => void onAnalyzeUrl()}>
                      {aiLoading ? "分析中..." : "AI 分析"}
                    </button>
                  </div>
                  {suggestedCategoryName ? (
                    <label className="ai-assist-check">
                      <input
                        type="checkbox"
                        checked={autoCreateCategory}
                        onChange={(event) => setAutoCreateCategory(event.target.checked)}
                      />
                      自动创建分类：{suggestedCategoryName}（{suggestedCategoryStyle === "CARD" ? "卡片" : "列表"}）
                    </label>
                  ) : null}
                  {aiMessage ? <small>{aiMessage}</small> : null}
                </div>

                <form className="admin-form admin-form-grid" onSubmit={siteModalMode === "edit" ? onUpdateSite : onCreateSite}>
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

                  <div className="field-full modal-actions">
                    <button type="button" className="btn-ghost" onClick={onCloseSiteModal}>
                      取消
                    </button>
                    <button type="submit" className="btn-primary">
                      {siteModalMode === "edit" ? "保存修改" : "新增站点"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {quickCategoryModalOpen ? (
            <div className="modal-mask" onClick={() => setQuickCategoryModalOpen(false)}>
              <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
                <h3>新增分类</h3>
                <p>创建后可直接用于站点新增与 AI 自动归类。</p>
                <form className="admin-form admin-form-grid" onSubmit={onCreateCategoryQuick}>
                  <input
                    className="field-half"
                    required
                    value={quickCategoryName}
                    placeholder="分类名，例如 AI 工作流"
                    onChange={(event) => setQuickCategoryName(event.target.value)}
                  />
                  <input
                    className="field-half"
                    value={quickCategoryDescription}
                    placeholder="分类说明（可选）"
                    onChange={(event) => setQuickCategoryDescription(event.target.value)}
                  />
                  <select
                    className="field-third"
                    value={quickCategoryStyle}
                    onChange={(event) => setQuickCategoryStyle(event.target.value as CategoryStyle)}
                  >
                    <option value="CARD">卡片风格</option>
                    <option value="LIST">列表风格</option>
                  </select>
                  <div className="field-full modal-actions">
                    <button type="button" className="btn-ghost" onClick={() => setQuickCategoryModalOpen(false)}>
                      取消
                    </button>
                    <button type="submit" className="btn-primary">
                      创建分类
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
