export type ArticleKind = "case" | "principle" | "standard" | "open-source" | "vendor";
export type Industry = "general" | "chemical" | "metallurgy" | "building-material" | "pharma" | "agrochemical" | "coating" | "electronic-chemical";
export type ContentStatus = "draft" | "pending_review" | "published" | "archived";
export type SourceType = "standard" | "paper" | "blog" | "repo" | "vendor" | "other";

export interface Article {
  id: string;
  title: string;
  kind: ArticleKind;
  industry: Industry;
  status: ContentStatus;
  summary: string;
  body?: string;
  source_url: string;
  source_title: string;
  source_org: string;
  source_type: SourceType;
  tags?: string[];
  categories?: string[];
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  order?: number;
}

export interface Tag {
  slug: string;
  name: string;
}

export interface SiteMeta {
  generated_at: string;
  version: string;
}

export interface SiteData {
  meta: SiteMeta;
  categories: Category[];
  tags: Tag[];
  articles: Article[];
}
