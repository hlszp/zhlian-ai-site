# Content Model

> 本文档定义 `content/` 目录下结构化内容的字段规范，是内容迁移、校验、构建与后续后端 API 的共同契约。
> 生效范围：Phase 1 内容数据化与结构化。

---

## 通用约定

- 所有标识符使用 URL-safe 的 ASCII 小写 slug，连字符 `-` 分隔。
- 时间戳使用 ISO 8601 UTC 格式，例如 `2026-07-13T00:00:00Z`。
- 长文本正文使用 Markdown，置于 YAML frontmatter 之后。
- 来源信息必须可验证：标题、组织、类型、原始 URL 缺一不可。

---

## Article（文章）

文章是知识门户的最小内容单元，覆盖案例、原理、标准文献、开源资源与供应商资料。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | URL-safe slug，例如 `control-loop-diagnostic-agent` |
| title | string | Yes | 展示标题 |
| kind | enum | Yes | `case`、`principle`、`standard`、`open-source`、`vendor` |
| industry | enum | Yes | `general`、`chemical`、`metallurgy`、`building-material`、`pharma`、`agrochemical`、`coating`、`electronic-chemical` |
| status | enum | Yes | `draft`、`pending_review`、`published`、`archived` |
| summary | string | Yes | 1-2 句描述，用于列表展示和搜索结果 |
| body | markdown | No | 长文正文，可补充背景、方法、实践细节 |
| source_url | URL | Yes | 原始来源 URL |
| source_title | string | Yes | 来源标题 |
| source_org | string | Yes | 来源组织 |
| source_type | enum | Yes | `standard`、`paper`、`blog`、`repo`、`vendor`、`other` |
| tags | string[] | No | Tag slug 列表，用于横向关联 |
| categories | string[] | No | Category slug 列表，用于主题归类 |
| reviewed_by | string | No | 审核人姓名 |
| reviewed_at | ISO8601 | No | 人工审核时间 |
| created_at | ISO8601 | Yes | 创建时间 |
| updated_at | ISO8601 | Yes | 最后更新时间 |
| ai_summary | string | No | AI 生成摘要 |
| ai_collected_at | ISO8601 | No | AI 采集时间 |

### 枚举取值说明

- **kind**
  - `case`：行业应用案例或场景方案
  - `principle`：底层原理、方法或技术专题
  - `standard`：标准、规范、白皮书、官方文献
  - `open-source`：开源项目、仓库、数据集、工具库
  - `vendor`：供应商产品、方案、技术资料

- **industry**
  - `general`：通用或跨行业
  - `chemical`：化工
  - `metallurgy`：冶金
  - `building-material`：建材
  - `pharma`：医药
  - `agrochemical`：农药
  - `coating`：涂料
  - `electronic-chemical`：电子化学品

- **status**
  - `draft`：草稿
  - `pending_review`：待人工审核
  - `published`：已发布（构建时进入 `articles` 列表）
  - `archived`：已归档

- **source_type**
  - `standard`：标准组织文档
  - `paper`：论文或技术报告
  - `blog`：博客或厂商文章
  - `repo`：开源仓库
  - `vendor`：供应商官方资料
  - `other`：其他

---

## Category（分类）

分类用于主题聚合，每个分类包含展示名、描述和排序权重。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| slug | string | Yes | URL-safe 标识符 |
| name | string | Yes | 展示名称 |
| description | string | Yes | 简短描述 |
| order | number | No | 展示顺序，数值越小越靠前 |

---

## Tag（标签）

标签用于横向关联不同分类下的文章，比分类更细粒度。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| slug | string | Yes | URL-safe 标识符 |
| name | string | Yes | 展示名称 |

---

## 来源质量原则

- 优先使用标准组织、原始论文、官方仓库和厂商一手资料。
- 不得将构想或演示案例描述为已验证的生产部署。
- 所有外部链接必须可公开访问，并在页面渲染时附加 `rel="noreferrer"`。

---

## 扩展说明

- 未来后端数据库将复用本模型，新增 `uuid`、`author_id`、`version` 等内部字段。
- 智能体采集生成的草稿必须满足 `status = pending_review` 且所有必填字段完整，方可进入人工审核队列。
