# 流程工业 AI 知识平台系统性改造规划

> **版本：** v1.0  
> **日期：** 2026-07-13  
> **目标读者：** 平总及致联工业 AI 研究团队  
> **定位：** 将当前静态知识门户改造为具备前后端、内容管理和智能体内容采集能力的流程工业 AI 知识平台。

---

## 1. 核心定位与边界

### 1.1 定位

致联信息「流程工业 AI 与智能体」知识平台，面向流程工业从业者，系统呈现自动化、信息化、数字化、智能化及工业 AI 应用的知识、案例、标准、文献与工具生态。

### 1.2 原则边界

| 边界 | 说明 |
|------|------|
| 知识门户，不是产品展台 | 内容覆盖工业 AI 全领域，不只展示 PDS/CLPM 等自有产品 |
| 人机协同，AI 不直接发布 | 智能体负责采集、摘要、草稿；人工审核后才能发布 |
| 来源可追溯 | 每条内容保留来源 URL、采集时间、AI 摘要、人工审核记录 |
| 渐进式改造 | 分阶段推进，每阶段均可独立上线和自动部署 |
| 安全优先 | 不暴露后台、不引入未经验证的第三方依赖、生产密钥不入仓库 |

---

## 2. 目标架构（终态）

```
┌─────────────────────────────────────────────────────────────────────┐
│                          用户层（Frontend）                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   门户首页       │  │   专题/列表页    │  │   管理后台 /admin│     │
│  │  React + Vite    │  │  React + Vite    │  │  React + Vite    │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API 层（Backend）                            │
│  FastAPI + SQLAlchemy + PostgreSQL + Redis（可选）                    │
│  提供：内容 CRUD、分类/标签、搜索、发布状态、Webhook、采集任务管理      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│      内容数据库      │  │     智能体工作流     │  │      外部数据源      │
│  PostgreSQL         │  │  Hermes cron 定时任务│  │  arXiv 工业 AI/控制   │
│  articles           │  │  网络搜索 + 抓取      │  │  ISA/NAMUR/OPC 标准   │
│  categories, tags   │  │  摘要 + 分类 + 草稿   │  │  厂商博客/技术文档     │
│  sources, reviews   │  │  提交 CMS 待审队列    │  │  开源仓库 Release     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

### 2.1 技术栈选择

| 层级 | 技术 | 理由 |
|------|------|------|
| 前端门户 | React + TypeScript + Vite | 与现有项目一致，迁移成本低 |
| 管理后台 | React + Vite（复用组件） | 共享 UI 组件和构建流程 |
| 后端 API | FastAPI + SQLAlchemy | 与 CLPM 技术栈一致，团队熟悉 |
| 数据库 | PostgreSQL | 关系型数据 + 全文搜索，稳定可控 |
| 缓存/队列 | Redis（可选） | 任务队列、缓存、会话 |
| 部署 | Docker Compose + GitHub Actions | 与现有自动部署兼容 |
| 智能体 | Hermes cron + delegate_task | 复用现有 Agent 基础设施 |
| 内容存储 | Markdown + YAML frontmatter | 兼顾人工编辑和自动化生成 |

---

## 3. 分阶段改造路线

### Phase 1：内容数据化与结构化（2-3 周）

**目标**：将 `src/App.tsx` 中的硬编码内容迁移到 `content/` 数据目录，网站仍可静态构建并自动部署。

| 任务 | 说明 | 关键产出 |
|------|------|----------|
| 定义内容模型 | 统一 `Article` / `Category` / `Tag` / `Source` 结构 | `docs/content-model.md` |
| 迁移现有内容 | 将首页、行业卡片、知识库条目等拆成 Markdown + YAML | `content/` 下结构化文件 |
| 构建时读取内容 | Vite 插件或 Python 脚本将 `content/` 生成 `site-data.json` | `scripts/build-content.py` |
| 前端组件化 | 拆分 `App.tsx` 为 `Hero`、`KnowledgeMap`、`IndustryGrid`、`Library`、`Footer` 等 | `src/components/` |
| 保持自动部署 | 不改动 CI/CD 主流程，仍构建静态文件 | `npm run build` 通过 |

**Phase 1 完成后效果：**
- 更新内容只需修改 `content/` 下的 Markdown/JSON
- 非研发人员可参与内容维护
- 自动部署链路完整保留

---

### Phase 2：引入后端 API 与内容管理后台（3-4 周）

**目标**：建立内容管理后台，支持内容的增删改查、发布状态、版本历史。

| 任务 | 说明 | 关键产出 |
|------|------|----------|
| 设计数据库 Schema | articles, categories, tags, sources, reviews, users | `backend/migrations/` |
| 搭建 FastAPI 后端 | 项目结构、依赖、配置、健康检查 | `backend/` |
| 实现内容 API | CRUD、搜索、分类过滤、发布/草稿 | `backend/api/articles.py` |
| 实现管理后台 | 门户内嵌 `/admin` 路由，文章列表/编辑/发布 | `src/admin/` |
| 容器化本地开发 | `docker-compose.yml` 包含后端 + 数据库 | `docker-compose.yml` |
| 更新 CI/CD | 后端测试、构建镜像或打包后端代码 | `.github/workflows/ci.yml` |

**Phase 2 完成后效果：**
- 可通过 `/admin` 管理内容
- 门户内容可由 API 驱动，但也可保留构建时静态生成
- 本地开发一键启动 `docker-compose up`

---

### Phase 3：智能体内容采集工作流（4-6 周）

**目标**：让 Hermes 定时任务自动搜索、整理、生成草稿，推送到 CMS 待审。

| 任务 | 说明 | 关键产出 |
|------|------|----------|
| 定义采集源清单 | arXiv、ISA、NAMUR、OPC Foundation、厂商博客、开源仓库 | `docs/sources.md` |
| 设计采集任务 | 定时搜索、抓取、去重、摘要、分类 | `agent-tasks/collect-papers/` |
| 实现采集 Agent | 使用 Hermes `cronjob` 或 `delegate_task` | `cron` 任务配置 |
| 提交 CMS 待审 | Agent 通过后端 API 提交草稿，状态为 `pending_review` | 后端 API 扩展 |
| 人工审核队列 | 后台「待审」列表，支持编辑、批准、拒绝 | 管理后台扩展 |
| 审核后发布 | 批准后更新数据库，并可选触发重新构建门户 | 发布工作流 |

**Phase 3 完成后效果：**
- 形成「AI 采集 → 人工审核 → 自动发布」闭环
- 大幅减少人工搬运内容成本

---

### Phase 4：增强能力（6-12 周，可选）

| 任务 | 说明 |
|------|------|
| 全文搜索 | 集成 PostgreSQL full-text search 或 Meilisearch |
| 知识图谱可视化 | 复用 zpwiki 的 Neo4j + D3 能力，展示概念关系 |
| 用户反馈 | 内容纠错、推荐、收藏（需登录） |
| 多语言内容 | 关键内容支持中英文 |
| 更新订阅 | 飞书/邮件推送新内容摘要 |
| 内容分析看板 | 内容增长、来源分布、审核效率统计 |

---

## 4. 内容模型（Content Model）

### 4.1 文章 Article

```yaml
id: uuid
slug: control-loop-diagnostic-agent
title: 控制回路诊断智能体
kind: 案例          # 案例 / 原理 / 文献 / 开源 / 供应商 / 工具
industry: 化工      # 通用 / 化工 / 冶金 / 建材 / 医药 / 农药 / 涂料 / 电子化学品
status: published   # draft / pending_review / published / archived
summary: 从回路筛选、指标计算、振荡与粘滞诊断... 
body: |
  详细正文，支持 Markdown
