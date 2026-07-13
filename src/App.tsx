"use client";

import { useState } from "react";

const graphNodes = [
  { id: "objects", label: "工厂对象", note: "装置 · 设备 · 仪表", className: "node-objects" },
  { id: "data", label: "实时数据", note: "时序 · 报警 · 事件", className: "node-data" },
  { id: "models", label: "机理模型", note: "机理 · 统计 · 仿真", className: "node-models" },
  { id: "knowledge", label: "领域知识", note: "标准 · 规则 · 文献", className: "node-knowledge" },
];

const industryCards = [
  { industry: "化工", code: "CHEM", title: "控制回路诊断智能体", desc: "融合 PID 性能指标、振荡检测、阀门粘滞诊断与机理解释，生成可追溯的处置建议。", tags: ["CLPM", "时序分析", "工具调用"], level: "工程验证" },
  { industry: "冶金", code: "META", title: "冶炼过程稳定性助手", desc: "关联工艺窗口、物料状态与能源曲线，识别偏离的来源、传播路径与潜在损失。", tags: ["过程监测", "根因分析", "能效"], level: "概念验证" },
  { industry: "建材", code: "MTRL", title: "窑炉运行优化智能体", desc: "把质量、煤耗、温度场和设备状态置于同一决策上下文，支持操作方案对比。", tags: ["软测量", "优化", "人在回路"], level: "研究方向" },
  { industry: "医药", code: "PHAR", title: "批记录审阅智能体", desc: "沿 S88 批次层级自动核查关键步骤、偏差与电子记录，保留证据链和审批边界。", tags: ["S88", "EBR", "合规"], level: "工程验证" },
  { industry: "农药", code: "AGRO", title: "批次工况识别与追溯", desc: "从 DCS 时序和操作事件中识别批次、工序与步序，为无 BATCH/MES 现场补齐轻量语义。", tags: ["批次识别", "事件", "谱系"], level: "产品构想" },
  { industry: "涂料", code: "COAT", title: "配方—过程—质量分析", desc: "连接配方版本、投料顺序、过程轨迹和质量结果，支持跨批次对标与异常解释。", tags: ["配方", "质量", "批次对标"], level: "产品构想" },
  { industry: "电子化学品", code: "ELEC", title: "高纯过程异常守卫", desc: "面向微小漂移与多变量耦合，协同规则、统计模型和专家知识完成早期预警。", tags: ["多变量", "SPC", "异常检测"], level: "研究方向" },
];

const resources = [
  { type: "标准", title: "OPC UA", org: "OPC Foundation", text: "跨设备、控制与企业系统的安全互操作及信息建模基础。", href: "https://opcfoundation.org/about/opc-technologies/opc-ua/" },
  { type: "架构", title: "NAMUR Open Architecture", org: "NAMUR", text: "在不干扰核心控制的前提下，安全利用生产数据开展监测与优化。", href: "https://www.namur.net/en/work-areas-and-project-groups/focus-topics/namur-open-architecture.html" },
  { type: "标准", title: "ISA-95 / IEC 62264", org: "ISA", text: "定义企业与制造控制系统的活动边界、对象和集成接口。", href: "https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard" },
  { type: "开源", title: "UA-.NETStandard", org: "OPC Foundation", text: "OPC UA 的跨平台 .NET 标准实现，可用于工业连接与信息模型开发。", href: "https://github.com/OPCFoundation/UA-.NETStandard" },
  { type: "开源", title: "Industrial IoT Patterns", org: "Microsoft Samples", text: "涵盖 OPC UA、异常检测、根因分析、OEE 与数字孪生的工程模式。", href: "https://github.com/Azure-Samples/industrial-iot-patterns" },
  { type: "数据集", title: "HAI Security Dataset", org: "ICS Dataset", text: "面向工业控制系统异常与网络攻击研究的硬件在环数据集。", href: "https://github.com/icsdataset/hai" },
];

