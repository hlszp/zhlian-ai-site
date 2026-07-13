export default function PracticeSection() {
  return (
    <section className="practice-section">
      <p className="section-kicker">FROM RESEARCH TO PRACTICE</p>
      <h2>一条务实的工业 AI 落地路径</h2>
      <div className="practice-grid">
        <article>
          <b>01</b>
          <h3>定义问题</h3>
          <p>锁定决策对象、价值、频率与错误成本。</p>
        </article>
        <article>
          <b>02</b>
          <h3>建立上下文</h3>
          <p>统一对象、时间、工况与证据来源。</p>
        </article>
        <article>
          <b>03</b>
          <h3>工具化能力</h3>
          <p>将既有算法和工业软件封装为可调用工具。</p>
        </article>
        <article>
          <b>04</b>
          <h3>渐进式自治</h3>
          <p>从检索、解释、建议走向审批式执行。</p>
        </article>
      </div>
    </section>
  );
}
