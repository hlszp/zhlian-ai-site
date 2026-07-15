import type { Article, Category, Tag } from "../../types";

const API_BASE =
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_BASE_URL || "";

let cachedCredentials: string | null = null;

function getBasicAuthHeader(): string {
  if (!cachedCredentials) {
    const username = window.prompt("请输入管理后台用户名：") || "";
    const password = window.prompt("请输入管理后台密码：") || "";
    if (!username || !password) {
      throw new Error("需要用户名和密码才能访问管理后台 API");
    }
    cachedCredentials = `Basic ${btoa(`${username}:${password}`)}`;
  }
  return cachedCredentials;
}

export function clearCredentials(): void {
  cachedCredentials = null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Authorization")) {
    headers.set("Authorization", getBasicAuthHeader());
  }
  if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    clearCredentials();
    throw new Error("认证失败，请刷新页面重试");
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "未知错误");
    throw new Error(`请求失败 ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface ArticleListParams {
  status?: string;
  kind?: string;
  industry?: string;
  q?: string;
}

export const api = {
  listArticles: (params: ArticleListParams = {}) =>
    request<{ total: number; items: Article[] }>
    (`/api/articles?${new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
      ) as [string, string][]
    ).toString()}`),

  getArticle: (id: string) => request<Article>(`/api/articles/${id}`),

  createArticle: (data: Omit<Article, "id" | "created_at" | "updated_at">) =>
    request<Article>("/api/articles", { method: "POST", body: JSON.stringify(data) }),

  updateArticle: (id: string, data: Partial<Article>) =>
    request<Article>(`/api/articles/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  updateArticleStatus: (id: string, status: Article["status"]) =>
    request<Article>(`/api/articles/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  deleteArticle: (id: string) => request<void>(`/api/articles/${id}`, { method: "DELETE" }),

  listCategories: () => request<Category[]>("/api/categories"),
  listTags: () => request<Tag[]>("/api/tags"),
};

export default api;
