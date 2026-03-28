"use client";

import { CSSProperties, FormEvent, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, Heart, Search } from "lucide-react";

import ThemeToggle from "@/components/theme-toggle";

type PublicTag = {
  id: string;
  name: string;
  slug: string;
};

type PublicSite = {
  id: string;
  title: string;
  description: string;
  url: string;
  coverImageUrl: string | null;
  fallbackColor: string;
  likes: number;
  views: number;
  publishedAt: string;
  publisherName: string;
  publisherType: "ADMIN" | "GUEST";
  tags: PublicTag[];
};

type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  style: "CARD" | "LIST";
  defaultSort: "HOT" | "LATEST";
  description: string | null;
  sites: PublicSite[];
};

type NavigationResponse = {
  categories: PublicCategory[];
};

type RecommendForm = {
  title: string;
  description: string;
  url: string;
  coverImageUrl: string;
  categoryId: string;
  tags: string;
  contact: string;
};

const initialForm: RecommendForm = {
  title: "",
  description: "",
  url: "",
  coverImageUrl: "",
  categoryId: "",
  tags: "",
  contact: "",
};

type SortMode = "hot" | "latest";

function getTagToneClass(tag: string) {
  const tones = [
    "tag-tone-0",
    "tag-tone-1",
    "tag-tone-2",
    "tag-tone-3",
    "tag-tone-4",
    "tag-tone-5",
    "tag-tone-6",
    "tag-tone-7",
  ];

  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0;
  }

  return tones[Math.abs(hash) % tones.length];
}

function isCompactLogoCover(url: string | null) {
  if (!url) {
    return false;
  }

  return /ai55\.cc|site-icons|favicon|\.ico(?:$|\?)/i.test(url);
}

function shouldUseGeneratedCover(site: PublicSite) {
  if (!site.coverImageUrl) {
    return true;
  }

  return isCompactLogoCover(site.coverImageUrl);
}