const libraryItems = [
  { kind:"案例", industry:"化工", title:"控制回路诊断智能体", summary:"从回路筛选、指标计算、振荡与粘滞诊断，到原因解释和整定建议的完整智能体能力链。", meta:"方案蓝图 · CLPM", href:"https://www.isa.org/intech-home/2021/june-2021/features/control-loop-performance-monitoring" },
  { kind:"案例", industry:"医药", title:"批记录智能审阅", summary:"围绕批次、工序、步序和关键参数自动核查偏差，输出证据定位与风险分级，保留人工批准。", meta:"方案蓝图 · S88 / EBR", href:"https://www.isa.org/standards-and-publications/isa-standards/isa-88-standard" },
  { kind:"案例", industry:"冶金", title:"冶炼稳定性与能效助手", summary:"将物料、能量、工况和质量置于同一上下文，识别波动传播、机会损失与操作改进空间。", meta:"方案蓝图 · 多变量分析", href:"https://new.abb.com/process-automation/genix" },
  { kind:"案例", industry:"精细化工", title:"无 BATCH 场景的批次识别", summary:"利用 DCS 时序、操作事件和规则自动推断批次、工序与步序，为轻量批次分析补齐时间语义。", meta:"产品构想 · 工况识别", href:"https://www.isa.org/standards-and-publications/isa-standards/isa-88-standard" },
  { kind:"案例", industry:"电子化学品", title:"高纯过程异常守卫", summary:"组合 SPC、软测量、多变量异常检测与专家规则，在质量结果滞后时提供早期风险提示。", meta:"研究方案 · 质量预测", href:"https://github.com/thuml/Time-Series-Library" },
  { kind:"原理", industry:"通用", title:"机理—数据融合建模", summary:"把质量守恒、能量守恒、动力学约束与机器学习结合，提升小样本场景的可解释性和外推稳定性。", meta:"专题 · Hybrid Modeling", href:"https://www.aspentech.com/en/cp/industrial-ai" },
  { kind:"原理", industry:"通用", title:"工业时序异常检测", summary:"比较阈值、统计过程控制、预测残差、重构误差和基础模型方法，并关注工况切换与标签稀缺。", meta:"专题 · Time Series", href:"https://github.com/thuml/Time-Series-Library" },
  { kind:"原理", industry:"通用", title:"因果与根因分析", summary:"区分相关、时滞、过程拓扑和因果机制，将候选原因沿设备与物流关系进行评分、排序和验证。", meta:"专题 · RCA", href:"https://github.com/Azure-Samples/industrial-iot-patterns" },
  { kind:"原理", industry:"通用", title:"混合式工业 RAG", summary:"同时检索标准文档、结构化对象、知识图谱和时间窗口数据，回答必须附带来源、时间和工况。", meta:"专题 · Graph + RAG", href:"https://modelcontextprotocol.io/" },
  { kind:"原理", industry:"通用", title:"人在回路与渐进式自治", summary:"依据动作风险将智能体分为检索、分析、建议、审批式执行和自治五级，并分别设置验证与审计。", meta:"专题 · AI Governance", href:"https://www.nist.gov/itl/ai-risk-management-framework" },
  { kind:"文献", industry:"自动化", title:"OPC UA 在线规范", summary:"面向工业互操作、安全通信和对象化信息模型的官方可检索规范入口。", meta:"标准 · OPC Foundation", href:"https://reference.opcfoundation.org/" },
  { kind:"文献", industry:"制造运营", title:"ISA-95 / IEC 62264", summary:"组织企业计划与制造运营、控制之间的活动、对象和接口，是工业语义分层的重要参考。", meta:"标准 · ISA", href:"https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard" },
  { kind:"文献", industry:"批次", title:"ISA-88 Batch Control", summary:"定义批控制的过程模型、物理模型和程序控制模型，适用于医药与精细化工批次语义建设。", meta:"标准 · ISA", href:"https://www.isa.org/standards-and-publications/isa-standards/isa-88-standard" },
  { kind:"文献", industry:"流程工业", title:"NAMUR Open Architecture", summary:"通过开放但受控的监测与优化通道利用生产数据，同时保持核心控制域的稳定和安全。", meta:"架构 · NAMUR", href:"https://www.namur.net/en/work-areas-and-project-groups/focus-topics/namur-open-architecture.html" },
  { kind:"文献", industry:"AI治理", title:"NIST AI Risk Management Framework", summary:"从治理、映射、度量和管理四类活动建立 AI 风险管理框架，可用于工业智能体治理基线。", meta:"框架 · NIST", href:"https://www.nist.gov/itl/ai-risk-management-framework" },
  { kind:"开源", industry:"时序", title:"MOMENT", summary:"面向预测、分类、异常检测与插补的开源通用时间序列基础模型家族。", meta:"模型 · 开源", href:"https://github.com/moment-timeseries-foundation-model/moment" },
  { kind:"开源", industry:"时序", title:"UniTS", summary:"使用共享模型与权重支持预测、分类、插补和异常检测等多种时间序列任务。", meta:"模型 · 开源", href:"https://github.com/mims-harvard/UniTS" },
  { kind:"开源", industry:"时序", title:"Time-Series-Library", summary:"覆盖长短期预测、分类、异常检测和缺失值填补的深度时序研究代码库。", meta:"工具库 · 开源", href:"https://github.com/thuml/Time-Series-Library" },
  { kind:"开源", industry:"连接", title:"UA-.NETStandard", summary:"OPC Foundation 维护的跨平台 OPC UA .NET 实现，适合构建工业连接与信息模型服务。", meta:"协议栈 · 开源", href:"https://github.com/OPCFoundation/UA-.NETStandard" },
  { kind:"开源", industry:"安全", title:"HAI Dataset", summary:"用于工业控制系统异常与网络攻击研究的硬件在环数据集，并附带相关研究线索。", meta:"数据集 · 开源", href:"https://github.com/icsdataset/hai" },
  { kind:"供应商", industry:"综合", title:"Siemens Industrial AI", summary:"覆盖工业设计、制造实现、运行优化与数据上下文化的端到端工业 AI 叙事与产品组合。", meta:"全球厂商 · 自动化/软件", href:"https://www.siemens.com/en-us/company/artificial-intelligence/industrial-ai/" },
  { kind:"供应商", industry:"流程工业", title:"AspenTech Industrial AI", summary:"强调将物理、化学与工程知识同 AI 结合，覆盖流程模拟、APM、计划调度与运营优化。", meta:"全球厂商 · 工业软件", href:"https://www.aspentech.com/en/cp/industrial-ai" },
  { kind:"供应商", industry:"流程工业", title:"ABB Genix", summary:"面向工业数据上下文化、资产绩效、异常检测、机会损失和生成式 AI 的平台与应用组合。", meta:"全球厂商 · 自动化/平台", href:"https://new.abb.com/process-automation/genix" },
  { kind:"供应商", industry:"综合", title:"Yokogawa AI Solutions", summary:"基于过程自动化经验，将 AI 产品用于制造现场分析、预测与运营支持。", meta:"全球厂商 · 流程自动化", href:"https://www.yokogawa.com/solutions/solutions/ai/" },
  { kind:"供应商", industry:"综合", title:"Schneider Electric Industrial AI", summary:"围绕 EcoStruxure 与 AVEVA 生态连接能源管理、自动化、工业软件和数据分析。", meta:"全球厂商 · 能源/自动化", href:"https://www.se.com/ww/en/work/solutions/artificial-intelligence/" },
];

