import { useState } from "react";

export default function Header() {
  const [navOpen, setNavOpen] = useState(false);

  const closeNav = () => setNavOpen(false);

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
      <button
        className="nav-toggle"
        type="button"
        aria-expanded={navOpen}
        aria-controls="site-navigation"
        aria-label={navOpen ? "关闭主导航" : "打开主导航"}
        onClick={() => setNavOpen((open) => !open)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <nav
        id="site-navigation"
        className={`site-nav ${navOpen ? "open" : ""}`}
        aria-label="主导航"
      >
        <a href="#knowledge" onClick={closeNav}>知识图谱</a>
        <a href="#industries" onClick={closeNav}>行业场景</a>
        <a href="#stack" onClick={closeNav}>技术栈</a>
        <a href="#library" onClick={closeNav}>专题知识库</a>
        <a href="#radar" onClick={closeNav}>研究雷达</a>
      </nav>
      <div className="system-status">
        <span />知识库持续演进
      </div>
    </header>
  );
}