function getCoverAccent(seed: string) {
  const palette = ["#4cc9f0", "#ff8a3d", "#22c55e", "#f97316", "#818cf8", "#14b8a6", "#ec4899", "#0ea5e9"];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

function getGeneratedCoverStyle(site: PublicSite): CSSProperties {
  const accent = getCoverAccent(site.title);
  return {
    background: `
      radial-gradient(circle at 18% 18%, ${accent}55, transparent 34%),
      radial-gradient(circle at 84% 24%, ${site.fallbackColor}aa, transparent 38%),
      linear-gradient(140deg, ${site.fallbackColor} 0%, color-mix(in srgb, ${accent} 48%, #0f172a) 100%)
    `,
  };
}

function getHotScore(site: PublicSite) {
  return site.views + site.likes * 180;
}

function compareByHot(a: PublicSite, b: PublicSite) {
  return getHotScore(b) - getHotScore(a) || b.views - a.views || b.likes - a.likes;
}

function compareByLatest(a: PublicSite, b: PublicSite) {
  return (
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() ||
    compareByHot(a, b)
  );
}

function normalizeSearchText(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

function matchesTitleSearch(title: string, query: string) {
  if (!query.trim()) {
    return true;
  }

  const normalizedTitle = normalizeSearchText(title);
  const keywords = query
    .trim()
    .split(/\s+/)
    .map((keyword) => normalizeSearchText(keyword))
    .filter(Boolean);

  return keywords.every((keyword) => normalizedTitle.includes(keyword));
}

export default function NavigationApp() {
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [sortMode, setSortMode] = useState<SortMode>("hot");
  const [globalSearchInput, setGlobalSearchInput] = useState("");
  const [categorySearchInput, setCategorySearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");

  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recommendForm, setRecommendForm] = useState<RecommendForm>(initialForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const deferredGlobalSearch = useDeferredValue(globalSearchInput.trim());
  const deferredCategorySearch = useDeferredValue(categorySearchInput.trim());

  useEffect(() => {
    void fetchNavigation();
  }, []);

  const activeCategory = useMemo(() => {
    return categories.find((category) => category.id === activeCategoryId) ?? categories[0] ?? null;
  }, [activeCategoryId, categories]);

  useEffect(() => {
    if (!activeCategory) {
      return;
    }

    setSortMode(activeCategory.defaultSort === "LATEST" ? "latest" : "hot");
  }, [activeCategory]);

  const allSites = useMemo(() => {
    const siteMap = new Map<string, PublicSite>();

    for (const category of categories) {
      for (const site of category.sites) {
        siteMap.set(site.id, site);
      }
    }

    return [...siteMap.values()];
  }, [categories]);

  const activeSites = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    return activeCategory.sites.filter((site) => matchesTitleSearch(site.title, deferredCategorySearch));
  }, [activeCategory, deferredCategorySearch]);

  const visibleSites = useMemo(() => {
    const baseSites = deferredGlobalSearch
      ? allSites.filter((site) => matchesTitleSearch(site.title, deferredGlobalSearch))
      : activeSites;
    const sorter = sortMode === "latest" ? compareByLatest : compareByHot;
    return [...baseSites].sort(sorter);
  }, [activeSites, allSites, deferredGlobalSearch, sortMode]);

  const contentTitle = deferredGlobalSearch ? "全局搜索结果" : activeCategory?.name ?? "导航";
  const activeCategorySearchLabel = activeCategory?.name ?? "当前分类";
  const contentDescription = deferredGlobalSearch
    ? `按标题模糊匹配“${deferredGlobalSearch}”，共找到 ${visibleSites.length} 条结果`
    : deferredCategorySearch
      ? `在「${activeCategory?.name ?? "当前分类"}」中匹配“${deferredCategorySearch}”，共找到 ${visibleSites.length} 条结果`
      : activeCategory?.description ?? "按分类浏览推荐网站";
  const emptyMessage = deferredGlobalSearch
    ? "全站没有搜到匹配标题，换个关键词试试。"
    : deferredCategorySearch
      ? "当前分类没有搜到匹配标题，换个关键词试试。"
      : "当前分类还没有站点，先去推荐一个吧。";

  async function fetchNavigation() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/public/navigation", { cache: "no-store" });
      const json = (await response.json()) as NavigationResponse;

      if (!response.ok) {
        throw new Error((json as { message?: string }).message ?? "加载失败");
      }

      setCategories(json.categories);
      setActiveCategoryId((prev) => {
        if (prev && json.categories.some((category) => category.id === prev)) {
          return prev;
        }
        return json.categories[0]?.id ?? "";
      });
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  function onSwitchCategory(categoryId: string) {
    if (categoryId === activeCategoryId) {
      return;
    }

    setActiveCategoryId(categoryId);
    setCategorySearchInput("");
    setSwitching(true);
    window.setTimeout(() => setSwitching(false), 180);
  }

  function updateSiteCounter(siteId: string, patch: Partial<Pick<PublicSite, "likes" | "views">>) {
    setCategories((prev) =>
      prev.map((category) => ({
        ...category,
        sites: category.sites.map((site) => (site.id === siteId ? { ...site, ...patch } : site)),
      })),
    );
  }

  async function onLike(siteId: string) {
    const response = await fetch(`/api/public/sites/${siteId}/like`, { method: "POST" });

    if (!response.ok) {
      return;
    }

    const result = (await response.json()) as { likes: number };
    updateSiteCounter(siteId, { likes: result.likes });
  }

  async function onOpenSite(site: PublicSite) {
    window.open(site.url, "_blank", "noopener,noreferrer");

    const response = await fetch(`/api/public/sites/${site.id}/view`, { method: "POST" });

    if (!response.ok) {
      return;
    }

    const result = (await response.json()) as { views: number };
    updateSiteCounter(site.id, { views: result.views });
  }

  async function onSubmitRecommend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitLoading(true);
    setSubmitMessage("");

    const tags = recommendForm.tags
      .split(/[,，\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    const response = await fetch("/api/public/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: recommendForm.title,
        description: recommendForm.description,
        url: recommendForm.url,
        coverImageUrl: recommendForm.coverImageUrl || undefined,
        categoryId: recommendForm.categoryId || undefined,
        tags,
        contact: recommendForm.contact || undefined,
      }),
    });

    const result = (await response.json().catch(() => ({ message: "提交失败" }))) as {
      message?: string;
    };

    if (!response.ok) {
      setSubmitMessage(result.message ?? "提交失败");
      setSubmitLoading(false);
      return;
    }

    setSubmitMessage(result.message ?? "已提交，等待审核");
    setRecommendForm(initialForm);
    setSubmitLoading(false);
  }

  const showSkeleton = loading || switching;

  return (
    <div className="nav-page">
      <header className="nav-header">
        <Link href="/" className="brand-wrap" aria-label="AI 导航主页">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ai-nav-logo.svg" alt="AI 导航 Logo" />
          <div>
            <h1>AI 与前端导航</h1>
            <p>Tools Directory</p>
          </div>
        </Link>

        <div className="nav-header-search">
          <label className="search-shell search-shell-large">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              className="nav-search-input"
              placeholder="搜索全站"
              value={globalSearchInput}
              onChange={(event) => setGlobalSearchInput(event.target.value)}
              aria-label="搜索全站"
            />
          </label>
        </div>

        <div className="nav-header-actions">
          <ThemeToggle />
          <button type="button" className="recommend-btn" onClick={() => setShowRecommendModal(true)}>
            推荐网站
          </button>
          <Link href="/admin" className="admin-link">
            管理后台
          </Link>
        </div>
      </header>

      <section className="nav-body">
        <aside className="category-panel">
          <div className="panel-title">分类目录</div>
          {showSkeleton && categories.length === 0 ? (
            <SidebarSkeleton />
          ) : (
            categories.map((category) => {
              const active = category.id === activeCategory?.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  className={`category-item ${active ? "active" : ""}`}
                  onClick={() => onSwitchCategory(category.id)}
                >
                  <span>{category.name}</span>
                  <small>{category.sites.length}</small>
                </button>
              );
            })
          )}
        </aside>

        <main className="content-panel">
          <div className="content-head">
            <div>
              <h2>{contentTitle}</h2>
              <p>{contentDescription}</p>
            </div>
            <div className="content-head-actions">
              <div className="content-search-wrap">
                <label className="search-shell search-shell-compact">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="search"
                    className="content-search-input"
                    placeholder={`搜索 ${activeCategorySearchLabel}`}
                    value={categorySearchInput}
                    onChange={(event) => setCategorySearchInput(event.target.value)}
                    aria-label={`搜索 ${activeCategorySearchLabel}`}
                  />
                </label>
              </div>
              <div className="content-sort-row" aria-label="站点排序方式">
                <button
                  type="button"
                  className={`sort-chip ${sortMode === "hot" ? "active" : ""}`}
                  onClick={() => setSortMode("hot")}
                >
                  最热
                </button>
                <button
                  type="button"
                  className={`sort-chip ${sortMode === "latest" ? "active" : ""}`}
                  onClick={() => setSortMode("latest")}
                >
                  最新
                </button>
              </div>
            </div>
          </div>

          {error ? <div className="error-box">{error}</div> : null}

          {showSkeleton ? (
            <CardSkeleton />
          ) : activeCategory?.style === "LIST" ? (
            <div className="site-list-wrap">
              {visibleSites.map((site) => (
                <article key={site.id} className="site-list-item" onClick={() => void onOpenSite(site)}>
                  <SiteCover site={site} mode="list" />

                  <div className="site-list-content">
                    <h3 title={site.title}>{site.title}</h3>
                    <p>{site.description}</p>
                    <div className="site-meta-row">
                      <span>{site.publisherName}</span>
                      <small>
                        <Eye size={14} />
                        {site.views}
                      </small>
                      <button
                        type="button"
                        className="site-inline-like"
                        onClick={(event) => {
                          event.stopPropagation();
                          void onLike(site.id);
                        }}
                      >
                        <Heart size={14} />
                        {site.likes}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {visibleSites.length === 0 ? <EmptyState message={emptyMessage} /> : null}
            </div>
          ) : (
            <div className="site-card-grid">
              {visibleSites.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onOpenSite={onOpenSite}
                  onLike={onLike}
                />
              ))}
              {visibleSites.length === 0 ? <EmptyState message={emptyMessage} /> : null}
            </div>
          )}
        </main>
      </section>

      {showRecommendModal ? (
        <div className="modal-mask" onClick={() => setShowRecommendModal(false)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <h3>推荐一个网站</h3>
            <p>提交后会进入审核队列，通过后在导航展示。</p>

            <form className="recommend-form" onSubmit={onSubmitRecommend}>
              <input
                required
                placeholder="标题"
                value={recommendForm.title}
                onChange={(event) => setRecommendForm((prev) => ({ ...prev, title: event.target.value }))}
              />
              <input
                required
                placeholder="网址（https://）"
                value={recommendForm.url}
                onChange={(event) => setRecommendForm((prev) => ({ ...prev, url: event.target.value }))}
              />
              <textarea
                required
                placeholder="一句话描述"
                value={recommendForm.description}
                onChange={(event) => setRecommendForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <input
                placeholder="封面图 URL（可选）"
                value={recommendForm.coverImageUrl}
                onChange={(event) =>
                  setRecommendForm((prev) => ({ ...prev, coverImageUrl: event.target.value }))
                }
              />
              <input
                placeholder="标签，逗号分隔（如：AI, 前端, 设计）"
                value={recommendForm.tags}
                onChange={(event) => setRecommendForm((prev) => ({ ...prev, tags: event.target.value }))}
              />
              <select
                value={recommendForm.categoryId}
                onChange={(event) => setRecommendForm((prev) => ({ ...prev, categoryId: event.target.value }))}
              >
                <option value="">未选择分类（管理员可再分配）</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                placeholder="联系方式（可选）"
                value={recommendForm.contact}
                onChange={(event) => setRecommendForm((prev) => ({ ...prev, contact: event.target.value }))}
              />

              {submitMessage ? <div className="submit-message">{submitMessage}</div> : null}

              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowRecommendModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary" disabled={submitLoading}>
                  {submitLoading ? "提交中..." : "提交推荐"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="sidebar-skeleton">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={`sb-skeleton-${index}`} className="skeleton-line" />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="card-skeleton-grid">
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={`card-skeleton-${index}`} className="card-skeleton-item" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-box">{message}</div>;
}

function SiteCard({
  site,
  onOpenSite,
  onLike,
}: {
  site: PublicSite;
  onOpenSite: (site: PublicSite) => Promise<void>;
  onLike: (siteId: string) => Promise<void>;
}) {
  const descriptionRef = useRef<HTMLParagraphElement | null>(null);
  const [liftOnHover, setLiftOnHover] = useState(false);

  useEffect(() => {
    const checkCanLift = () => {
      const el = descriptionRef.current;
      if (!el) {
        setLiftOnHover(false);
        return;
      }

      const overTwoLines = el.scrollHeight - el.clientHeight > 1;
      setLiftOnHover(overTwoLines);
    };

    const run = () => window.requestAnimationFrame(checkCanLift);
    run();
    window.addEventListener("resize", run);

    return () => {
      window.removeEventListener("resize", run);
    };
  }, [site.description, site.tags]);

  return (
    <article className={`site-card ${liftOnHover ? "can-lift" : ""}`} onClick={() => void onOpenSite(site)}>
      <SiteCover site={site} mode="card" />

      <div className="site-card-body">
        <div className="site-card-main">
          <h3 title={site.title}>{site.title}</h3>
          <p ref={descriptionRef}>{site.description}</p>
          <div className="site-tag-row">
            {site.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className={`tag-chip ${getTagToneClass(tag.name)}`}>
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="site-card-footer" onClick={(event) => event.stopPropagation()}>
          <div className="site-meta-row">
            <strong>{site.publisherName}</strong>
          </div>

          <div className="site-metric-row">
            <button
              type="button"
              className="site-metric-pill button"
              aria-label={`点赞 ${site.title}`}
              onClick={() => void onLike(site.id)}
            >
              <Heart size={14} />
              <span>{site.likes}</span>
            </button>
            <span className="site-metric-pill">
              <Eye size={14} />
              <span>{site.views}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function SiteCover({ site, mode }: { site: PublicSite; mode: "card" | "list" }) {
  const generated = shouldUseGeneratedCover(site);
  const className = mode === "card" ? "site-card-cover" : "site-list-cover";

  if (generated) {
    return (
      <div className={`${className} generated-cover`} style={getGeneratedCoverStyle(site)}>
        {site.coverImageUrl ? (
          <div className="generated-cover-badge">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={site.coverImageUrl} alt={site.title} />
          </div>
        ) : (
          <div className="generated-cover-badge fallback" aria-hidden="true">
            {site.title.slice(0, 1)}
          </div>
        )}
        <div className={`generated-cover-content ${mode}`}>
          <strong>{site.title}</strong>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${className} ${isCompactLogoCover(site.coverImageUrl) ? "logo-mode" : ""}`}
      style={{ background: site.fallbackColor }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={site.coverImageUrl ?? ""} alt={site.title} />
    </div>
  );
}
