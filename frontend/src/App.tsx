import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import type { SiteData } from "./types";
import Header from "./components/Header";
import Hero from "./components/Hero";
import KnowledgeMap from "./components/KnowledgeMap";
import IndustryGrid from "./components/IndustryGrid";
import StackSection from "./components/StackSection";
import RadarSection from "./components/RadarSection";
import LibrarySection from "./components/LibrarySection";
import ResourcesSection from "./components/ResourcesSection";
import PracticeSection from "./components/PracticeSection";
import Footer from "./components/Footer";
import AdminApp from "./admin/AdminApp";
import siteData from "../public/site-data.json";

function HomePortal() {
  const data = siteData as SiteData;
  const [activeNode, setActiveNode] = useState("agent");

  return (
    <main>
      <Header />
      <Hero activeNode={activeNode} setActiveNode={setActiveNode} />
      <KnowledgeMap />
      <IndustryGrid articles={data.articles} setActiveNode={setActiveNode} />
      <StackSection />
      <RadarSection />
      <LibrarySection articles={data.articles} />
      <ResourcesSection articles={data.articles} />
      <PracticeSection />
      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/" element={<HomePortal />} />
      </Routes>
    </BrowserRouter>
  );
}