export default function Home() {
  const [activeNode, setActiveNode] = useState("agent");
  const [industryFilter, setIndustryFilter] = useState("全部");
  const [libraryTab, setLibraryTab] = useState("案例");
  const [libraryQuery, setLibraryQuery] = useState("");
  const active = graphNodes.find((item) => item.id === activeNode);
  const shownLibraryItems = libraryItems.filter(item => item.kind === libraryTab && `${item.title}${item.summary}${item.industry}${item.meta}`.toLowerCase().includes(libraryQuery.toLowerCase()));

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="返回首页">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>流程工业 <b>AI</b> 与智能体</span>
        </a>
        <nav aria-label="主导航">
          <a href="#knowledge">知识图谱</a><a href="#industries">行业场景</a><a href="#stack">技术栈</a><a href="#library">专题知识库</a><a href="#radar">研究雷达</a>
        </nav>
        <div className="system-status"><span />知识库持续演进</div>
      </header>

      <section className="hero" id="top">
        <div className="grid-overlay" aria-hidden="true" />
        <div className="hero-copy">
          <p className="eyebrow"><span>PROCESS INDUSTRY INTELLIGENCE</span><em>研究与实践门户</em></p>
          <h1>让工业知识、<br />实时数据与智能体<br /><span>协同工作</span></h1>
          <p className="hero-subtitle">连接传统工业自动化、数字化与 AI 原生能力，探索化工、冶金、建材、医药、农药、涂料与电子化学品的新一代工业智能。</p>
          <div className="hero-actions">
            <a className="button primary" href="#knowledge">探索知识地图 <span>→</span></a>
            <a className="button secondary" href="#industries">查看应用场景 <span>↗</span></a>
          </div>
          <div className="principles"><span>机理与数据融合</span><span>人在回路</span><span>安全可信</span></div>
        </div>

        <div className="graph-shell" aria-label="工业智能体知识网络">
          <div className="graph-title"><span>KNOWLEDGE NETWORK</span><b>工业认知关系图</b></div>
          <div className="graph-canvas">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
            <div className="connector connector-a" /><div className="connector connector-b" /><div className="connector connector-c" /><div className="connector connector-d" />
            <button className={`core-node ${activeNode === "agent" ? "active" : ""}`} onClick={() => setActiveNode("agent")}>
              <span className="agent-glyph" aria-hidden="true">AI</span><b>工业智能体</b><small>感知 · 推理 · 执行</small>
            </button>
            {graphNodes.map((node) => (
              <button key={node.id} className={`graph-node ${node.className} ${activeNode === node.id ? "active" : ""}`} onClick={() => setActiveNode(node.id)}>
                <b>{node.label}</b><small>{node.note}</small>
              </button>
            ))}
            <span className="micro-node micro-a">OPC UA</span><span className="micro-node micro-b">HAZOP</span><span className="micro-node micro-c">S88</span><span className="micro-node micro-d">MCP</span><span className="micro-node micro-e">RAG</span>
          </div>
          <div className="node-detail" aria-live="polite">
            <span>当前节点 · {active ? active.label : "核心"}</span>
            <b>{active ? active.note : "编排知识、模型与工具，支持诊断、决策和受控执行"}</b>
            <button onClick={() => document.querySelector("#knowledge")?.scrollIntoView({ behavior: "smooth" })}>进入知识地图 →</button>
          </div>
        </div>
      </section>

      <section className="signal-strip" aria-label="内容概览">
        <article><span className="metric-icon">⌬</span><div><small>覆盖行业</small><b>7 <em>大领域</em></b></div><p>连续、批次与混合流程</p></article>
        <article><span className="metric-icon">◎</span><div><small>知识框架</small><b>5 <em>条主线</em></b></div><p>原理、技术、产品、案例、实践</p></article>
        <article><span className="metric-icon">↗</span><div><small>演进路径</small><b>4 <em>个阶段</em></b></div><p>自动化 → 数字化 → 智能化 → 智能体</p></article>
      </section>

      <section className="knowledge-section light-section" id="knowledge">
        <div className="section-head"><div><p className="section-kicker">01 / KNOWLEDGE MAP</p><h2>从控制闭环，走向认知闭环</h2></div><p>工业智能体不是在传统系统上增加一个聊天窗口，而是把对象语义、实时状态、分析模型、领域知识和受控工具组织为可验证的认知闭环。</p></div>
        <div className="evolution-track">
          <article><span>01</span><small>AUTOMATION</small><h3>自动化</h3><p>感知与控制物理过程</p><b>PLC · DCS · SIS · SCADA</b></article>
          <i>→</i><article><span>02</span><small>DIGITALIZATION</small><h3>数字化</h3><p>记录并关联生产事实</p><b>Historian · MES · EBR · KPI</b></article>
          <i>→</i><article><span>03</span><small>INTELLIGENCE</small><h3>智能化</h3><p>预测、诊断与优化</p><b>SPC · ML · MPC · Digital Twin</b></article>
          <i>→</i><article className="highlight"><span>04</span><small>AGENTIC SYSTEM</small><h3>智能体</h3><p>理解任务并编排工具</p><b>RAG · MCP · Planning · Guardrails</b></article>
        </div>
        <div className="knowledge-layers">
          <div className="layer-intro"><span>工业认知栈</span><h3>五类资产，构成智能体的“工业上下文”</h3><p>每一层都可独立建设，但只有共享对象标识、时间语义和证据链，才能形成可信的跨系统推理。</p></div>
          {[
            ["01","对象与关系","装置、设备、仪表、物料、批次、人员"],
            ["02","数据与事件","实时值、质量码、报警、操作、工况、批记录"],
            ["03","模型与算法","机理模型、统计模型、软测量、优化与仿真"],
            ["04","知识与规则","标准、SOP、HAZOP、经验规则、技术文献"],
            ["05","工具与治理","查询、计算、诊断、审批、执行、审计与权限"],
          ].map(([n,t,d])=><article key={n}><b>{n}</b><div><h4>{t}</h4><p>{d}</p></div><span>↗</span></article>)}
        </div>
      </section>

      <section className="industries-section dark-section" id="industries">
        <div className="section-head dark"><div><p className="section-kicker">02 / INDUSTRY SCENARIOS</p><h2>从高价值问题出发</h2></div><p>优先选择证据充分、边界清晰、可由现有工业数据支撑的任务；让智能体先成为工程师的分析伙伴，再逐步进入受控决策。</p></div>
        <div className="filter-row" role="group" aria-label="按行业筛选">
          {["全部",...industryCards.map(c=>c.industry)].map(item=><button key={item} className={industryFilter===item?"active":""} onClick={()=>setIndustryFilter(item)}>{item}</button>)}
        </div>
        <div className="industry-grid">
          {industryCards.filter(card=>industryFilter==="全部"||card.industry===industryFilter).map(card=><article key={card.code}>
            <div className="card-top"><span>{card.code} / {card.industry}</span><em>{card.level}</em></div><h3>{card.title}</h3><p>{card.desc}</p><div className="tag-row">{card.tags.map(tag=><b key={tag}>{tag}</b>)}</div><button onClick={()=>setActiveNode("knowledge")}>查看能力链 →</button>
          </article>)}
        </div>
      </section>

      <section className="stack-section light-section" id="stack">
        <div className="section-head"><div><p className="section-kicker">03 / AGENT ARCHITECTURE</p><h2>工业智能体参考架构</h2></div><p>大模型负责理解、计划和解释；工业软件、算法与规则负责计算和执行。所有结论都应可回到数据、模型与知识来源。</p></div>
        <div className="architecture">
          <aside><span>目标</span><h3>可信工业智能体</h3><ul><li>有证据地回答</li><li>有边界地调用工具</li><li>有审批地执行</li><li>有记录地持续改进</li></ul></aside>
          <div className="architecture-layers">
            <article className="arch-agent"><b>智能体编排层</b><span>任务理解</span><span>规划分解</span><span>记忆与上下文</span><span>多智能体协作</span></article>
            <article><b>知识与模型层</b><span>知识图谱</span><span>RAG</span><span>机理模型</span><span>时序/统计模型</span></article>
            <article><b>工具与服务层</b><span>指标计算</span><span>诊断算法</span><span>仿真优化</span><span>报表与工作流</span></article>
            <article><b>工业数据层</b><span>OPC UA</span><span>Historian</span><span>MES/EBR</span><span>文档与主数据</span></article>
            <article className="arch-base"><b>安全治理底座</b><span>身份权限</span><span>质量与血缘</span><span>Guardrails</span><span>审计与评估</span></article>
          </div>
        </div>
        <div className="boundary-note"><b>关键边界</b><p>“建议”与“自动执行”必须分级。涉及联锁、控制设定值、配方、质量放行与安全环保的动作，默认保持人在回路，并由现有工业控制与业务系统承担最终执行权。</p></div>
      </section>

      <section className="radar-section dark-section" id="radar">
        <div className="section-head dark"><div><p className="section-kicker">04 / TECHNOLOGY RADAR</p><h2>技术雷达：现在、下一步与观察区</h2></div><p>用成熟度与工业风险共同判断技术位置，避免把通用 AI 的演示能力误当成流程工业的生产能力。</p></div>
        <div className="radar-board">
          <div className="radar-visual"><div className="radar-ring ring-a"><span>采用</span></div><div className="radar-ring ring-b"><span>验证</span></div><div className="radar-ring ring-c"><span>观察</span></div><i className="dot d1">1</i><i className="dot d2">2</i><i className="dot d3">3</i><i className="dot d4">4</i><i className="dot d5">5</i><i className="dot d6">6</i></div>
          <div className="radar-list">
            <article><b>01</b><div><h3>混合式 RAG</h3><p>文档检索 + 图谱关系 + 时序查询</p></div><em>采用</em></article>
            <article><b>02</b><div><h3>受控工具调用</h3><p>MCP / API / CLI 与审批式工作流</p></div><em>采用</em></article>
            <article><b>03</b><div><h3>时序基础模型</h3><p>跨装置迁移与小样本适配</p></div><em>验证</em></article>
            <article><b>04</b><div><h3>机理—数据融合</h3><p>物理约束学习与混合数字孪生</p></div><em>验证</em></article>
            <article><b>05</b><div><h3>多智能体协作</h3><p>按工艺、设备、控制与安全角色分工</p></div><em>观察</em></article>
            <article><b>06</b><div><h3>自主闭环控制</h3><p>由智能体直接修改生产控制目标</p></div><em className="warn">谨慎</em></article>
          </div>
        </div>
      </section>

      <section className="library-section light-section" id="library">
        <div className="section-head"><div><p className="section-kicker">05 / INDUSTRIAL AI LIBRARY</p><h2>专题、案例与生态知识库</h2></div><p>使用统一条目结构组织应用方案、底层原理、标准论文、开源资源和供应商产品。当前为首批精选索引，后续可继续扩充为带全文、关系图和更新机制的内容底座。</p></div>
        <div className="library-toolbar">
          <div className="library-tabs" role="tablist" aria-label="知识库分类">
            {["案例","原理","文献","开源","供应商"].map(tab=><button key={tab} role="tab" aria-selected={libraryTab===tab} className={libraryTab===tab?"active":""} onClick={()=>setLibraryTab(tab)}><span>{tab}</span><small>{libraryItems.filter(i=>i.kind===tab).length}</small></button>)}
          </div>
          <label className="library-search"><span>⌕</span><input value={libraryQuery} onChange={e=>setLibraryQuery(e.target.value)} placeholder="搜索主题、行业或技术…" aria-label="搜索专题知识库" /></label>
        </div>
        <div className="library-summary"><b>{libraryTab}</b><span>{shownLibraryItems.length} 条精选内容</span><em>来源优先级：标准组织 / 原始论文 / 官方仓库 / 厂商资料</em></div>
        <div className="library-grid">
          {shownLibraryItems.map((item,index)=><a key={`${item.kind}-${item.title}`} href={item.href} target="_blank" rel="noreferrer">
            <div className="library-index">{String(index+1).padStart(2,"0")}</div><div className="library-content"><div><span>{item.industry}</span><small>{item.meta}</small></div><h3>{item.title}</h3><p>{item.summary}</p><b>阅读来源 ↗</b></div>
          </a>)}
          {shownLibraryItems.length===0&&<div className="library-empty"><b>没有匹配内容</b><p>请更换关键词，或切换知识库分类。</p></div>}
        </div>
        <div className="vendor-map" aria-label="工业 AI 生态分层">
          <div><p className="section-kicker">ECOSYSTEM MAP</p><h3>供应商不宜只按“是否有 AI”比较</h3><p>建议从其在工业技术栈中的位置、数据控制权、领域模型、交付方式和安全边界进行评估。</p></div>
          <article><span>01</span><b>控制与边缘</b><p>DCS / PLC / SCADA / 边缘计算</p></article><article><span>02</span><b>工业数据与语义</b><p>Historian / DataOps / Contextualization</p></article><article><span>03</span><b>工程与运营模型</b><p>Simulation / APM / MES / Optimization</p></article><article><span>04</span><b>AI 与智能体平台</b><p>Foundation Model / Agent / Copilot</p></article>
        </div>
      </section>

      <section className="resources-section light-section" id="resources">
        <div className="section-head"><div><p className="section-kicker">06 / STARTING POINTS</p><h2>从权威标准与可运行代码开始</h2></div><p>以下入口适合作为团队学习和原型验证的第一站；专题知识库则提供更系统的分类、解释和场景关联。</p></div>
        <div className="resource-grid">{resources.map(item=><a key={item.title} href={item.href} target="_blank" rel="noreferrer"><span>{item.type}</span><small>{item.org}</small><h3>{item.title}</h3><p>{item.text}</p><b>访问来源 ↗</b></a>)}</div>
        <div className="source-policy"><b>收录原则</b><span>权威性</span><span>可验证</span><span>可复现</span><span>工业相关性</span><span>安全与合规</span></div>
      </section>

      <section className="practice-section">
        <p className="section-kicker">FROM RESEARCH TO PRACTICE</p><h2>一条务实的工业 AI 落地路径</h2>
        <div className="practice-grid"><article><b>01</b><h3>定义问题</h3><p>锁定决策对象、价值、频率与错误成本。</p></article><article><b>02</b><h3>建立上下文</h3><p>统一对象、时间、工况与证据来源。</p></article><article><b>03</b><h3>工具化能力</h3><p>将既有算法和工业软件封装为可调用工具。</p></article><article><b>04</b><h3>渐进式自治</h3><p>从检索、解释、建议走向审批式执行。</p></article></div>
      </section>

      <footer>
        <div className="footer-main">
          <div className="brand"><span className="brand-mark" aria-hidden="true"><i/><i/><i/></span><span>流程工业 <b>AI</b> 与智能体</span></div>
          <p>连接工业知识、实时数据、模型与可信行动。</p>
          <a href="#top">回到顶部 ↑</a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} 致联工业 AI 研究 · 研究与实践门户</span>
        </div>
      </footer>
    </main>
  );
}
