import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Article } from "../../types";
import api from "../services/api";

const statusLabels: Record<Article["status"], string> = {
  draft: "草稿",
  pending_review: "待审",
  published: "已发布",
  archived: "已归档",
};

export default function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ status: "", kind: "", industry: "", q: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.listArticles(filters);
      setArticles(response.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filters.status, filters.kind, filters.industry]);

  const handlePublish = async (id: string) => {
    try {
      await api.updateArticleStatus(id, "published");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "发布失败");
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await api.updateArticleStatus(id, "archived");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "归档失败");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("确定删除这篇文章？")) return;
    try {
      await api.deleteArticle(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "删除失败");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>文章管理</h1>
        <Link to="/admin/articles/new" className="admin-button primary">
          新建文章
        </Link>
      </div>

      <div className="admin-filters">
        <select
          aria-label="按文章状态筛选"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="pending_review">待审</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>

        <select
          aria-label="按文章类型筛选"
          value={filters.kind}
          onChange={(e) => setFilters((f) => ({ ...f, kind: e.target.value }))}
        >
          <option value="">全部类型</option>
          <option value="case">案例</option>
          <option value="principle">原理</option>
          <option value="standard">标准</option>
          <option value="open-source">开源</option>
          <option value="vendor">厂商</option>
        </select>

        <select
          aria-label="按行业筛选"
          value={filters.industry}
          onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value }))}
        >
          <option value="">全部行业</option>
          <option value="general">通用</option>
          <option value="chemical">化工</option>
          <option value="metallurgy">冶金</option>
          <option value="building-material">建材</option>
          <option value="pharma">制药</option>
          <option value="agrochemical">农化</option>
          <option value="coating">涂料</option>
          <option value="electronic-chemical">电子化学品</option>
        </select>

        <input
          type="text"
          aria-label="按标题搜索文章"
          placeholder="搜索标题..."
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button onClick={load} className="admin-button">搜索</button>
      </div>

      {error && <div className="admin-error" role="alert">{error}</div>}

      {loading ? (
        <div className="admin-loading" role="status" aria-live="polite">加载中...</div>
      ) : (
        <div>
          <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            共 {articles.length} 篇文章
          </span>
          <table className="admin-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>类型</th>
              <th>行业</th>
              <th>状态</th>
              <th>更新时间</th>
              <th style={{ width: 220 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-empty">暂无文章</td>
              </tr>
            )}
            {articles.map((article) => (
              <tr key={article.id}>
                <td>{article.title}</td>
                <td>{article.kind}</td>
                <td>{article.industry}</td>
                <td>{statusLabels[article.status]}</td>
                <td>{new Date(article.updated_at).toLocaleString()}</td>
                <td>
                  <Link to={`/admin/articles/${article.id}/edit`} className="admin-link">
                    编辑
                  </Link>
                  {article.status !== "published" && (
                    <button
                      onClick={() => handlePublish(article.id)}
                      className="admin-button small"
                    >
                      发布
                    </button>
                  )}
                  {article.status !== "archived" && (
                    <button
                      onClick={() => handleArchive(article.id)}
                      className="admin-button small secondary"
                    >
                      归档
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="admin-button small danger"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
