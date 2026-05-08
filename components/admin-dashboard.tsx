"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ClipboardList, Eye, GitFork, Heart, Layers, Search, Sparkles, Trash2, Upload, X } from "lucide-react";
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

import ThemeToggle from "@/components/theme-toggle";

type CategoryStyle = "CARD" | "LIST";
type CategorySortMode = "HOT" | "LATEST";
type SubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";
type AdminMenuKey = "overview" | "categories" | "publish" | "githubBatch" | "review";
type AiProvider = "openrouter" | "gemini";

type AdminCategory = {
  id: string;
  name: string;
  style: CategoryStyle;
  defaultSort: CategorySortMode;
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

type GithubRepoDraft = {
  id: string;
  fullName: string;
  url: string;
  homepage: string;
  description: string;
  stars: number;
  language: string;
  topics: string[];
  coverImageUrl: string;
};

type BatchSiteDraft = {
  id: string;
  sourceUrl: string;
  title: string;
  description: string;
  url: string;
  coverImageUrl: string;
  categoryId: string;
  suggestedCategoryName: string;
  suggestedCategoryStyle: CategoryStyle;
  tags: string[];
};

type BatchQueryPreset = {
  key: string;
  label: string;
  query: string;
  categoryName?: string;
};

const MENUS: Array<{ key: AdminMenuKey; label: string; desc: string }> = [
  { key: "overview", label: "仪表盘", desc: "总览" },
  { key: "categories", label: "分类管理", desc: "目录风格" },
  { key: "publish", label: "发布站点", desc: "管理员发布" },
  { key: "githubBatch", label: "批量爬取", desc: "GitHub AI 项目" },
  { key: "review", label: "投稿审核", desc: "访客推荐" },
];

const CHART_COLORS = ["#4f8cff", "#ff8a3d", "#53c2aa", "#8f7dff", "#ff6c8f", "#2b9dff"];
const PUBLISH_PAGE_SIZE = 12;
const BATCH_LIMIT_OPTIONS = [10, 20, 30, 50];
const BATCH_QUERY_PRESETS: BatchQueryPreset[] = [
  { key: "all", label: "全部分类（最热门）", query: "topic:ai stars:>800" },
  {
    key: "agent",
    label: "AI Agent 自动化",
    query: "topic:agent stars:>120 pushed:>=2025-01-01",
    categoryName: "AI Agent 自动化",
  },
  {
    key: "coding",
    label: "AI 编程开发",
    query: "topic:ai coding stars:>120 pushed:>=2025-01-01",
    categoryName: "AI 编程开发",
  },
  {
    key: "image-video",
    label: "AI 图像与视频",
    query: "topic:text-to-image OR topic:diffusion stars:>80 pushed:>=2025-01-01",
    categoryName: "AI 图像与视频",
  },
  {
    key: "model-platform",
    label: "AI 模型与平台",
    query: "topic:llm OR topic:inference stars:>120 pushed:>=2025-01-01",
    categoryName: "AI 模型与平台",
  },
  {
    key: "apps",
    label: "AI 应用与工作台",
    query: "topic:ai productivity stars:>80 pushed:>=2025-01-01",
    categoryName: "AI 应用与工作台",
  },
  {
    key: "tools",
    label: "AI 辅助工具",
    query: "topic:ai-tools OR topic:productivity stars:>80 pushed:>=2025-01-01",
    categoryName: "AI 辅助工具",
  },
  {
    key: "audio",
    label: "AI 音频",
    query: "topic:text-to-speech OR topic:speech-to-text stars:>80 pushed:>=2025-01-01",
    categoryName: "AI 音频",
  },
  { key: "custom", label: "自定义关键词", query: "" },
];
const DEFAULT_BATCH_QUERY = BATCH_QUERY_PRESETS[0].query;

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
  const [categoryDefaultSort, setCategoryDefaultSort] = useState<CategorySortMode>("HOT");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const [siteTitle, setSiteTitle] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [siteCoverImage, setSiteCoverImage] = useState("");
  const [siteCategoryId, setSiteCategoryId] = useState("");
  const [siteTags, setSiteTags] = useState<string[]>([]);
  const [siteTagInput, setSiteTagInput] = useState("");
  const [editingSiteId, setEditingSiteId] = useState("");
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [siteModalMode, setSiteModalMode] = useState<"create" | "edit">("create");
  const [siteCoverUploading, setSiteCoverUploading] = useState(false);
  const [publishCategoryFilter, setPublishCategoryFilter] = useState("all");
  const [publishSearchInput, setPublishSearchInput] = useState("");
  const [publishPage, setPublishPage] = useState(1);
  const [batchQuery, setBatchQuery] = useState(DEFAULT_BATCH_QUERY);
  const [batchQueryPresetKey, setBatchQueryPresetKey] = useState(BATCH_QUERY_PRESETS[0].key);
  const [batchLimit, setBatchLimit] = useState(10);
  const [batchDrafts, setBatchDrafts] = useState<BatchSiteDraft[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchPublishing, setBatchPublishing] = useState(false);
  const [batchProgress, setBatchProgress] = useState("");
  const [aiAnalyzeUrl, setAiAnalyzeUrl] = useState("");
  const [aiModels, setAiModels] = useState<string[]>([]);
  const [aiProvider, setAiProvider] = useState<AiProvider>("openrouter");
  const [aiModel, setAiModel] = useState("");
  const [aiModelsLoading, setAiModelsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [autoCreateCategory, setAutoCreateCategory] = useState(true);
  const [suggestedCategoryName, setSuggestedCategoryName] = useState("");
  const [suggestedCategoryStyle, setSuggestedCategoryStyle] = useState<CategoryStyle>("CARD");
  const [displayStats, setDisplayStats] = useState({
    totalSites: 0,
    pendingSubmissions: 0,
    likes: 0,
    views: 0,
  });
  const deferredPublishSearch = useDeferredValue(publishSearchInput.trim());

  const [reviewCategoryMap, setReviewCategoryMap] = useState<Record<string, string>>({});
  const aiModelsRequestIdRef = useRef(0);
  const siteCoverInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    const from = { totalSites: 0, pendingSubmissions: 0, likes: 0, views: 0 };
    const to = stats;
    const duration = 2000;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayStats({
        totalSites: Math.round(from.totalSites + (to.totalSites - from.totalSites) * eased),
        pendingSubmissions: Math.round(
          from.pendingSubmissions + (to.pendingSubmissions - from.pendingSubmissions) * eased,
        ),
        likes: Math.round(from.likes + (to.likes - from.likes) * eased),
        views: Math.round(from.views + (to.views - from.views) * eased),
      });

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stats]);

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

  function normalizeUrlInput(value: string) {
    const text = value.trim();
    if (!text) {
      return "";
    }
    if (/^https?:\/\//i.test(text)) {
      return text;
    }
    return `https://${text}`;
  }

  const filteredPublishSites = useMemo(() => {
    const scopedSites =
      publishCategoryFilter === "all"
        ? sites
        : sites.filter((site) => site.category.id === publishCategoryFilter);

    return scopedSites.filter((site) => matchesTitleSearch(site.title, deferredPublishSearch));
  }, [deferredPublishSearch, publishCategoryFilter, sites]);

  const publishSearchLabel = useMemo(() => {
    if (publishCategoryFilter === "all") {
      return "全站";
    }

    return categories.find((category) => category.id === publishCategoryFilter)?.name ?? "当前分类";
  }, [categories, publishCategoryFilter]);

  const publishTotalPages = Math.max(1, Math.ceil(filteredPublishSites.length / PUBLISH_PAGE_SIZE));

  const pagedPublishSites = useMemo(() => {
    const start = (publishPage - 1) * PUBLISH_PAGE_SIZE;
    return filteredPublishSites.slice(start, start + PUBLISH_PAGE_SIZE);
  }, [filteredPublishSites, publishPage]);

  const fetchJson = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();

      const response = await fetch(path, {
        ...init,
        cache: method === "GET" ? "no-store" : init?.cache,
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
      setSiteCategoryId((prev) => {
        if (prev && categoryResult.categories.some((category) => category.id === prev)) {
          return prev;
        }
        return categoryResult.categories[0]?.id || "";
      });

      setReviewCategoryMap((prev) => {
        const next: Record<string, string> = {};
        const availableCategoryIds = new Set(categoryResult.categories.map((item) => item.id));
        const fallbackCategoryId = categoryResult.categories[0]?.id ?? "";

        for (const submission of submissionResult.submissions) {
          const current = prev[submission.id] ?? "";
          const submissionCategory = submission.categoryId ?? "";

          if (current && availableCategoryIds.has(current)) {
            next[submission.id] = current;
            continue;
          }

          if (submissionCategory && availableCategoryIds.has(submissionCategory)) {
            next[submission.id] = submissionCategory;
            continue;
          }

          next[submission.id] = fallbackCategoryId;
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
  }, [deferredPublishSearch, publishCategoryFilter]);

  useEffect(() => {
    if (publishPage > publishTotalPages) {
      setPublishPage(publishTotalPages);
    }
  }, [publishPage, publishTotalPages]);

  useEffect(() => {
    setSelectedCategoryIds((prev) => prev.filter((id) => categories.some((item) => item.id === id)));
  }, [categories]);

  useEffect(() => {
    if (activeMenu !== "publish" && activeMenu !== "githubBatch") {
      return;
    }

    const currentRequestId = aiModelsRequestIdRef.current + 1;
    aiModelsRequestIdRef.current = currentRequestId;
    setAiModelsLoading(true);
    setAiModels([]);
    setAiModel("");
    setAiMessage("");

    void fetchJson<{ provider?: AiProvider; models: string[]; message?: string }>(
      `/api/admin/ai/models?provider=${aiProvider}`,
    )
      .then((result) => {
        if (aiModelsRequestIdRef.current !== currentRequestId) {
          return;
        }

        if (result.provider && result.provider !== aiProvider) {
          return;
        }

        const nextModels = result.models ?? [];
        setAiModels(nextModels);
        setAiModel(nextModels[0] ?? "");
        if (result.message) {
          setAiMessage(result.message);
        }
      })
      .catch((error) => {
        if (aiModelsRequestIdRef.current !== currentRequestId) {
          return;
        }
        setAiMessage(error instanceof Error ? error.message : "模型加载失败");
      })
      .finally(() => {
        if (aiModelsRequestIdRef.current !== currentRequestId) {
          return;
        }
        setAiModelsLoading(false);
      });
  }, [activeMenu, aiProvider, fetchJson]);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

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
          defaultSort: categoryDefaultSort,
        }),
      });

      setCategoryName("");
      setCategoryDescription("");
      setCategoryStyle("CARD");
      setCategoryDefaultSort("HOT");
      setCategoryModalOpen(false);
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

  function toGithubRepoTitle(name: string) {
    return name
      .replace(/\.git$/i, "")
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
      .join("")
      .replace(/Ai/g, "AI")
      .replace(/Llm/g, "LLM")
      .replace(/Gpt/g, "GPT")
      .replace(/Api/g, "API")
      .replace(/Ui/g, "UI");
  }

  function updateBatchDraft(id: string, patch: Partial<BatchSiteDraft>) {
    setBatchDrafts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeBatchDraft(id: string) {
    setBatchDrafts((prev) => prev.filter((item) => item.id !== id));
  }

  function addTagFromInput() {
    const tags = parseTagInput(siteTagInput);
    if (tags.length === 0) {
      return;
    }

    setSiteTags((prev) => {
      const merged = [...prev];
      for (const tag of tags) {
        if (!merged.includes(tag)) {
          merged.push(tag);
        }
      }
      return merged.slice(0, 8);
    });
    setSiteTagInput("");
  }

  function removeTag(tag: string) {
    setSiteTags((prev) => prev.filter((item) => item !== tag));
  }

  function resetSiteForm() {
    setSiteTitle("");
    setSiteDescription("");
    setSiteUrl("");
    setSiteCoverImage("");
    setSiteCoverUploading(false);
    setSiteTags([]);
    setSiteTagInput("");
    setEditingSiteId("");
    setAiAnalyzeUrl("");
    setAiMessage("");
    setSuggestedCategoryName("");
    setSuggestedCategoryStyle("CARD");
    if (siteCoverInputRef.current) {
      siteCoverInputRef.current.value = "";
    }
  }

  function onOpenCreateSiteModal() {
    resetSiteForm();
    setSiteModalMode("create");
    setSiteCategoryId((prev) => {
      if (prev && categories.some((category) => category.id === prev)) {
        return prev;
      }
      return categories[0]?.id || "";
    });
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
    setSiteTags(site.tags.map((tag) => tag.name));
    setSiteModalOpen(true);
    setMessage("");
  }

  function onOpenCoverUpload() {
    siteCoverInputRef.current?.click();
  }

  async function onUploadSiteCover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setMessage("");
    setSiteCoverUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload/cover", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        router.replace("/admin/login");
        throw new Error("请先登录后台");
      }

      const result = (await response.json().catch(() => ({ message: "上传失败" }))) as {
        message?: string;
        url?: string;
      };

      if (!response.ok || !result.url) {
        throw new Error(result.message || "上传失败");
      }

      setSiteCoverImage(result.url);
      setMessage("封面上传成功");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "封面上传失败");
    } finally {
      setSiteCoverUploading(false);
      event.target.value = "";
    }
  }

  async function onAnalyzeUrl() {
    setAiMessage("");
    if (aiModelsLoading) {
      setAiMessage("模型列表加载中，请稍后再试");
      return;
    }
    if (!aiAnalyzeUrl.trim()) {
      setAiMessage("请先输入要解析的链接");
      return;
    }
    if (!aiModel) {
      setAiMessage("请先选择模型");
      return;
    }

    const safeAnalyzeUrl = normalizeUrlInput(aiAnalyzeUrl);

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
          url: safeAnalyzeUrl,
          provider: aiProvider,
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
      setAiAnalyzeUrl(safeAnalyzeUrl);
      setSiteUrl(safeAnalyzeUrl);
      if (data.coverImageUrl) {
        setSiteCoverImage(data.coverImageUrl);
      }
      setSiteTags(data.tags ?? []);
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

  async function onFetchGithubBatch() {
    setBatchProgress("");

    if (aiModelsLoading) {
      setBatchProgress("模型列表加载中，请稍后再试");
      return;
    }

    if (!aiModel) {
      setBatchProgress("请先选择模型");
      return;
    }

    setBatchLoading(true);
    setBatchDrafts([]);

    try {
      const query = batchQuery.trim() || DEFAULT_BATCH_QUERY;
      const selectedPreset = BATCH_QUERY_PRESETS.find((item) => item.key === batchQueryPresetKey);
      const forcedCategoryName = selectedPreset?.categoryName ?? "";
      const forcedCategory = forcedCategoryName
        ? categories.find((item) => item.name.trim().toLowerCase() === forcedCategoryName.trim().toLowerCase())
        : undefined;

      const repoResult = await fetchJson<{ repos: GithubRepoDraft[] }>(
        `/api/admin/github/repos?query=${encodeURIComponent(query)}&limit=${batchLimit}`,
      );
      const repos = repoResult.repos ?? [];

      if (repos.length === 0) {
        setBatchProgress("没有抓取到可新增的仓库（已自动排除站内已有链接），请调整关键词重试");
        return;
      }

      const drafts: BatchSiteDraft[] = [];

      for (let index = 0; index < repos.length; index += 1) {
        const repo = repos[index];
        setBatchProgress(`AI 正在解析 ${index + 1}/${repos.length}：${repo.fullName}`);

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
              url: repo.url,
              provider: aiProvider,
              model: aiModel,
            }),
          });

          const data = result.data;
          if (!data) {
            throw new Error(result.message || "AI 解析为空");
          }

          drafts.push({
            id: `${repo.id}-${index}`,
            sourceUrl: repo.url,
            title: data.title || toGithubRepoTitle(repo.fullName.split("/").pop() || repo.fullName),
            description: data.description || repo.description || "",
            url: repo.homepage || repo.url,
            coverImageUrl: data.coverImageUrl || repo.coverImageUrl,
            categoryId: forcedCategory?.id || data.matchedCategoryId || "",
            suggestedCategoryName: forcedCategoryName || data.categoryName || "",
            suggestedCategoryStyle: forcedCategory?.style || data.categoryStyle || "CARD",
            tags: data.tags ?? [],
          });
        } catch {
          drafts.push({
            id: `${repo.id}-${index}`,
            sourceUrl: repo.url,
            title: toGithubRepoTitle(repo.fullName.split("/").pop() || repo.fullName),
            description:
              repo.description ||
              `${repo.fullName} 是一个热门开源 AI 项目，建议补充简介后再发布。`,
            url: repo.homepage || repo.url,
            coverImageUrl: repo.coverImageUrl,
            categoryId: forcedCategory?.id || "",
            suggestedCategoryName: forcedCategoryName || "",
            suggestedCategoryStyle: forcedCategory?.style || "CARD",
            tags: [repo.language, ...repo.topics, "开源"].filter(Boolean).slice(0, 8),
          });
        }
      }

      setBatchDrafts(drafts);
      setBatchProgress(`已生成 ${drafts.length} 条草稿，可删除/修改后发布`);
    } catch (error) {
      setBatchProgress(error instanceof Error ? error.message : "批量抓取失败");
    } finally {
      setBatchLoading(false);
    }
  }

  function findCategoryIdByName(name: string, source: AdminCategory[]) {
    const normalized = name.trim().toLowerCase();
    if (!normalized) {
      return "";
    }
    return source.find((item) => item.name.trim().toLowerCase() === normalized)?.id ?? "";
  }

  async function ensureBatchCategoryId(
    draft: BatchSiteDraft,
    createdCategoryMap: Map<string, string>,
  ) {
    if (draft.categoryId) {
      return draft.categoryId;
    }

    const name = draft.suggestedCategoryName.trim();
    if (!name) {
      throw new Error(`《${draft.title}》缺少分类，请先选择或填写推荐分类`);
    }

    const key = name.toLowerCase();
    const mappedId = createdCategoryMap.get(key);
    if (mappedId) {
      return mappedId;
    }

    const existingId = findCategoryIdByName(name, categories);
    if (existingId) {
      createdCategoryMap.set(key, existingId);
      return existingId;
    }

    const created = await fetchJson<{ category: AdminCategory }>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({
        name,
        description: "GitHub 批量爬取自动创建",
        style: draft.suggestedCategoryStyle,
      }),
    });

    createdCategoryMap.set(key, created.category.id);
    setCategories((prev) => [created.category, ...prev]);
    return created.category.id;
  }

  async function onPublishBatchDrafts() {
    setMessage("");
    setBatchProgress("");

    if (batchDrafts.length === 0) {
      setBatchProgress("请先抓取并生成草稿");
      return;
    }

    setBatchPublishing(true);

    try {
      const createdCategoryMap = new Map<string, string>();
      let successCount = 0;

      for (let index = 0; index < batchDrafts.length; index += 1) {
        const draft = batchDrafts[index];
        setBatchProgress(`发布中 ${index + 1}/${batchDrafts.length}：${draft.title}`);

        const resolvedCategoryId = await ensureBatchCategoryId(draft, createdCategoryMap);
        const safeUrl = normalizeUrlInput(draft.url || draft.sourceUrl);

        await fetchJson<{ site: AdminSite }>("/api/admin/sites", {
          method: "POST",
          body: JSON.stringify({
            title: draft.title,
            description: draft.description,
            url: safeUrl,
            coverImageUrl: draft.coverImageUrl || undefined,
            categoryId: resolvedCategoryId,
            tags: draft.tags,
          }),
        });

        successCount += 1;
      }

      setBatchDrafts([]);
      setBatchProgress(`已成功发布 ${successCount} 条站点`);
      setMessage(`批量发布成功，共 ${successCount} 条`);
      await refreshData();
      setActiveMenu("publish");
    } catch (error) {
      setBatchProgress(error instanceof Error ? error.message : "批量发布失败");
    } finally {
      setBatchPublishing(false);
    }
  }

  async function ensureSiteCategoryId() {
    const availableCategoryIds = new Set(categories.map((item) => item.id));

    if (siteCategoryId && availableCategoryIds.has(siteCategoryId)) {
      return siteCategoryId;
    }

    const fallbackCategoryId = categories[0]?.id ?? "";
    if (fallbackCategoryId) {
      setSiteCategoryId(fallbackCategoryId);
      return fallbackCategoryId;
    }

    const newCategoryName = suggestedCategoryName.trim();
    if (!autoCreateCategory || !newCategoryName) {
      throw new Error("请先创建或选择分类后再发布");
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

  function canDeleteCategory(category: AdminCategory) {
    return (category._count?.sites ?? 0) === 0 && (category._count?.submissions ?? 0) === 0;
  }

  async function onDeleteCategory(id: string) {
    setMessage("");
    try {
      await fetchJson<{ ok: boolean }>(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      setSelectedCategoryIds((prev) => prev.filter((item) => item !== id));
      setMessage("分类已删除");
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    }
  }

  async function onUpdateCategorySort(categoryId: string, defaultSort: CategorySortMode) {
    setMessage("");

    try {
      const result = await fetchJson<{ category: AdminCategory }>(`/api/admin/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify({ defaultSort }),
      });

      setCategories((prev) =>
        prev.map((item) => (item.id === categoryId ? { ...item, defaultSort: result.category.defaultSort } : item)),
      );
      setMessage("分类默认排序已更新");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "更新分类排序失败");
    }
  }

  async function onBatchDeleteCategories() {
    setMessage("");
    if (selectedCategoryIds.length === 0) {
      setMessage("请先勾选要删除的分类");
      return;
    }

    try {
      await fetchJson<{ ok: boolean; deletedCount: number }>("/api/admin/categories/batch-delete", {
        method: "POST",
        body: JSON.stringify({
          ids: selectedCategoryIds,
        }),
      });
      setSelectedCategoryIds([]);
      setMessage("批量删除成功");
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "批量删除失败");
    }
  }

  async function onCreateSite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const safeUrl = normalizeUrlInput(siteUrl);
      setSiteUrl(safeUrl);
      const resolvedCategoryId = await ensureSiteCategoryId();

      await fetchJson<{ site: AdminSite }>("/api/admin/sites", {
        method: "POST",
        body: JSON.stringify({
          title: siteTitle,
          description: siteDescription,
          url: safeUrl,
          coverImageUrl: siteCoverImage || undefined,
          categoryId: resolvedCategoryId,
          tags: siteTags,
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
      const safeUrl = normalizeUrlInput(siteUrl);
      setSiteUrl(safeUrl);
      const resolvedCategoryId = await ensureSiteCategoryId();

      await fetchJson<{ site: AdminSite }>(`/api/admin/sites/${editingSiteId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: siteTitle,
          description: siteDescription,
          url: safeUrl,
          coverImageUrl: siteCoverImage || undefined,
          categoryId: resolvedCategoryId,
          tags: siteTags,
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
      const resolvedCategoryId =
        action === "approve"
          ? reviewCategoryMap[submission.id] || submission.categoryId || categories[0]?.id || ""
          : undefined;

      if (action === "approve" && !resolvedCategoryId) {
        setMessage("请先创建或选择分类后再通过");
        return;
      }

      await fetchJson<{ ok?: boolean }>(`/api/admin/submissions/${submission.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          action,
          categoryId: resolvedCategoryId,
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

  async function onDeleteSite(site: AdminSite) {
    setMessage("");

    if (!window.confirm(`确认删除《${site.title}》吗？`)) {
      return;
    }

    try {
      await fetchJson<{ ok: boolean }>(`/api/admin/sites/${site.id}`, {
        method: "DELETE",
      });
      setMessage("站点已删除");
      await refreshData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "站点删除失败");
    }
  }

  return (
    <div className="admin-shell">
      {message ? <div className="admin-toast">{message}</div> : null}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ai-nav-logo.svg" alt="AI 前沿导航" />
          <div>
            <strong>AI 前沿导航后台</strong>
            <small>Frontier Navigation Console</small>
          </div>
        </div>

        <div className="admin-topbar-actions">
          <ThemeToggle />
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
          {loading ? <div className="admin-loading">加载中...</div> : null}

          {activeMenu === "overview" ? (
            <section className="admin-panel-group">
              <div className="admin-stat-grid">
                <div className="admin-stat-card stat-tone-1">
                  <i><Layers size={16} /></i>
                  <div className="admin-stat-content">
                    <strong>{displayStats.totalSites}</strong>
                    <small>已发布站点</small>
                  </div>
                </div>
                <div className="admin-stat-card stat-tone-2">
                  <i><ClipboardList size={16} /></i>
                  <div className="admin-stat-content">
                    <strong>{displayStats.pendingSubmissions}</strong>
                    <small>待审核投稿</small>
                  </div>
                </div>
                <div className="admin-stat-card stat-tone-3">
                  <i><Heart size={16} /></i>
                  <div className="admin-stat-content">
                    <strong>{displayStats.likes}</strong>
                    <small>总点赞</small>
                  </div>
                </div>
                <div className="admin-stat-card stat-tone-4">
                  <i><Eye size={16} /></i>
                  <div className="admin-stat-content">
                    <strong>{displayStats.views}</strong>
                    <small>总浏览</small>
                  </div>
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

            </section>
          ) : null}

          {activeMenu === "categories" ? (
            <section className="admin-panel-group">
              <section className="admin-card full-width">
                <div className="admin-site-toolbar">
                  <h2>分类列表</h2>
                  <div className="admin-site-toolbar-actions">
                    <button type="button" className="btn-primary" onClick={() => setCategoryModalOpen(true)}>
                      新增分类
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() =>
                        setSelectedCategoryIds((prev) => {
                          const deletable = categories.filter(canDeleteCategory).map((item) => item.id);
                          if (prev.length === deletable.length) {
                            return [];
                          }
                          return deletable;
                        })
                      }
                    >
                      {selectedCategoryIds.length > 0 ? "取消全选" : "全选可删"}
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => void onBatchDeleteCategories()}>
                      批量删除
                    </button>
                  </div>
                </div>
                <div className="category-list">
                  {categories.map((category) => (
                    <div key={category.id} className="category-row">
                      <label className="category-check">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.includes(category.id)}
                          disabled={!canDeleteCategory(category)}
                          onChange={(event) => {
                            setSelectedCategoryIds((prev) => {
                              if (event.target.checked) {
                                return [...prev, category.id];
                              }
                              return prev.filter((item) => item !== category.id);
                            });
                          }}
                        />
                      </label>
                      <strong>{category.name}</strong>
                      <span>{category.description || "-"}</span>
                      <small>{category.style === "CARD" ? "卡片" : "列表"}</small>
                      <div className="category-row-sort">
                        <select
                          value={category.defaultSort}
                          onChange={(event) =>
                            void onUpdateCategorySort(category.id, event.target.value as CategorySortMode)
                          }
                        >
                          <option value="HOT">默认最热</option>
                          <option value="LATEST">默认最新</option>
                        </select>
                      </div>
                      <small>站点 {category._count?.sites ?? 0} / 投稿 {category._count?.submissions ?? 0}</small>
                      <button
                        type="button"
                        className="btn-ghost category-delete-btn"
                        disabled={!canDeleteCategory(category)}
                        onClick={() => void onDeleteCategory(category.id)}
                      >
                        <Trash2 size={14} />
                        删除
                      </button>
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
                    <label className="search-shell search-shell-compact admin-site-toolbar-search">
                      <Search size={16} aria-hidden="true" />
                      <input
                        type="search"
                        value={publishSearchInput}
                        placeholder={`搜索 ${publishSearchLabel}`}
                        onChange={(event) => setPublishSearchInput(event.target.value)}
                        aria-label={`搜索 ${publishSearchLabel}`}
                      />
                    </label>
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
                    <button type="button" className="btn-ghost" onClick={() => setCategoryModalOpen(true)}>
                      新增分类
                    </button>
                  </div>
                </div>

                <div className="site-table">
                  {pagedPublishSites.map((site) => (
                    <div key={site.id} className="site-table-row site-table-row-edit">
                      <strong>{site.title}</strong>
                      <span>{site.category.name}</span>
                      <span className="site-table-hotness">热度 {site.views} 浏览 / {site.likes} 点赞</span>
                      <span>{site.tags.map((tag) => tag.name).join(" / ") || "-"}</span>
                      <div className="site-table-actions">
                        <button type="button" className="btn-ghost" onClick={() => onPickEditSite(site)}>
                          编辑
                        </button>
                        <button
                          type="button"
                          className="btn-ghost category-delete-btn"
                          onClick={() => void onDeleteSite(site)}
                        >
                          <Trash2 size={14} />
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                  {!loading && filteredPublishSites.length === 0 ? (
                    <div className="admin-empty">
                      {deferredPublishSearch
                        ? "没有搜到匹配标题，换个关键词试试。"
                        : publishCategoryFilter === "all"
                          ? "当前暂无已发布站点"
                          : "当前分类下暂无站点"}
                    </div>
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

          {activeMenu === "githubBatch" ? (
            <section className="admin-panel-group">
              <section className="admin-card full-width">
                <div className="admin-site-toolbar">
                  <h2 className="github-menu-title"><GitFork size={18} /> 批量爬取 GitHub AI 项目</h2>
                </div>

                <div className="github-batch-toolbar">
                  <select
                    value={batchQueryPresetKey}
                    onChange={(event) => {
                      const presetKey = event.target.value;
                      setBatchQueryPresetKey(presetKey);
                      const preset = BATCH_QUERY_PRESETS.find((item) => item.key === presetKey);
                      if (preset && preset.query) {
                        setBatchQuery(preset.query);
                      }
                    }}
                  >
                    {BATCH_QUERY_PRESETS.map((preset) => (
                      <option key={preset.key} value={preset.key}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={String(batchLimit)}
                    onChange={(event) => setBatchLimit(Number(event.target.value))}
                  >
                    {BATCH_LIMIT_OPTIONS.map((limit) => (
                      <option key={limit} value={limit}>
                        抓取 {limit} 条
                      </option>
                    ))}
                  </select>
                  <input
                    value={batchQuery}
                    placeholder="GitHub 搜索关键词，例如 topic:agent stars:>1000"
                    onChange={(event) => {
                      setBatchQuery(event.target.value);
                      setBatchQueryPresetKey("custom");
                    }}
                  />
                  <select
                    value={aiProvider}
                    onChange={(event) => {
                      setAiProvider(event.target.value as AiProvider);
                    }}
                  >
                    <option value="openrouter">OpenRouter（云）</option>
                    <option value="gemini">Gemini（云）</option>
                  </select>
                  <select
                    value={aiModel}
                    disabled={aiModelsLoading}
                    onChange={(event) => setAiModel(event.target.value)}
                  >
                    <option value="">请选择模型</option>
                    {aiModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={batchLoading || aiModelsLoading || batchPublishing || !aiModel}
                    onClick={() => void onFetchGithubBatch()}
                  >
                    {batchLoading ? "抓取并分析中..." : `批量抓取 ${batchLimit} 条`}
                  </button>
                </div>

                {batchProgress ? <div className="github-batch-progress">{batchProgress}</div> : null}

                <div className="github-draft-list">
                  {batchDrafts.map((draft, index) => (
                    <article key={draft.id} className="github-draft-card">
                      <header>
                        <strong>#{index + 1} {draft.title || "未命名项目"}</strong>
                        <div>
                          <a href={draft.sourceUrl} target="_blank" rel="noreferrer">
                            查看仓库
                          </a>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => removeBatchDraft(draft.id)}
                          >
                            删除
                          </button>
                        </div>
                      </header>

                      <div className="github-draft-grid">
                        <input
                          value={draft.title}
                          placeholder="标题"
                          onChange={(event) => updateBatchDraft(draft.id, { title: event.target.value })}
                        />
                        <input
                          value={draft.url}
                          placeholder="站点 URL（可改为官网链接）"
                          onChange={(event) => updateBatchDraft(draft.id, { url: event.target.value })}
                        />
                        <textarea
                          value={draft.description}
                          placeholder="描述"
                          onChange={(event) =>
                            updateBatchDraft(draft.id, {
                              description: event.target.value,
                            })
                          }
                        />
                        <input
                          value={draft.coverImageUrl}
                          placeholder="封面 URL"
                          onChange={(event) =>
                            updateBatchDraft(draft.id, {
                              coverImageUrl: event.target.value,
                            })
                          }
                        />
                        <select
                          value={draft.categoryId}
                          onChange={(event) =>
                            updateBatchDraft(draft.id, {
                              categoryId: event.target.value,
                            })
                          }
                        >
                          <option value="">按推荐分类自动创建/匹配</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <input
                          value={draft.suggestedCategoryName}
                          placeholder="推荐分类名（未命中时会自动创建）"
                          onChange={(event) =>
                            updateBatchDraft(draft.id, {
                              suggestedCategoryName: event.target.value,
                            })
                          }
                        />
                        <select
                          value={draft.suggestedCategoryStyle}
                          onChange={(event) =>
                            updateBatchDraft(draft.id, {
                              suggestedCategoryStyle: event.target.value as CategoryStyle,
                            })
                          }
                        >
                          <option value="CARD">推荐分类风格：卡片</option>
                          <option value="LIST">推荐分类风格：列表</option>
                        </select>
                        <input
                          value={draft.tags.join(", ")}
                          placeholder="标签，逗号分隔"
                          onChange={(event) =>
                            updateBatchDraft(draft.id, {
                              tags: parseTagInput(event.target.value).slice(0, 8),
                            })
                          }
                        />
                      </div>
                    </article>
                  ))}

                  {!batchLoading && batchDrafts.length === 0 ? (
                    <div className="admin-empty">先点击“批量抓取 10 条”，生成可编辑草稿后再发布。</div>
                  ) : null}
                </div>

                {batchDrafts.length > 0 ? (
                  <button
                    type="button"
                    className="btn-primary github-publish-btn"
                    disabled={batchLoading || batchPublishing}
                    onClick={() => void onPublishBatchDrafts()}
                  >
                    {batchPublishing ? "发布中..." : `确定并发布 ${batchDrafts.length} 条`}
                  </button>
                ) : null}
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
            <div className="modal-mask">
              <div className="modal-panel admin-site-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-title-row">
                  <div>
                    <h3>{siteModalMode === "edit" ? "编辑站点" : "新增站点"}</h3>
                    <p>填写站点信息后保存，支持分类和标签。</p>
                  </div>
                  <button
                    type="button"
                    className="modal-close-btn"
                    aria-label="关闭弹框"
                    onClick={onCloseSiteModal}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="ai-assist-panel">
                  <strong><Sparkles size={14} /> AI 链接解析</strong>
                  <div className="ai-assist-row">
                    <input
                      value={aiAnalyzeUrl}
                      placeholder="粘贴 GitHub / 官网链接，例如 https://github.com/vercel/next.js"
                      onChange={(event) => setAiAnalyzeUrl(event.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={aiLoading || aiModelsLoading || !aiModel}
                      onClick={() => void onAnalyzeUrl()}
                    >
                      {aiLoading ? "分析中..." : aiModelsLoading ? "加载模型..." : "AI 分析"}
                    </button>
                  </div>
                  <div className="ai-assist-meta">
                    <select
                      value={aiProvider}
                      onChange={(event) => {
                        setAiProvider(event.target.value as AiProvider);
                      }}
                    >
                      <option value="openrouter">OpenRouter（云）</option>
                      <option value="gemini">Gemini（云）</option>
                    </select>
                    <select
                      value={aiModel}
                      disabled={aiModelsLoading}
                      onChange={(event) => setAiModel(event.target.value)}
                    >
                      <option value="">请选择模型</option>
                      {aiModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
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
                  <div className="field-half cover-upload-wrap">
                    <button
                      type="button"
                      className="btn-ghost cover-upload-btn"
                      disabled={siteCoverUploading}
                      onClick={onOpenCoverUpload}
                    >
                      <Upload size={14} />
                      {siteCoverUploading ? "上传中..." : "上传封面图片"}
                    </button>
                    <input
                      ref={siteCoverInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
                      className="cover-upload-input"
                      onChange={(event) => void onUploadSiteCover(event)}
                    />
                  </div>
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
                  <div className="field-full admin-tag-editor">
                    <div className="admin-tag-list">
                      {siteTags.map((tag) => (
                        <span key={tag} className="admin-tag-chip">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)}>
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      value={siteTagInput}
                      placeholder="输入标签后按回车添加"
                      onChange={(event) => setSiteTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTagFromInput();
                        }
                      }}
                      onBlur={addTagFromInput}
                    />
                  </div>

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

          {categoryModalOpen ? (
            <div className="modal-mask" onClick={() => setCategoryModalOpen(false)}>
              <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
                <h3>新增分类</h3>
                <p>创建后可直接用于站点新增与 AI 自动归类。</p>
                <form className="admin-form admin-form-grid" onSubmit={onCreateCategory}>
                  <input
                    className="field-half"
                    required
                    value={categoryName}
                    placeholder="分类名，例如 AI 工作流"
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
                  <select
                    className="field-third"
                    value={categoryDefaultSort}
                    onChange={(event) => setCategoryDefaultSort(event.target.value as CategorySortMode)}
                  >
                    <option value="HOT">默认最热</option>
                    <option value="LATEST">默认最新</option>
                  </select>
                  <div className="field-full modal-actions">
                    <button type="button" className="btn-ghost" onClick={() => setCategoryModalOpen(false)}>
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
