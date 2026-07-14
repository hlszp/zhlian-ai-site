import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ArticleForm from "../components/ArticleForm";
import type { Article } from "../../types";
import api from "../services/api";

export default function ArticleEdit() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api
      .getArticle(id)
      .then(setArticle)
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: Partial<Article>) => {
    if (!id) return;
    await api.updateArticle(id, values);
  };

  if (loading) return <div className="admin-loading">加载中...</div>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!article) return <div className="admin-empty">文章不存在</div>;

  return (
    <div className="admin-page">
      <h1>编辑文章：{article.title}</h1>
      <ArticleForm initialValues={article} onSubmit={handleSubmit} />
    </div>
  );
}
