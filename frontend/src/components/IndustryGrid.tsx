import { useState, useMemo } from "react";
import type { Article } from "../types";

interface IndustryGridProps {
  articles: Article[];
  setActiveNode?: (id: string) => void;
}

const industryMeta: Record<
  string,
  { code: string; level: string; desc: string; tags: string[] }
> = {
  chemical: {
    code: "CHEM",
    level: "工程验证",
    desc: "融合 PID 性能指标、振荡检测、阀门粘滞诊断与机理解释，生成可追溯的处置建议。",
    tags: ["CLPM", "时序分析", "工具调用"],
  },
  metallurgy: {
    code: "META",
    level: "概念验证",
    desc: "关联工艺窗口、物料状态与能源曲线，识别偏离的来源、传播路径与潜在损失。",
    tags: ["过程监测", "根因分析", "能效"],
  },
  "building-material": {
    code: "MTRL",
    level: "研究方向",
    desc: "把质量、煤耗、温度场和设备状态置于同一决策上下文，支持操作方案对比。",
    tags: ["软测量", "优化", "人在回路"],
  },
  pharma: {
    code: "PHAR",
    level: "工程验证",
    desc: "沿 S88 批次层级自动核查关键步骤、偏差与电子记录，保留证据链和审批边界。",
    tags: ["S88", "EBR", "合规"],
  },
  agrochemical: {
    code: "AGRO",
    level: "产品构想",
    desc: "从 DCS 时序和操作事件中识别批次、工序与步序，为无 BATCH/MES 现场补齐轻量语义。",
    tags: ["批次识别", "事件", "谱系"],
  },
  coating: {
    code: "COAT",
    level: "产品构想",
    desc: "连接配方版本、投料顺序、过程轨迹和质量结果，支持跨批次对标与异常解释。",
    tags: ["配方", "质量", "批次对标"],
  },
  "electronic-chemical": {
    code: "ELEC",
    level: "研究方向",
    desc: "面向微小漂移与多变量耦合，协同规则、统计模型和专家知识完成早期预警。",
    tags: ["多变量", "SPC", "异常检测"],
  },
};

const industryNames: Record<string, string> = {
  chemical: "化工",
  metallurgy: "冶金",
  "building-material": "建材",
  pharma: "医药",
  agrochemical: "农药",
  coating: "涂料",
  "electronic-chemical": "电子化学品",
};

export default function IndustryGrid({ articles, setActiveNode }: IndustryGridProps) {
  const [industryFilter, setIndustryFilter] = useState("全部");

  const industries = useMemo(() => {
    const set = new Set(articles.map((a) => a.industry).filter((i) => industryNames[i]));
    return ["全部", ...Array.from(set).map((i) => industryNames[i])];
  }, [articles]);

  const industryCards = useMemo(() => {
    const cards: {
      industry: string;
      code: string;
      title: string;
      desc: string;
      tags: string[];
      level: string;
    }[] = [];
    Object.entries(industryNames).forEach(([key, label]) => {
      const article = articles.find((a) => a.industry === key && a.kind === "case");
      if (article && industryMeta[key]) {
        cards.push({
          industry: label,
          code: industryMeta[key].code,
          title: article.title,
          desc: industryMeta[key].desc,
          tags: industryMeta[key].tags,
          level: industryMeta[key].level,
        });
      }
    });
    return cards;
  }, [articles]);

  return (
    <section className="industries-section dark-section" id="industries">
      <div className="section-head dark">
        <div>
          <p className="section-kicker">02 / INDUSTRY SCENARIOS</p>
          <h2>从高价值问题出发</h2>
        </div>
        <p>优先选择证据充分、边界清晰、可由现有工业数据支撑的任务；让智能体先成为工程师的分析伙伴，再逐步进入受控决策。</p>
      </div>
      <div className="filter-row" role="group" aria-label="按行业筛选">
        {industries.map((item) => (
          <button
            key={item}
            className={industryFilter === item ? "active" : ""}
            onClick={() => setIndustryFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="industry-grid">
        {industryCards
          .filter((card) => industryFilter === "全部" || card.industry === industryFilter)
          .map((card) => (
            <article key={card.code}>
              <div className="card-top">
                <span>
                  {card.code} / {card.industry}
                </span>
                <em>{card.level}</em>
              </div>
              <h3>{card.title}</h3>
              <p>{card.desc}</p>
              <div className="tag-row">
                {card.tags.map((tag) => (
                  <b key={tag}>{tag}</b>
                ))}
              </div>
              <button onClick={() => setActiveNode?.("knowledge")}>查看能力链 →</button>
            </article>
          ))}
      </div>
    </section>
  );
}
