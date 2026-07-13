import { useState } from "react";

const graphNodes = [
  { id: "objects", label: "工厂对象", note: "装置 · 设备 · 仪表", className: "node-objects" },
  { id: "data", label: "实时数据", note: "时序 · 报警 · 事件", className: "node-data" },
  { id: "models", label: "机理模型", note: "机理 · 统计 · 仿真", className: "node-models" },
  { id: "knowledge", label: "领域知识", note: "标准 · 规则 · 文献", className: "node-knowledge" },
];

interface HeroProps {
  activeNode: string;
  setActiveNode: (id: string) => void;
}

export default function Hero({ activeNode, setActiveNode }: HeroProps) {
  const active = graphNodes.find((item) => item.id === activeNode);

  const handleNodeClick = (id: string) => {
    setActiveNode(id);
  };

  return (
    <section className="hero" id="top">
      <div className="grid-overlay" aria-hidden="true" />
      <div className="hero-copy">
        <p className="eyebrow">
          <span>PROCESS INDUSTRY INTELLIGENCE</span>
          <em>研究与实践门户</em>
        </p>
        <h1>
          让工业知识、
          <br />
          实时数据与智能体
          <br />
          <span>协同工作</span>
        </h1>
        <p className="hero-subtitle">
          连接传统工业自动化、数字化与 AI 原生能力，探索化工、冶金、建材、医药、农药、涂料与电子化学品的新一代工业智能。
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#knowledge">
            探索知识地图 <span>→</span>
          </a>
          <a className="button secondary" href="#industries">
            查看应用场景 <span>↗</span>
          </a>
        </div>
        <div className="principles">
          <span>机理与数据融合</span>
          <span>人在回路</span>
          <span>安全可信</span>
        </div>
      </div>

      <div className="graph-shell" aria-label="工业智能体知识网络">
        <div className="graph-title">
          <span>KNOWLEDGE NETWORK</span>
          <b>工业认知关系图</b>
        </div>
        <div className="graph-canvas">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="connector connector-a" />
          <div className="connector connector-b" />
          <div className="connector connector-c" />
          <div className="connector connector-d" />
          <button
            className={`core-node ${activeNode === "agent" ? "active" : ""}`}
            onClick={() => handleNodeClick("agent")}
          >
            <span className="agent-glyph" aria-hidden="true">
              AI
            </span>
            <b>工业智能体</b>
            <small>感知 · 推理 · 执行</small>
          </button>
          {graphNodes.map((node) => (
            <button
              key={node.id}
              className={`graph-node ${node.className} ${activeNode === node.id ? "active" : ""}`}
              onClick={() => handleNodeClick(node.id)}
            >
              <b>{node.label}</b>
              <small>{node.note}</small>
            </button>
          ))}
          <span className="micro-node micro-a">OPC UA</span>
          <span className="micro-node micro-b">HAZOP</span>
          <span className="micro-node micro-c">S88</span>
          <span className="micro-node micro-d">MCP</span>
          <span className="micro-node micro-e">RAG</span>
        </div>
        <div className="node-detail" aria-live="polite">
          <span>当前节点 · {active ? active.label : "核心"}</span>
          <b>{active ? active.note : "编排知识、模型与工具，支持诊断、决策和受控执行"}</b>
          <button
            onClick={() =>
              document.querySelector("#knowledge")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            进入知识地图 →
          </button>
        </div>
      </div>
    </section>
  );
}
