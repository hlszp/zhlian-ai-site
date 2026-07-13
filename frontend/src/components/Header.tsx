export default function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="返回首页">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>
          流程工业 <b>AI</b> 与智能体
        </span>
      </a>
      <nav aria-label="主导航">
        <a href="#knowledge">知识图谱</a>
        <a href="#industries">行业场景</a>
        <a href="#stack">技术栈</a>
        <a href="#library">专题知识库</a>
        <a href="#radar">研究雷达</a>
      </nav>
      <div className="system-status">
        <span />知识库持续演进
      </div>
    </header>
  );
}