source_url: https://www.isa.org/...
source_title: Control Loop Performance Monitoring
source_org: ISA
source_type: 标准文献    # 标准 / 论文 / 博客 / 仓库 / 厂商 / 其他
tags:
  - CLPM
  - PID
  - 振荡检测
  - 时序分析
categories:
  - 控制回路诊断
  - 智能体应用
reviewed_by: 张三
reviewed_at: 2026-07-13T10:00:00Z
created_at: 2026-07-12T08:00:00Z
updated_at: 2026-07-13T10:00:00Z
ai_summary: "AI 生成摘要..."
ai_collected_at: 2026-07-12T08:00:00Z
```

### 4.2 分类 Category

```yaml
id: uuid
slug: control-loop-diagnosis
name: 控制回路诊断
description: 围绕 PID、振荡、粘滞、阀门定位等控制回路性能问题
order: 10
```

### 4.3 标签 Tag

```yaml
id: uuid
slug: clpm
name: CLPM
```

### 4.4 来源 Source

```yaml
id: uuid
name: ISA
base_url: https://www.isa.org
source_type: 标准组织
fetch_strategy: rss    # rss / arxiv / search_api / manual
last_fetched_at: ...
```

---

## 5. 目录结构改造（终态）

```
zhilianAI-site/
├── .github/workflows/          # CI/CD
│   ├── ci.yml
│   ├── deploy.yml
│   └── backend-check.yml        # 后端测试
├── agent-tasks/                 # 智能体采集任务
│   ├── collect-arxiv-papers/
│   ├── collect-isa-updates/
│   └── collect-vendor-blogs/
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── crud/
│   │   ├── api/
│   │   │   ├── articles.py
│   │   │   ├── categories.py
│   │   │   ├── tags.py
│   │   │   └── sources.py
│   │   ├── services/
│   │   │   └── search.py
│   │   └── core/
│   │       └── config.py
│   ├── migrations/
│   ├── tests/
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── requirements.txt
├── content/                     # 内容源文件
│   ├── articles/
│   ├── categories.json
│   └── tags.json
├── docs/                        # 设计文档与规划
│   ├── plans/
│   │   └── 2026-07-13-portal-redesign.md
│   ├── content-model.md
│   └── sources.md
├── frontend/                    # 前端门户 + 管理后台
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── admin/
│   │   ├── pages/
│   │   ├── services/
│   │   │   └── api.ts
│   │   └── App.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── scripts/
│   ├── package.sh
│   ├── build-content.py         # 构建时生成内容数据
│   └── deploy-backend.sh        # 后端部署脚本
├── server/
│   ├── deploy.sh
│   ├── rollback.sh
│   ├── ai.zlinfot.com.conf
│   └── docker-compose.yml       # 生产编排
├── tests/
│   ├── deploy-scripts.sh
│   └── backend/                  # 后端测试
├── docker-compose.yml            # 本地开发编排
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

