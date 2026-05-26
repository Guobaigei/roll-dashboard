import dynamic from "next/dynamic";
import { ArchitectureSection } from "@/components/ArchitectureSection";
import { HeroSection } from "@/components/HeroSection";
import { SiteFooter } from "@/components/SiteFooter";
import { TopNav } from "@/components/TopNav";
import { InteractiveGridBackground } from "@/components/ui/InteractiveGridBackground";
import { agents } from "@/data/agents";

const AgentStore = dynamic(() => import("@/components/AgentStore").then((mod) => mod.AgentStore));

export default function Home() {
  return (
    <main className="cyber-main-layout">
      <InteractiveGridBackground />
      <TopNav />
      <HeroSection />
      <ArchitectureSection />
      <AgentStore agents={agents} />
      <SiteFooter />
    </main>
  );
}
