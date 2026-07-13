# Phase 1 实施计划：内容数据化与结构化

> **目标：** 将 `src/App.tsx` 中的硬编码内容迁移到 `content/` 数据目录，前端组件化，网站继续静态构建并自动部署。  
> **周期：** 2-3 周  
> **前提决策：** 后端 FastAPI + PostgreSQL；管理后台独立；智能体内容入 CMS 待审。

---

## Phase 1 总体架构

```
content/                    # 内容源文件（人工编辑 + 未来智能体生成）
├── articles/
│   ├── cases/
│   ├── principles/
│   ├── standards/
│   ├── open-source/
│   └── vendors/
├── categories.json
└── tags.json

scripts/
├── build-content.py        # 将 content/ 生成 public/site-data.json
└── validate-content.py     # 校验内容模型和来源必填项

frontend/                   # 前端门户（从当前 src/ 迁移）
├── src/
│   ├── components/
│   │   ├── Hero.tsx
│   │   ├── KnowledgeMap.tsx
│   │   ├── IndustryGrid.tsx
│   │   ├── StackSection.tsx
│   │   ├── RadarSection.tsx
│   │   ├── LibrarySection.tsx
│   │   ├── ResourcesSection.tsx
│   │   ├── PracticeSection.tsx
│   │   └── Footer.tsx
│   ├── data/
│   │   └── site-data.json   # 构建时生成
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
└── vite.config.ts

backend/                    # Phase 1 仅建目录和最小占位，Phase 2 展开
└── README.md
```

**Phase 1 输出形态：** 纯静态门户，内容来自 `content/` 数据，部署方式不变。

---

## 任务清单

### Task 1: 创建内容模型文档

**Objective:** 定义 Article / Category / Tag 的字段规范，作为后续所有内容迁移和校验的依据。

**Files:**
- Create: `docs/content-model.md`

**Step 1: 编写内容模型规范**

```markdown
# Content Model

## Article

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | URL-safe slug, e.g. `control-loop-diagnostic-agent` |
| title | string | Yes | Display title |
| kind | enum | Yes | `case`, `principle`, `standard`, `open-source`, `vendor` |
| industry | enum | Yes | `general`, `chemical`, `metallurgy`, `building-material`, `pharma`, `agrochemical`, `coating`, `electronic-chemical` |
| status | enum | Yes | `draft`, `pending_review`, `published`, `archived` |
| summary | string | Yes | 1-2 sentence description |
| body | markdown | No | Long-form content |
| source_url | URL | Yes | Original source URL |
| source_title | string | Yes | Source title |
| source_org | string | Yes | Source organization |
| source_type | enum | Yes | `standard`, `paper`, `blog`, `repo`, `vendor`, `other` |
| tags | string[] | No | Tag slugs |
| categories | string[] | No | Category slugs |
| reviewed_by | string | No | Reviewer name |
| reviewed_at | ISO8601 | No | Review timestamp |
| created_at | ISO8601 | Yes | Creation timestamp |
| updated_at | ISO8601 | Yes | Last update timestamp |
| ai_summary | string | No | AI-generated summary |
| ai_collected_at | ISO8601 | No | When AI collected it |

## Category

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| slug | string | Yes | URL-safe identifier |
| name | string | Yes | Display name |
| description | string | Yes | Short description |
| order | number | No | Display order |

## Tag

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| slug | string | Yes | URL-safe identifier |
| name | string | Yes | Display name |
```

**Step 2: 提交并创建 PR 分支**

```bash
git checkout -b phase1/content-model
git add docs/content-model.md
git commit -m "docs: define content model for Phase 1"
```

---

### Task 2: 创建 `content/` 目录结构

**Objective:** 建立内容目录，准备迁移现有内容。

**Files:**
- Create: `content/README.md`
- Create: `content/categories.json`
- Create: `content/tags.json`
- Create: `content/articles/cases/`, `content/articles/principles/`, etc.

