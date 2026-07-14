# 致联信息 AI 门户 Phase 2：后端设计开发情况

> 状态：开发完成（Task 1-3），CI/CD 与 Docker 化待收尾。  
> 版本：2026-07-14  
> 负责人：ZH

---

## 1. 目标与边界

Phase 2 为静态门户叠加一个可管理内容的后端：

- **门户侧**：保持 Phase 1 的 Vite SSG 构建流程，`content/` 文件仍是 source of truth。
- **后端侧**：FastAPI + PostgreSQL，提供 Article / Category / Tag 的 REST API 与发布状态管理。
- **管理后台**：`/admin` 内嵌 SPA，调用后端 API，用 Basic Auth 保护。
- **内容同步**：`content/` Markdown 文件单向导入数据库；后台修改优先以数据库为准。

---

## 2. 技术栈

| 层级 | 技术 | 说明 |
|---|---|---|
| 后端框架 | FastAPI 0.115 | 与 CLPM 技术栈一致，自动生成 OpenAPI |
| ORM | SQLAlchemy 2.0 + 声明式模型 | 同步 engine，生产用 psycopg2 |
| 数据库 | PostgreSQL 16 | 本地 Docker 用 `postgres:16-alpine` |
| 迁移 | Alembic | 容器启动和服务器部署都会 `upgrade head` |
| 配置 | pydantic-settings | `.env` + 环境变量 |
| 测试 | pytest + httpx + TestClient | 22 个用例全部通过 |
| 部署 | systemd + Nginx 反向代理 | `/api` 代理到 localhost:8000 |
| 鉴权 | Basic Auth | 开发由后端/前端 env 控制；生产由 Nginx 层统一保护 `/admin` |

---

## 3. 目录结构

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 入口 + 健康检查
│   ├── config.py            # Settings 与 get_settings()
│   ├── database.py          # engine / SessionLocal / get_db
│   ├── models.py            # Article, Category, Tag
│   ├── schemas.py           # Pydantic 请求/响应模型
│   ├── services/
│   │   └── sync.py          # content/ → 数据库同步
│   ├── api/
│   │   ├── articles.py
│   │   ├── categories.py
│   │   └── tags.py
│   └── crud/
│       ├── articles.py
│       ├── categories.py
│       └── tags.py
├── alembic/
│   ├── env.py
│   ├── versions/            # 初始迁移
│   └── alembic.ini
├── tests/
│   ├── conftest.py
│   ├── test_api.py
│   ├── test_crud.py
│   └── test_sync.py
├── requirements.txt
├── Dockerfile
├── entrypoint.sh
└── pyproject.toml
```

---

## 4. 数据模型

### 4.1 Article

```python
class Article(Base):
    __tablename__ = "articles"
    id = Column(String, primary_key=True)
    slug = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    kind = Column(String, nullable=False)          # case/principle/standard/open-source/vendor
    industry = Column(String, nullable=False)
    status = Column(String, nullable=False)        # draft/pending_review/published/archived
    summary = Column(Text, nullable=False)
    body = Column(Text, default="")
    source_url = Column(String, nullable=False)
    source_title = Column(String, nullable=False)
    source_org = Column(String, nullable=False)
    source_type = Column(String, nullable=False)
    tags = Column(JSON, default=list)
    categories = Column(JSON, default=list)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
    ai_summary = Column(Text, nullable=True)
    ai_collected_at = Column(DateTime(timezone=True), nullable=True)
```

### 4.2 Category

```python
class Category(Base):
    __tablename__ = "categories"
    slug = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    order = Column(Integer, default=0)
```

### 4.3 Tag

```python
class Tag(Base):
    __tablename__ = "tags"
    slug = Column(String, primary_key=True)
    name = Column(String, nullable=False)
```

---

## 5. REST API 设计

### 5.1 文章

| 方法 | 路径 | 说明 | 查询参数 |
|---|---|---|---|
| `GET` | `/api/articles` | 列表 + 搜索 | `status`, `kind`, `industry`, `q` |
| `POST` | `/api/articles` | 创建 | Body: `ArticleCreate` |
| `GET` | `/api/articles/{id}` | 详情 | - |
| `PUT` | `/api/articles/{id}` | 全量更新 | Body: `ArticleUpdate` |
| `PATCH` | `/api/articles/{id}/status` | 状态切换 | Body: `{ "status": "published" }` |
| `DELETE` | `/api/articles/{id}` | 删除 | - |

返回列表示例：

```json
{
  "total": 10,
  "items": [
    { ... }
  ]
}
```

### 5.2 分类与标签

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/api/categories` | 全部分类 |
| `GET` | `/api/tags` | 全部标签 |

