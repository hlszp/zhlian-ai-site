import { useNavigate } from "react-router-dom";
import ArticleForm from "../components/ArticleForm";
import type { Article } from "../../types";
import api from "../services/api";

export default function ArticleNew() {
  const navigate = useNavigate();

  const handleSubmit = async (values: Omit<Article, "id" | "created_at" | "updated_at">) => {
    const article = await api.createArticle(values);
    navigate(`/admin/articles/${article.id}/edit`);
  };

  return (
    <div className="admin-page">
      <h1>新建文章</h1>
      <ArticleForm onSubmit={handleSubmit} />
    </div>
  );
}