**Step 1: 创建目录**

```bash
mkdir -p content/articles/{cases,principles,standards,open-source,vendors}
```

**Step 2: 编写 `content/categories.json`**

```json
[
  {
    "slug": "control-loop-diagnosis",
    "name": "控制回路诊断",
    "description": "围绕 PID、振荡、粘滞、阀门定位等控制回路性能问题",
    "order": 10
  },
  {
    "slug": "process-monitoring",
    "name": "过程监测",
    "description": "实时工况、异常检测与多变量分析",
    "order": 20
  },
  {
    "slug": "batch-control",
    "name": "批控制",
    "description": "S88/S95 批次建模、批记录与合规",
    "order": 30
  },
  {
    "slug": "agentic-systems",
    "name": "智能体系统",
    "description": "RAG、MCP、规划、工具调用与治理",
    "order": 40
  }
]
```

**Step 3: 编写 `content/tags.json`**

```json
[
  { "slug": "clpm", "name": "CLPM" },
  { "slug": "pid", "name": "PID" },
  { "slug": "time-series", "name": "时序分析" },
  { "slug": "rag", "name": "RAG" },
  { "slug": "mcp", "name": "MCP" },
  { "slug": "opc-ua", "name": "OPC UA" },
  { "slug": "s88", "name": "S88" },
  { "slug": "s95", "name": "S95" },
  { "slug": "hybrid-modeling", "name": "混合建模" },
  { "slug": "digital-twin", "name": "数字孪生" }
]
```

**Step 4: 提交**

```bash
git add content/
git commit -m "chore: create content directory structure and seed categories/tags"
```

---

### Task 3: 迁移现有内容到 Markdown + YAML

**Objective:** 把 `src/App.tsx` 中硬编码的 `libraryItems`、`industryCards`、`resources`、`graphNodes` 等迁移到 `content/articles/`。

**Files:**
- Create: ~25 article files under `content/articles/`
- Modify: `src/App.tsx` (remove hardcoded data)

**Step 1: 创建案例文章示例**

```yaml
---
id: control-loop-diagnostic-agent
title: 控制回路诊断智能体
kind: case
industry: chemical
status: published
summary: 从回路筛选、指标计算、振荡与粘滞诊断，到原因解释和整定建议的完整智能体能力链。
source_url: https://www.isa.org/intech-home/2021/june-2021/features/control-loop-performance-monitoring
source_title: Control Loop Performance Monitoring
source_org: ISA
source_type: paper
tags:
  - clpm
  - pid
  - time-series
categories:
  - control-loop-diagnosis
reviewed_by: 致联工业 AI 研究
reviewed_at: 2026-07-13T00:00:00Z
created_at: 2026-07-13T00:00:00Z
updated_at: 2026-07-13T00:00:00Z
---

控制回路诊断智能体融合 PID 性能指标、振荡检测、阀门粘滞诊断与机理解释，生成可追溯的处置建议。
```

**Step 2: 批量迁移**

- 案例：`content/articles/cases/`（7 条）
- 原理：`content/articles/principles/`（5 条）
- 文献/标准：`content/articles/standards/`（5 条）
- 开源：`content/articles/open-source/`（5 条）
- 供应商：`content/articles/vendors/`（5 条）

**Step 3: 提交**

```bash
git add content/articles/
git commit -m "content: migrate existing portal content from App.tsx to structured articles"
```

---

### Task 4: 编写内容校验脚本

**Objective:** 确保所有 Markdown 文件符合内容模型，必填字段完整。

**Files:**
- Create: `scripts/validate-content.py`

**Step 1: 实现校验脚本**

