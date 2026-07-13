export default function RadarSection() {
  return (
    <section className="radar-section dark-section" id="radar">
      <div className="section-head dark">
        <div>
          <p className="section-kicker">04 / TECHNOLOGY RADAR</p>
          <h2>技术雷达：现在、下一步与观察区</h2>
        </div>
        <p>用成熟度与工业风险共同判断技术位置，避免把通用 AI 的演示能力误当成流程工业的生产能力。</p>
      </div>
      <div className="radar-board">
        <div className="radar-visual">
          <div className="radar-ring ring-a">
            <span>采用</span>
          </div>
          <div className="radar-ring ring-b">
            <span>验证</span>
          </div>
          <div className="radar-ring ring-c">
            <span>观察</span>
          </div>
          <i className="dot d1">1</i>
          <i className="dot d2">2</i>
          <i className="dot d3">3</i>
          <i className="dot d4">4</i>
          <i className="dot d5">5</i>
          <i className="dot d6">6</i>
        </div>
        <div className="radar-list">
          <article>
            <b>01</b>
            <div>
              <h3>混合式 RAG</h3>
              <p>文档检索 + 图谱关系 + 时序查询</p>
            </div>
            <em>采用</em>
          </article>
          <article>
            <b>02</b>
            <div>
              <h3>受控工具调用</h3>
              <p>MCP / API / CLI 与审批式工作流</p>
            </div>
            <em>采用</em>
          </article>
          <article>
            <b>03</b>
            <div>
              <h3>时序基础模型</h3>
              <p>跨装置迁移与小样本适配</p>
            </div>
            <em>验证</em>
          </article>
          <article>
            <b>04</b>
            <div>
              <h3>机理—数据融合</h3>
              <p>物理约束学习与混合数字孪生</p>
            </div>
            <em>验证</em>
          </article>
          <article>
            <b>05</b>
            <div>
              <h3>多智能体协作</h3>
              <p>按工艺、设备、控制与安全角色分工</p>
            </div>
            <em>观察</em>
          </article>
          <article>
            <b>06</b>
            <div>
              <h3>自主闭环控制</h3>
              <p>由智能体直接修改生产控制目标</p>
            </div>
            <em className="warn">谨慎</em>
          </article>
        </div>
      </div>
    </section>
  );
}
