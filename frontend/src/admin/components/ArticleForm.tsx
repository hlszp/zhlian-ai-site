import { useEffect, useState } from "react";
import type { Article } from "../../types";
import api from "../services/api";

type ArticleFormValues = Omit<Article, "id" | "created_at" | "updated_at">;

const initialArticle: ArticleFormValues = {
  title: "",
  kind: "case",
  industry: "general",
  status: "draft",
  summary: "",
  body: "",
  source_url: "",
  source_title: "",
  source_org: "",
  source_type: "other",
  tags: [],
  categories: [],
};

interface ArticleFormProps {
  initialValues?: Partial<ArticleFormValues>;
  onSubmit: (values: ArticleFormValues) => Promise<void>;
}

export default function ArticleForm({ initialValues, onSubmit }: ArticleFormProps) {
  const [values, setValues] = useState<ArticleFormValues>({ ...initialArticle, ...initialValues });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, _setCategories] = useState<{ slug: string; name: string }[]>([]);
  const [_tags, setTags] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    void api.listCategories().then(_setCategories).catch(() => {});
    void api.listTags().then(setTags).catch(() => {});
  }, []);

  const updateField = <K extends keyof ArticleFormValues>(
    field: K,
    value: ArticleFormValues[K]
  ) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await onSubmit(values);
      setMessage("保存成功");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const kindOptions: Article["kind"][] = ["case", "principle", "standard", "open-source", "vendor"];
  const industryOptions: Article["industry"][] = [
    "general",
    "chemical",
    "metallurgy",
    "building-material",
    "pharma",
    "agrochemical",
    "coating",
    "electronic-chemical",
  ];
  const sourceTypeOptions: Article["source_type"][] = [
    "standard",
    "paper",
    "blog",
    "repo",
    "vendor",
    "other",
  ];
  const statusOptions: Article["status"][] = ["draft", "pending_review", "published", "archived"];

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      {message && (
        <div
          className={`admin-message ${message.includes("失败") ? "error" : "success"}`}
        >
          {message}
        </div>
      )}

      <div className="form-row">
        <label>
          标题
          <input
            type="text"
            required
            value={values.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </label>
      </div>

      <div className="form-row two-cols">
        <label>
          类型
          <select value={values.kind} onChange={(e) => updateField("kind", e.target.value as Article["kind"])}>
            {kindOptions.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </label>

        <label>
          行业
          <select value={values.industry} onChange={(e) => updateField("industry", e.target.value as Article["industry"])}>
            {industryOptions.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row two-cols">
        <label>
          状态
          <select value={values.status} onChange={(e) => updateField("status", e.target.value as Article["status"])}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          来源类型
          <select
            value={values.source_type}
            onChange={(e) => updateField("source_type", e.target.value as Article["source_type"])}
          >
            {sourceTypeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          摘要
          <textarea
            rows={4}
            required
            value={values.summary}
            onChange={(e) => updateField("summary", e.target.value)}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          正文（Markdown）
          <textarea
            rows={16}
            value={values.body}
            onChange={(e) => updateField("body", e.target.value)}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          来源 URL
          <input
            type="url"
            required
            value={values.source_url}
            onChange={(e) => updateField("source_url", e.target.value)}
          />
        </label>
      </div>

      <div className="form-row two-cols">
        <label>
          来源标题
          <input
            type="text"
            required
            value={values.source_title}
            onChange={(e) => updateField("source_title", e.target.value)}
          />
        </label>

        <label>
          来源机构
          <input
            type="text"
            required
            value={values.source_org}
            onChange={(e) => updateField("source_org", e.target.value)}
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          分类（逗号分隔）
          <input
            type="text"
            value={values.categories?.join(", ") || ""}
            onChange={(e) =>
              updateField(
                "categories",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          标签（逗号分隔）
          <input
            type="text"
            value={values.tags?.join(", ") || ""}
            onChange={(e) =>
              updateField(
                "tags",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
          />
        </label>
      </div>

      <div className="form-row">
        <button type="submit" disabled={saving} className="admin-button primary">
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}
