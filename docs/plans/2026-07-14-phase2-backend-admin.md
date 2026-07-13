# Phase 2 实施计划：后端 API + 管理后台 + Staging 环境

> **目标：** 建立 FastAPI + PostgreSQL 后端与 `/admin` 管理后台，支持内容 CRUD 和发布状态；同时引入 `staging.ai.zlinfot.com` 预览环境，实现每阶段可独立验证和自动部署。  
> **周期：** 3-4 周  
> **前提决策：** staging 子域 `staging.ai.zlinfot.com`；管理后台只做到 CRUD + 发布状态，不做用户登录；后端与数据库按工程最佳实践选型。

---

## Phase 2 总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层（Frontend）                     │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  门户首页 / 专题页    │  │  管理后台 /admin             │  │
│  │  React + Vite SSG     │  │  React + Vite + API 调用     │  │
│  │  构建时读取 site-data  │  │  Basic Auth 保护             │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        API 层（Backend）                    │
│              FastAPI + SQLAlchemy + PostgreSQL              │
│  提供：Article/Category/Tag CRUD、搜索、发布状态、健康检查     │
│  双向内容同步：content/ 文件 ↔ 数据库                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 技术选型（最佳实践）

| 层级 | 技术 | 理由 |
|------|------|------|
| 后端框架 | FastAPI | 与 CLPM 一致，异步、自动生成 OpenAPI |
| ORM | SQLAlchemy 2.0 + 声明式模型 | 团队熟悉，迁移工具成熟 |
| 数据库 | PostgreSQL 15/16 | 关系型数据 + 全文搜索扩展，稳定可控 |
| 迁移 | Alembic | 生产数据库 schema 版本管理 |
| 后端运行 | uvicorn + systemd（生产） | 简单、可回滚、资源占用低 |
| 容器化 | Docker Compose（本地开发） | 一键启动，与生产解耦 |
| 鉴权 | HTTP Basic Auth（Phase 2） | 避免登录复杂度，Nginx 层即可控制 |
| 环境管理 | Python `python-dotenv` | 本地 `.env`、生产环境变量 |
| 测试 | pytest + pytest-async + httpx | 覆盖 API 和 CRUD |

---

## 目录结构（Phase 2 终态）

```
zhilianAI-site/
├── .github/workflows/
│   ├── ci.yml                    # 校验 + 测试
│   ├── deploy-staging.yml        # 部署到 staging.ai.zlinfot.com
│   └── deploy-production.yml     # 部署到 ai.zlinfot.com
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI 入口 + 健康检查
│   │   ├── models.py             # SQLAlchemy 模型
│   │   ├── schemas.py            # Pydantic schemas
│   │   ├── database.py           # engine/session/依赖
│   │   ├── config.py             # 配置（pydantic-settings）
│   │   ├── api/
│   │   │   ├── articles.py
│   │   │   ├── categories.py
│   │   │   ├── tags.py
│   │   │   └── sync.py           # 文件 ↔ 数据库同步
│   │   ├── crud/
│   │   │   ├── articles.py
│   │   │   ├── categories.py
│   │   │   └── tags.py
│   │   └── services/
│   │       └── sync.py           # 内容同步逻辑
│   ├── alembic/                  # 迁移脚本
│   ├── tests/                    # pytest 测试
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── requirements.txt
├── content/                      # 内容源文件（保持人工编辑）
├── frontend/
│   ├── src/
│   │   ├── admin/                # 管理后台页面
│   │   │   ├── AdminApp.tsx
│   │   │   ├── pages/
│   │   │   │   ├── ArticleList.tsx
│   │   │   │   ├── ArticleEdit.tsx
│   │   │   │   └── ArticleNew.tsx
│   │   │   └── services/
│   │   │       └── api.ts
│   │   ├── components/           # 门户组件（Phase 1 已拆分）
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── deploy.sh                 # 静态部署
│   ├── rollback.sh
│   ├── health-check.sh
│   ├── ai.zlinfot.com.conf
│   ├── staging.ai.zlinfot.com.conf
│   └── backend-deploy.sh         # 后端部署脚本
├── docker-compose.yml            # 本地开发：前端 + 后端 + 数据库
├── scripts/
│   ├── package.sh
│   ├── build-content.py
│   ├── validate-content.py
│   └── sync-content-to-db.py     # 手动同步 content/ 到数据库
└── README.md
```