### 5.3 健康检查

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/health` | `{"status":"ok","version":"0.1.0","environment":"..."}` |

---

## 6. 配置项

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `DATABASE_URL` | 由 `DATABASE_HOST/PORT/USER/PASSWORD/NAME` 拼接 | 生产必填 |
| `ENVIRONMENT` | `development` | `development` / `production` |
| `DEBUG` | `false` | 是否开启 SQL echo |
| `CORS_ORIGINS` | `http://localhost:5173` | 逗号分隔，生产需精确 |
| `API_PREFIX` | `/api` | 路由前缀 |
| `ADMIN_USERNAME` | `admin` | 开发用 Basic Auth |
| `ADMIN_PASSWORD` | `admin` | 开发用 Basic Auth |

---

## 7. 本地开发与访问

### 7.1 安装依赖

```bash
cd backend
uv venv -p python3.11
uv pip install -r requirements.txt pytest httpx
```

### 7.2 启动数据库（Docker）

```bash
docker run -d --name zlai-db -p 5432:5432 \
  -e POSTGRES_DB=zlai \
  -e POSTGRES_USER=zlai \
  -e POSTGRES_PASSWORD=zlai \
  postgres:16-alpine
```

### 7.3 运行迁移并启动后端

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
uvicorn app.main:app --reload
```

### 7.4 访问地址

- **Swagger UI**: http://localhost:8000/docs
- **OpenAPI JSON**: http://localhost:8000/openapi.json
- **健康检查**: http://localhost:8000/health
- **文章列表**: http://localhost:8000/api/articles

### 7.5 运行测试

```bash
cd backend
DATABASE_URL=sqlite:///./test.db python -m pytest -q
```

### 7.6 同步内容到数据库

```bash
cd backend
source .venv/bin/activate
python scripts/sync-content-to-db.py
```

---

## 8. 管理后台访问

### 8.1 开发环境

```bash
cd frontend
npm run dev
```

- 管理后台：http://localhost:5173/admin
- 默认 Basic Auth 用户名/密码：`admin` / `admin`
- API 基地址：http://localhost:8000

### 8.2 生产 / Staging

- 管理后台地址：`http://ai.zlinfot.com/admin` 或 `http://staging.ai.zlinfot.com/admin`
- 由 Nginx 层 `auth_basic` 统一保护，密码文件位于 `/opt/zlinfot-ai/backend/.htpasswd`
- 前端 `/admin` 路由会加载 `AdminApp.tsx`，所有 API 调用都会携带 `Authorization: Basic ...` 头

---

## 9. Docker Compose（本地全栈）

```bash
docker compose up --build
```

服务映射：

| 服务 | 端口 | 说明 |
|---|---|---|
| `db` | 5432 | PostgreSQL |
| `backend` | 8000 | FastAPI |
| `frontend` | 5173 | Vite dev server |
| `nginx` | 80 | 反向代理，统一入口 |

Nginx 监听 `localhost:80`，将 `/api` 转发到 backend，其余静态资源由 frontend 提供。

---

## 10. 生产部署结构

```text
/opt/zlinfot-ai/
├── current -> releases/release-xxx          # 前端静态包 + 后端代码
├── previous -> releases/release-yyy
├── releases/
│   └── release-xxx/
│       ├── site/          # 前端 dist
│       ├── backend/       # backend 代码
│       └── server/        # 部署脚本 + nginx 配置 + systemd
└── backend/
    ├── venv/              # Python 虚拟环境
    ├── current -> releases/release-xxx/backend
    ├── previous -> releases/release-yyy/backend
    ├── logs/
    ├── .env               # 生产环境变量
    ├── .htpasswd          # Nginx Basic Auth
    └── systemd/
        └── zlai-backend.service
```

---

## 11. 已知问题与下一步

| 问题 | 处理 |
|---|---|
| `backend/app/main.py` 已移除 lifespan 中的 `engine.dispose()` | 不影响功能，后续可保留 lifespan 做优雅关闭 |
| 后端 API 在管理后台中尚未端到端联调 | 等 Docker Compose 验证完成 |
| 生产服务器尚未创建 `zlai-backend` 用户和 systemd 服务 | 首次部署前管理员手动初始化 |

---

## 12. 关键设计决策

| 决策 | 选择 | 原因 |
|---|---|---|
| 内容 source of truth | `content/` Markdown 文件 | 保持 Git 可审计，方便回滚 |
| 同步方向 | 文件 → 数据库单向 | 避免 Phase 2 双向同步冲突 |
| 后台鉴权 | Basic Auth | 简化，不做用户系统 |
| 后端部署 | systemd + venv | 比容器更轻，与 CLPM 一致 |
| 数据库 | PostgreSQL 16 | 关系型稳定，可全文搜索 |

