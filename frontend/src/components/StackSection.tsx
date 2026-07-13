export default function StackSection() {
  return (
    <section className="stack-section light-section" id="stack">
      <div className="section-head">
        <div>
          <p className="section-kicker">03 / AGENT ARCHITECTURE</p>
          <h2>工业智能体参考架构</h2>
        </div>
        <p>大模型负责理解、计划和解释；工业软件、算法与规则负责计算和执行。所有结论都应可回到数据、模型与知识来源。</p>
      </div>
      <div className="architecture">
        <aside>
          <span>目标</span>
          <h3>可信工业智能体</h3>
          <ul>
            <li>有证据地回答</li>
            <li>有边界地调用工具</li>
            <li>有审批地执行</li>
            <li>有记录地持续改进</li>
          </ul>
        </aside>
        <div className="architecture-layers">
          <article className="arch-agent">
            <b>智能体编排层</b>
            <span>任务理解</span>
            <span>规划分解</span>
            <span>记忆与上下文</span>
            <span>多智能体协作</span>
          </article>
          <article>
            <b>知识与模型层</b>
            <span>知识图谱</span>
            <span>RAG</span>
            <span>机理模型</span>
            <span>时序/统计模型</span>
          </article>
          <article>
            <b>工具与服务层</b>
            <span>指标计算</span>
            <span>诊断算法</span>
            <span>仿真优化</span>
            <span>报表与工作流</span>
          </article>
          <article>
            <b>工业数据层</b>
            <span>OPC UA</span>
            <span>Historian</span>
            <span>MES/EBR</span>
            <span>文档与主数据</span>
          </article>
          <article className="arch-base">
            <b>安全治理底座</b>
            <span>身份权限</span>
            <span>质量与血缘</span>
            <span>Guardrails</span>
            <span>审计与评估</span>
          </article>
        </div>
      </div>
      <div className="boundary-note">
        <b>关键边界</b>
        <p>“建议”与“自动执行”必须分级。涉及联锁、控制设定值、配方、质量放行与安全环保的动作，默认保持人在回路，并由现有工业控制与业务系统承担最终执行权。</p>
      </div>
    </section>
  );
}
