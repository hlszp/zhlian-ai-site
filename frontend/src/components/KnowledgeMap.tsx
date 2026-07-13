export default function KnowledgeMap() {
  return (
    <>
      <section className="signal-strip" aria-label="内容概览">
        <article>
          <span className="metric-icon">⌬</span>
          <div>
            <small>覆盖行业</small>
            <b>7 <em>大领域</em></b>
          </div>
          <p>连续、批次与混合流程</p>
        </article>
        <article>
          <span className="metric-icon">◎</span>
          <div>
            <small>知识框架</small>
            <b>5 <em>条主线</em></b>
          </div>
          <p>原理、技术、产品、案例、实践</p>
        </article>
        <article>
          <span className="metric-icon">↗</span>
          <div>
            <small>演进路径</small>
            <b>4 <em>个阶段</em></b>
          </div>
          <p>自动化 → 数字化 → 智能化 → 智能体</p>
        </article>
      </section>

      <section className="knowledge-section light-section" id="knowledge">
        <div className="section-head">
          <div>
            <p className="section-kicker">01 / KNOWLEDGE MAP</p>
            <h2>从控制闭环，走向认知闭环</h2>
          </div>
          <p>工业智能体不是在传统系统上增加一个聊天窗口，而是把对象语义、实时状态、分析模型、领域知识和受控工具组织为可验证的认知闭环。</p>
        </div>
        <div className="evolution-track">
          <article>
            <span>01</span>
            <small>AUTOMATION</small>
            <h3>自动化</h3>
            <p>感知与控制物理过程</p>
            <b>PLC · DCS · SIS · SCADA</b>
          </article>
          <i>→</i>
          <article>
            <span>02</span>
            <small>DIGITALIZATION</small>
            <h3>数字化</h3>
            <p>记录并关联生产事实</p>
            <b>Historian · MES · EBR · KPI</b>
          </article>
          <i>→</i>
          <article>
            <span>03</span>
            <small>INTELLIGENCE</small>
            <h3>智能化</h3>
            <p>预测、诊断与优化</p>
            <b>SPC · ML · MPC · Digital Twin</b>
          </article>
          <i>→</i>
          <article className="highlight">
            <span>04</span>
            <small>AGENTIC SYSTEM</small>
            <h3>智能体</h3>
            <p>理解任务并编排工具</p>
            <b>RAG · MCP · Planning · Guardrails</b>
          </article>
        </div>
        <div className="knowledge-layers">
          <div className="layer-intro">
            <span>工业认知栈</span>
            <h3>五类资产，构成智能体的“工业上下文”</h3>
            <p>每一层都可独立建设，但只有共享对象标识、时间语义和证据链，才能形成可信的跨系统推理。</p>
          </div>
          {[
            ["01", "对象与关系", "装置、设备、仪表、物料、批次、人员"],
            ["02", "数据与事件", "实时值、质量码、报警、操作、工况、批记录"],
            ["03", "模型与算法", "机理模型、统计模型、软测量、优化与仿真"],
            ["04", "知识与规则", "标准、SOP、HAZOP、经验规则、技术文献"],
            ["05", "工具与治理", "查询、计算、诊断、审批、执行、审计与权限"],
          ].map(([n, t, d]) => (
            <article key={n}>
              <b>{n}</b>
              <div>
                <h4>{t}</h4>
                <p>{d}</p>
              </div>
              <span>↗</span>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