---

## 6. 关键决策与设计

### 6.1 前端渲染模式：SSG 优先，CSR 补充

- 门户首页、专题列表页继续采用静态生成（SSG），保证访问速度和 SEO
- 管理后台采用客户端渲染（CSR），调用后端 API
- 未来可引入 ISR（增量静态再生）实现内容更新后自动重建

### 6.2 内容双轨制：文件 + 数据库

- **源文件轨**：`content/` 下的 Markdown/YAML 是内容的「源文件」，适合人工编辑和 Git 版本管理
- **数据库轨**：后端 API 将内容加载到数据库，支持搜索、审核、发布状态
- **同步策略**：
  - 人工编辑：优先修改 `content/` 文件，提交 PR 后构建时同步到数据库
  - 智能体采集：Agent 直接提交到数据库 `pending_review`，人工审核后发布
  - 长期目标：数据库与文件双向同步，保证可审计和可回滚

### 6.3 智能体工作流

```
定时触发（cron）
    │
    ▼
搜索/抓取外部数据源
    │
    ▼
去重（基于 URL + 标题 hash）
    │
    ▼
AI 摘要 + 分类 + 标签推荐
    │
    ▼
生成 Markdown 草稿
    │
    ▼
提交到后端 API（status=pending_review）
    │
    ▼
人工审核（管理后台）
    ├─ 拒绝 → 标记 rejected，可填写原因
    └─ 批准 → status=published，触发更新
```

