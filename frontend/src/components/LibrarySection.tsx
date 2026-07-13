import { useState, useMemo } from "react";
import type { Article } from "../types";

interface LibrarySectionProps {
  articles: Article[];
}

const kindMap: Record<Article["kind"], string> = {
  case: "案例",
  principle: "原理",
  standard: "文献",
  "open-source": "开源",
  vendor: "供应商",
};

const tabs: Article["kind"][] = ["case", "principle", "standard", "open-source", "vendor"];

const industryNames: Record<string, string> = {
  chemical: "化工",
  metallurgy: "冶金",
  "building-material": "建材",
  pharma: "医药",
  agrochemical: "农药",
  coating: "涂料",
  "electronic-chemical": "电子化学品",
  general: "通用",
};

export default function LibrarySection({ articles }: LibrarySectionProps) {
  const [libraryTab, setLibraryTab] = useState<string>("案例");
  const [libraryQuery, setLibraryQuery] = useState("");

  const shownLibraryItems = useMemo(() => {
    const kind = tabs.find((k) => kindMap[k] === libraryTab) ?? "case";
    return articles
      .filter((item) => item.kind === kind)
      .filter((item) =>
        `${item.title}${item.summary}${industryNames[item.industry] ?? item.industry}${item.source_title}`
          .toLowerCase()
          .includes(libraryQuery.toLowerCase())
      );
  }, [articles, libraryTab, libraryQuery]);

  const countByTab = useMemo(() => {
    const counts: Record<string, number> = {};
    tabs.forEach((tab) => {
      counts[kindMap[tab]] = articles.filter((a) => a.kind === tab).length;
    });
    return counts;
  }, [articles]);

  return (
    <section className="library-section light-section" id="library">
      <div className="section-head">
        <div>
          <p className="section-kicker">05 / INDUSTRIAL AI LIBRARY</p>
          <h2>专题、案例与生态知识库</h2>
        </div>
        <p>使用统一条目结构组织应用方案、底层原理、标准论文、开源资源和供应商产品。当前为首批精选索引，后续可继续扩充为带全文、关系图和更新机制的内容底座。</p>
      </div>
      <div className="library-toolbar">
        <div className="library-tabs" role="tablist" aria-label="知识库分类">
          {tabs.map((tab) => {
            const label = kindMap[tab];
            return (
              <button
                key={label}
                role="tab"
                aria-selected={libraryTab === label}
                className={libraryTab === label ? "active" : ""}
                onClick={() => setLibraryTab(label)}
              >
                <span>{label}</span>
                <small>{countByTab[label]}</small>
              </button>
            );
          })}
        </div>
        <label className="library-search">
          <span>⌕</span>
          <input
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
            placeholder="搜索主题、行业或技术…"
            aria-label="搜索专题知识库"
          />
        </label>
      </div>
      <div className="library-summary">
        <b>{libraryTab}</b>
        <span>{shownLibraryItems.length} 条精选内容</span>
        <em>来源优先级：标准组织 / 原始论文 / 官方仓库 / 厂商资料</em>
      </div>
      <div className="library-grid">
        {shownLibraryItems.map((item, index) => (
          <a
            key={`${item.kind}-${item.title}`}
            href={item.source_url}
            target="_blank"
            rel="noreferrer"
          >
            <div className="library-index">{String(index + 1).padStart(2, "0")}</div>
            <div className="library-content">
              <div>
                <span>{industryNames[item.industry] ?? item.industry}</span>
                <small>{item.source_title} · {item.source_org}</small>
              </div>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
              <b>阅读来源 ↗</b>
            </div>
          </a>
        ))}
        {shownLibraryItems.length === 0 && (
          <div className="library-empty">
            <b>没有匹配内容</b>
            <p>请更换关键词，或切换知识库分类。</p>
          </div>
        )}
      </div>
      <div className="vendor-map" aria-label="工业 AI 生态分层">
        <div>
          <p className="section-kicker">ECOSYSTEM MAP</p>
          <h3>供应商不宜只按“是否有 AI”比较</h3>
          <p>建议从其在工业技术栈中的位置、数据控制权、领域模型、交付方式和安全边界进行评估。</p>
        </div>
        <article>
          <span>01</span>
          <b>控制与边缘</b>
          <p>DCS / PLC / SCADA / 边缘计算</p>
        </article>
        <article>
          <span>02</span>
          <b>工业数据与语义</b>
          <p>Historian / DataOps / Contextualization</p>
        </article>
        <article>
          <span>03</span>
          <b>工程与运营模型</b>
          <p>Simulation / APM / MES / Optimization</p>
        </article>
        <article>
          <span>04</span>
          <b>AI 与智能体平台</b>
          <p>Foundation Model / Agent / Copilot</p>
        </article>
      </div>
    </section>
  );
}