---

## 任务清单

### Task 1：设计数据库 Schema 与模型

**Objective：** 定义 articles、categories、tags 三张表，支持发布状态和内容同步。

**Files：**
- `backend/app/models.py`
- `backend/app/schemas.py`
- `backend/app/database.py`
- `backend/alembic.ini` + `alembic/env.py`

**Schema 设计：**

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

class Category(Base):
    __tablename__ = "categories"
    slug = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    order = Column(Integer, default=0)

class Tag(Base):
    __tablename__ = "tags"
    slug = Column(String, primary_key=True)
    name = Column(String, nullable=False)
```

**验收标准：**
- Alembic 初始迁移可生成并执行
- `python backend/app/models.py` 不报错（仅导入测试）

---

### Task 2：搭建 FastAPI 后端骨架

**Objective：** 项目结构、配置、依赖、健康检查、CORS。

**Files：**
- `backend/app/main.py`
- `backend/app/config.py`
- `backend/app/database.py`
- `backend/requirements.txt`
- `backend/pyproject.toml`

**验收标准：**
- `cd backend && uvicorn app.main:app --reload` 启动
- `http://localhost:8000/health` 返回 `{"status":"ok"}`
- `http://localhost:8000/docs` 可访问 Swagger UI

---

### Task 3：实现内容 CRUD API

**Objective：** 为 Article / Category / Tag 提供完整 REST API。

**Files：**
- `backend/app/api/articles.py`
- `backend/app/api/categories.py`
- `backend/app/api/tags.py`
- `backend/app/crud/articles.py`
- `backend/app/crud/categories.py`
- `backend/app/crud/tags.py`

**API 设计：**

```
GET    /api/articles            # 列表，支持 ?status=&kind=&industry=&q=
POST   /api/articles            # 创建
GET    /api/articles/{id}       # 详情
PUT    /api/articles/{id}       # 全量更新
PATCH  /api/articles/{id}/status # 更新发布状态
DELETE /api/articles/{id}       # 删除（软删除？不，直接删除）
GET    /api/categories
GET    /api/tags
```

**验收标准：**
- pytest 覆盖 80% 的 CRUD 路径
- `scripts/validate-content.py` 继续通过

---

### Task 4：文件 ↔ 数据库同步

**Objective：** 保持 `content/` 文件作为 source of truth，同时后端可加载这些文件到数据库。

**Files：**
- `backend/app/services/sync.py`
- `scripts/sync-content-to-db.py`（手动触发）
- `backend/app/api/sync.py`（可选，后端内嵌同步 endpoint）

**同步策略：**
- 单向同步：文件 → 数据库（Phase 2）
- 管理后台修改后，如果和文件冲突，以数据库为准（未来再双向同步）
- 构建门户时仍走 `scripts/build-content.py` 读取文件，不依赖数据库

**验收标准：**
- 同步后数据库记录数与 `content/` 一致
- 重复执行同步为幂等（按 slug 更新）

---

### Task 5：本地 Docker Compose 开发环境

**Objective：** 一键启动前端 + 后端 + 数据库。

**Files：**
- `docker-compose.yml`
- `backend/Dockerfile`
- `.env.example`

**服务：**
```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: zlai
      POSTGRES_USER: zlai
      POSTGRES_PASSWORD: zlai
    volumes:
      - pgdata:/var/lib/postgresql/data
  backend:
    build: ./backend
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://zlai:zlai@db:5432/zlai
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]
```

**验收标准：**
- `docker compose up --build` 启动
- 门户可访问 `http://localhost:5173`
- API 可访问 `http://localhost:8000`
- 管理后台可访问 `http://localhost:5173/admin`

---

### Task 6：管理后台 `/admin`

**Objective：** 在门户中内嵌管理后台，支持文章列表、新建、编辑、发布状态切换。

**Files：**
- `frontend/src/admin/AdminApp.tsx`
- `frontend/src/admin/pages/ArticleList.tsx`
- `frontend/src/admin/pages/ArticleEdit.tsx`
- `frontend/src/admin/pages/ArticleNew.tsx`
- `frontend/src/admin/services/api.ts`
- `frontend/src/App.tsx`（增加 `/admin` 路由）

