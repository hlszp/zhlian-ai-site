export default function Footer() {
  return (
    <footer>
      <div className="footer-main">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            流程工业 <b>AI</b> 与智能体
          </span>
        </div>
        <p>连接工业知识、实时数据、模型与可信行动。</p>
        <a href="#top">回到顶部 ↑</a>
      </div>
      <div className="footer-bottom">
        <span>ZHILIAN © {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