### 6.4 安全与权限

| 层级 | 措施 |
|------|------|
| 后台访问 | 开发阶段先使用简单 Basic Auth 或 IP 白名单；后续引入登录 |
| API 安全 | API Key / JWT，仅限后台和可信 Agent 调用 |
| 内容安全 | 所有外部链接必须 `rel="noreferrer"`；用户提交内容过滤 XSS |
| 生产部署 | 后端与前端分离部署，数据库不暴露公网 |
| 密钥管理 | 数据库密码、API Key 使用 GitHub Secrets 或服务器环境变量 |

### 6.5 部署架构演进

当前：
```
GitHub Actions → 静态包 → 服务器 Nginx
```

未来：
```
GitHub Actions → 前端静态包 + 后端镜像/包 → 服务器
                                │
                                ├─ Nginx 反向代理前端 / 后端 /admin
                                ├─ FastAPI 服务（容器或 systemd）
                                └─ PostgreSQL（容器或 RDS）
```

---

## 7. 实施优先级与里程碑

| 阶段 | 周期 | 里程碑 | 可上线？ |
|------|------|--------|----------|
| Phase 1 | 2-3 周 | 内容数据化、组件拆分、自动部署保留 | ✅ 可上线 |
| Phase 2 | 3-4 周 | 后端 API + 管理后台 + 本地 Docker | ✅ 可上线 |
| Phase 3 | 4-6 周 | 智能体采集 + 审核工作流 | ✅ 可上线 |
| Phase 4 | 6-12 周 | 搜索、图谱、订阅、分析 | 按需推进 |

---

## 8. 风险与规避

| 风险 | 规避措施 |
|------|----------|
| 改造范围失控 | 严格按 Phase 推进，每阶段结束前评审 |
| 内容质量下降 | 智能体只生成草稿，必须人工审核 |
| 自动部署中断 | 每阶段保持 CI/CD 可运行，不一次性推翻 |
| 后端运维负担 | 先容器化本地开发，生产逐步引入 |
| 安全漏洞 | 后台不暴露、API 鉴权、内容过滤、密钥不入库 |
| 性能问题 | 门户仍静态生成，API 仅管理后台和智能体使用 |

---

## 9. 下一步行动

1. **平总审阅本规划**，确认 Phase 1 范围和关键决策
2. **输出 Phase 1 详细实施计划**（按 `writing-plans` 技能，任务级详细）
3. **创建 Phase 1 分支**，开始执行
4. 每完成一个 Phase，走 PR → CI → 自动部署

---

## 10. 需要平总拍板的决策

| # | 问题 | 建议选项 | 备注 |
|---|------|----------|------|
| 1 | Phase 1 是否先启动？ | 是 / 否 | 建议先启动，风险最低 |
| 2 | 后端是否用 FastAPI + PostgreSQL？ | 是 / 其他 | 与 CLPM 技术栈一致 |
| 3 | 管理后台是否内嵌在门户内 `/admin`？ | 是 / 独立子域 | 建议内嵌，共享组件 |
| 4 | 智能体采集内容是否直接入 CMS 待审？ | 是 / 先开 PR | 建议直接入 CMS，效率更高 |
| 5 | 是否引入用户登录？ | Phase 2 暂不 / 要 | 建议后续再加，降低复杂度 |
| 6 | 生产数据库是否先本地 Docker？ | 是 / 直接 RDS | 建议先本地，稳定后迁移 |

---

## 11. 附录：与本项目既有规范的衔接

- 遵守 `AGENTS.md`：所有源码改动在 `src/` / `backend/` / `frontend/`，不修改 `dist/` 或 `site/`
- 遵守 `CLAUDE.md`：走 PR → CI → merge → 自动部署
- 保留 `zhilianAI-guid.md`：不提交、不部署
- 保留 `server/deploy.sh` / `rollback.sh` 的不可变部署模式，逐步扩展为前后端统一部署
- 所有外部资源仍需标注标题、分类、摘要、来源 URL