**UI 设计：**
- 简洁表格，列：标题、分类、行业、状态、更新时间、操作（编辑/发布/归档）
- 编辑页：标题、摘要、正文（Markdown 编辑器）、来源信息、状态、分类、标签
- 顶部状态提示：保存成功 / 失败

**鉴权：**
- 开发环境：Basic Auth 用户名/密码从环境变量读取
- 生产环境：Nginx 层统一加 Basic Auth，前端只负责调用 API 时携带 credentials

**验收标准：**
- 可新增文章并保存到数据库
- 可修改发布状态
- 可查看文章列表

---

### Task 7：Staging 环境与 CI/CD 双轨部署

**Objective：** 每个 Phase 合并到 `main` 后先自动部署到 staging，人工确认后触发生产部署。

**部署策略：**

```
PR 合并到 main
    │
    ├─► 自动触发 deploy-staging.yml
    │        ├─ 构建前端静态包
    │        ├─ 打包后端
    │        ├─ 部署到 staging.ai.zlinfot.com
    │        └─ 公网 HTTP 验证
    │
    ▼
  staging.ai.zlinfot.com 可预览
    │
    ├─ 人工触发 deploy-production.yml（workflow_dispatch）
    │        ├─ 复用 staging 验证过的包
    │        ├─ 部署到 ai.zlinfot.com
    │        └─ 公网 HTTP 验证 + 失败回滚
```

**Files：**
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`（从 `deploy.yml` 重命名）
- `server/staging.ai.zlinfot.com.conf`（Nginx 配置）
- `server/backend-deploy.sh`（后端部署脚本）
- `server/backend-rollback.sh`（后端回滚脚本）

**服务器目录结构：**
```
/opt/zlinfot-ai/
├── current -> releases/release-xxx
├── previous -> releases/release-yyy
├── releases/
│   ├── release-xxx/
│   │   ├── site/              # 前端静态文件
│   │   ├── backend/           # 后端代码
│   │   └── server/            # 部署脚本
│   └── release-yyy/...
└── backend/
    ├── venv/
    ├── current -> /opt/zlinfot-ai/releases/release-xxx/backend
    ├── logs/
    └── systemd/zlai-backend.service
```

**验收标准：**
- `staging.ai.zlinfot.com` 可访问
- 生产部署保留原有回滚能力
- 管理后台在 staging 可登录测试

---

### Task 8：更新文档与 README

**Objective：** 记录本地开发、部署、后端管理流程。

**Files：**
- `README.md`（更新 Phase 2 内容）
- `docs/phase2-backend-admin.md`（本计划）
- `backend/README.md`（API 说明）

---

## 关键决策

| 决策 | 选择 | 说明 |
|------|------|------|
| 数据库 | PostgreSQL 16 | 关系型、稳定、支持全文搜索 |
| ORM | SQLAlchemy 2.0 | 与 CLPM 一致 |
| 迁移 | Alembic | 生产 schema 管理 |
| 后台鉴权 | Basic Auth | 第一阶段简化，避免用户系统 |
| 渲染模式 | 门户 SSG + 后台 CSR | 门户速度优先，后台灵活优先 |
| 内容同步 | 文件 → 数据库（单向） | 保留 content/ 作为 Git 可审计源 |
| 部署 | staging 自动 + 生产手动 | 降低自动部署到生产的风险 |

---

## 风险与规避

| 风险 | 规避 |
|------|------|
| 后端增加运维复杂度 | 先本地 Docker，生产用 systemd + 容器化数据库 |
| 管理后台暴露风险 | Nginx Basic Auth + IP 白名单（可选） |
| 数据库数据丢失 | 部署前备份、定期 pg_dump |
| 内容同步冲突 | Phase 2 单向同步，管理后台修改以数据库为准 |
| 环境配置泄漏 | 所有密钥走 GitHub Secrets / 服务器环境变量 |

---

## 下一步行动

1. 平总审阅本计划，确认 staging 子域和 Basic Auth 方案
2. 创建 `phase2/backend-admin` 分支
3. 按 Task 1-8 拆分并行子代理执行
4. 每完成一个 Task 在 staging 验证
5. 全部完成后合并到 main，自动部署 staging
6. 人工确认后触发生产部署
