import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import ArticleList from "./pages/ArticleList";
import ArticleNew from "./pages/ArticleNew";
import ArticleEdit from "./pages/ArticleEdit";
import "../admin.css";

export default function AdminApp() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">致联 AI 管理后台</div>
        <nav className="admin-nav">
          <NavLink to="/admin/articles" end className="admin-nav-link">
            文章列表
          </NavLink>
          <NavLink to="/admin/articles/new" className="admin-nav-link">
            新建文章
          </NavLink>
        </nav>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route path="/" element={<Navigate to="articles" replace />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/articles/new" element={<ArticleNew />} />
          <Route path="/articles/:id/edit" element={<ArticleEdit />} />
        </Routes>
      </main>
    </div>
  );
}
