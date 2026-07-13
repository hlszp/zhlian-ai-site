import { useMemo } from "react";
import type { Article } from "../types";

interface ResourcesSectionProps {
  articles: Article[];
}

const typeLabel: Record<Article["source_type"], string> = {
  standard: "标准",
  paper: "论文",
  blog: "博客",
  repo: "开源",
  vendor: "厂商",
  other: "其他",
};

export default function ResourcesSection({ articles }: ResourcesSectionProps) {
  const resources = useMemo(() => {
    return articles
      .filter(
        (a) =>
          a.kind === "standard" ||
          a.kind === "open-source" ||
          a.source_type === "standard" ||
          a.source_type === "repo"
      )
      .slice(0, 6)
      .map((item) => ({
        type: typeLabel[item.source_type] ?? "资料",
        title: item.title,
        org: item.source_org,
        text: item.summary,
        href: item.source_url,
      }));
  }, [articles]);

  return (
    <section className="resources-section light-section" id="resources">
      <div className="section-head">
        <div>
          <p className="section-kicker">06 / STARTING POINTS</p>
          <h2>从权威标准与可运行代码开始</h2>
        </div>
        <p>以下入口适合作为团队学习和原型验证的第一站；专题知识库则提供更系统的分类、解释和场景关联。</p>
      </div>
      <div className="resource-grid">
        {resources.map((item) => (
          <a key={item.title} href={item.href} target="_blank" rel="noreferrer">
            <span>{item.type}</span>
            <small>{item.org}</small>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
            <b>访问来源 ↗</b>
          </a>
        ))}
      </div>
      <div className="source-policy">
        <b>收录原则</b>
        <span>权威性</span>
        <span>可验证</span>
        <span>可复现</span>
        <span>工业相关性</span>
        <span>安全与合规</span>
      </div>
    </section>
  );
}
