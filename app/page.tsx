import dynamic from "next/dynamic";
import { CaseSection } from "@/components/CaseSection";
import { HeroSection } from "@/components/HeroSection";
import { PainSection } from "@/components/PainSection";
import { SiteFooter } from "@/components/SiteFooter";
import { TopNav } from "@/components/TopNav";
import { TrustSection } from "@/components/TrustSection";
import { WorkflowSection } from "@/components/WorkflowSection";
import { agents } from "@/data/agents";

const AgentStore = dynamic(() => import("@/components/AgentStore").then((mod) => mod.AgentStore));

export default function Home() {
  return (
    <main>
      <TopNav />
      <HeroSection />
      <PainSection />
      <WorkflowSection />
      <AgentStore agents={agents} />
      <CaseSection />
      <TrustSection />
      <SiteFooter />
    </main>
  );
}