```python
#!/usr/bin/env python3
"""Validate content files against the content model."""
import json
import re
import sys
from pathlib import Path
from datetime import datetime

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
REQUIRED_FRONTMATTER = {
    "id", "title", "kind", "industry", "status", "summary",
    "source_url", "source_title", "source_org", "source_type",
    "created_at", "updated_at",
}
VALID_KINDS = {"case", "principle", "standard", "open-source", "vendor"}
VALID_INDUSTRIES = {
    "general", "chemical", "metallurgy", "building-material", "pharma",
    "agrochemical", "coating", "electronic-chemical"
}
VALID_STATUSES = {"draft", "pending_review", "published", "archived"}
VALID_SOURCE_TYPES = {"standard", "paper", "blog", "repo", "vendor", "other"}

URL_RE = re.compile(r"^https?://[^\s/$.?#].[^\s]*$", re.IGNORECASE)


def parse_frontmatter(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{path}: missing frontmatter")
    parts = text.split("---", 2)
    if len(parts) < 3:
        raise ValueError(f"{path}: invalid frontmatter")
    import yaml
    return yaml.safe_load(parts[1])


def validate_article(path: Path, categories: set, tags: set) -> list[str]:
    errors = []
    try:
        fm = parse_frontmatter(path)
    except Exception as exc:
        return [str(exc)]

    missing = REQUIRED_FRONTMATTER - set(fm.keys())
    if missing:
        errors.append(f"{path}: missing fields {missing}")

    if fm.get("kind") not in VALID_KINDS:
        errors.append(f"{path}: invalid kind {fm.get('kind')}")
    if fm.get("industry") not in VALID_INDUSTRIES:
        errors.append(f"{path}: invalid industry {fm.get('industry')}")
    if fm.get("status") not in VALID_STATUSES:
        errors.append(f"{path}: invalid status {fm.get('status')}")
    if fm.get("source_type") not in VALID_SOURCE_TYPES:
        errors.append(f"{path}: invalid source_type {fm.get('source_type')}")
    if not URL_RE.match(fm.get("source_url", "")):
        errors.append(f"{path}: invalid source_url")

    for cat in fm.get("categories", []):
        if cat not in categories:
            errors.append(f"{path}: unknown category {cat}")
    for tag in fm.get("tags", []):
        if tag not in tags:
            errors.append(f"{path}: unknown tag {tag}")

    return errors


def main() -> int:
    categories = {c["slug"] for c in json.loads((CONTENT_DIR / "categories.json").read_text())}
    tags = {t["slug"] for t in json.loads((CONTENT_DIR / "tags.json").read_text())}

    errors = []
    for path in sorted((CONTENT_DIR / "articles").rglob("*.md")):
        errors.extend(validate_article(path, categories, tags))

    if errors:
        print("Validation failed:")
        for e in errors:
            print(f"  - {e}")
        return 1

    print(f"Validation passed: {len(list((CONTENT_DIR / 'articles').rglob('*.md')))} articles")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

**Step 2: 添加 `pyyaml` 依赖说明**

本地开发需安装：

```bash
pip install pyyaml
# 或写入 scripts/requirements.txt
```

**Step 3: 提交**

```bash
git add scripts/validate-content.py
git commit -m "feat: add content validation script"
```

---

### Task 5: 编写内容构建脚本

**Objective:** 构建时将 `content/` 生成 `frontend/public/site-data.json`。

**Files:**
- Create: `scripts/build-content.py`
- Create: `frontend/public/site-data.json` (generated)
- Modify: `frontend/package.json` scripts

**Step 1: 实现构建脚本**

```python
#!/usr/bin/env python3
"""Build site-data.json from content/."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content"
OUTPUT = ROOT / "frontend" / "public" / "site-data.json"


def parse_article(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    parts = text.split("---", 2)
    import yaml
    frontmatter = yaml.safe_load(parts[1])
    body = parts[2].strip()
    frontmatter["body"] = body
    return frontmatter


def main():
    categories = json.loads((CONTENT_DIR / "categories.json").read_text())
    tags = json.loads((CONTENT_DIR / "tags.json").read_text())
    articles = [parse_article(p) for p in sorted((CONTENT_DIR / "articles").rglob("*.md"))]

    data = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0",
        },
        "categories": categories,
        "tags": tags,
        "articles": [a for a in articles if a.get("status") == "published"],
        "drafts": [a for a in articles if a.get("status") != "published"],
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {OUTPUT} with {len(data['articles'])} published articles")


if __name__ == "__main__":
    main()
```

**Step 2: 修改前端构建脚本**

`frontend/package.json`:

```json
{
  "scripts": {
    "build": "python3 ../scripts/build-content.py && vite build",
    "dev": "python3 ../scripts/build-content.py && vite"
  }
}
```

**Step 3: 提交**

```bash
git add scripts/build-content.py frontend/package.json
git commit -m "feat: build site-data.json from content directory"
```

---

### Task 6: 前端组件化改造

**Objective:** 将 `src/App.tsx` 拆分为独立组件，从 `site-data.json` 读取内容。

**Files:**
- Create: `frontend/src/components/*.tsx`
- Create: `frontend/src/types.ts`
- Modify: `frontend/src/App.tsx`

**Step 1: 定义类型**

`frontend/src/types.ts`:

```typescript
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

export interface SiteData {
  meta: { generated_at: string; version: string };
  categories: Category[];
  tags: Tag[];
  articles: Article[];
}
```

**Step 2: 创建组件**

逐个创建：
- `frontend/src/components/Hero.tsx`
- `frontend/src/components/KnowledgeMap.tsx`
- `frontend/src/components/IndustryGrid.tsx`
- `frontend/src/components/StackSection.tsx`
- `frontend/src/components/RadarSection.tsx`
- `frontend/src/components/LibrarySection.tsx`
- `frontend/src/components/ResourcesSection.tsx`
- `frontend/src/components/PracticeSection.tsx`
- `frontend/src/components/Footer.tsx`

**Step 3: 重写 `App.tsx`**

```tsx
import { useState } from "react";
import type { SiteData } from "./types";
import Hero from "./components/Hero";
import KnowledgeMap from "./components/KnowledgeMap";
import IndustryGrid from "./components/IndustryGrid";
import StackSection from "./components/StackSection";
import RadarSection from "./components/RadarSection";
import LibrarySection from "./components/LibrarySection";
import ResourcesSection from "./components/ResourcesSection";
import PracticeSection from "./components/PracticeSection";
import Footer from "./components/Footer";
import siteData from "../public/site-data.json";

export default function App() {
  const data = siteData as SiteData;
  const [activeNode, setActiveNode] = useState("agent");

  return (
    <main>
      <Header />
      <Hero />
      <KnowledgeMap activeNode={activeNode} setActiveNode={setActiveNode} />
      <IndustryGrid articles={data.articles} />
      <StackSection />
      <RadarSection />
      <LibrarySection articles={data.articles} />
      <ResourcesSection articles={data.articles} />
      <PracticeSection />
      <Footer />
    </main>
  );
}
```

**Step 4: 提交**

```bash
git add frontend/src/
git commit -m "refactor: split App.tsx into data-driven components"
```

---

### Task 7: 移动项目结构

**Objective:** 将当前 `src/` 重命名为 `frontend/src/`，调整构建输出目录。

**Files:**
- Move: `src/` → `frontend/src/`
- Move: `index.html` → `frontend/index.html`
- Move: `package.json` → `frontend/package.json`
- Move: `package-lock.json` → `frontend/package-lock.json`
- Create: `frontend/vite.config.ts`

**Step 1: 迁移文件**

```bash
mkdir -p frontend
mv src frontend/
mv index.html frontend/
mv package.json frontend/
mv package-lock.json frontend/
```

**Step 2: 创建 `frontend/vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
```

**Step 3: 更新 `scripts/package.sh`**

- 修改路径：`dist/` 仍在根目录（vite 输出到 `../dist`）
- 确保 `scripts/package.sh` 从根目录运行，找到 `dist/`

**Step 4: 提交**

```bash
git add frontend/ scripts/package.sh
git commit -m "chore: move frontend files into frontend/ directory"
```

---

### Task 8: 创建后端目录占位

**Objective:** 为 Phase 2 预留后端目录，避免 Phase 1 的目录结构再次大改。

**Files:**
- Create: `backend/README.md`

```markdown
# Backend

Phase 2 will introduce FastAPI + PostgreSQL backend for content management.

Planned structure:
- `app/main.py` FastAPI entrypoint
- `app/models.py` SQLAlchemy models
- `app/schemas.py` Pydantic schemas
- `app/api/` REST endpoints
- `app/services/` business logic
- `migrations/` Alembic migrations
- `tests/` pytest suite
```

```bash
git add backend/
git commit -m "chore: create backend directory placeholder for Phase 2"
```

---

### Task 9: 更新 CI/CD 工作流

**Objective:** 确保 GitHub Actions 在新的 `frontend/` 目录结构下仍能正确构建、测试和打包。

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy.yml`

**Step 1: 更新 `ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm ci
        working-directory: frontend
      - run: npm run build
        working-directory: frontend
      - name: Validate content
        run: python3 scripts/validate-content.py
      - name: Test deployment scripts
        run: bash tests/deploy-scripts.sh
      - name: Package release
        run: bash scripts/package.sh
      - uses: actions/upload-artifact@v4
        with:
          name: process-industry-ai-${{ github.sha }}
          path: |
            process-industry-ai-*.tar.gz
            process-industry-ai-*.tar.gz.sha256
          retention-days: 30
```

**Step 2: 更新 `deploy.yml` 的构建步骤**

同样添加 `working-directory: frontend` 到 `npm ci` 和 `npm run build`。

**Step 3: 提交**

```bash
git add .github/workflows/
git commit -m "ci: adapt workflows to frontend/ directory structure"
```

---

### Task 10: 本地验证与端到端测试

**Objective:** 确保 Phase 1 改造后的完整流程可运行。

**Step 1: 安装依赖并构建**

```bash
cd frontend
npm ci
npm run build
```

**Step 2: 运行内容校验**

```bash
python3 scripts/validate-content.py
```

**Step 3: 运行部署脚本测试**

```bash
bash tests/deploy-scripts.sh
```

**Step 4: 运行打包脚本**

```bash
bash scripts/package.sh
```

**Step 5: 检查构建产物**

```bash
ls -la dist/
ls -la *.tar.gz *.sha256
```

**Step 6: 浏览器验证**

```bash
python3 -m http.server 8080 --directory dist
```

访问 `http://localhost:8080`，确认页面内容与旧版一致，且底部版权栏存在。

---

## 提交与 PR

完成所有任务后，推送分支并创建 PR：

```bash
git checkout -b phase1/content-data-refactor
git push -u origin phase1/content-data-refactor
gh pr create --title "Phase 1: content data refactor and componentization" --body "..."
```

---

## 验收标准

- [ ] `content/` 目录包含所有现有内容，按 kind 分类
- [ ] `scripts/validate-content.py` 通过
- [ ] `scripts/build-content.py` 生成 `frontend/public/site-data.json`
- [ ] `frontend/src/App.tsx` 不再硬编码内容，所有组件从 `site-data.json` 读取
- [ ] `npm run build` 成功，输出到 `dist/`
- [ ] `bash tests/deploy-scripts.sh` 通过
- [ ] `bash scripts/package.sh` 生成正确压缩包
- [ ] GitHub Actions CI 通过
- [ ] 合并到 `main` 后自动部署成功
- [ ] 线上 `http://ai.zlinfot.com/` 内容与旧版一致

---

## 关联文档

- `docs/plans/2026-07-13-portal-redesign.md` 系统规划
- `docs/content-model.md` 内容模型规范
