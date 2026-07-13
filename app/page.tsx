import nextDynamic from "next/dynamic";
import { AgentIntegrationSection } from "@/components/AgentIntegrationSection";
import { ArchitectureSection } from "@/components/ArchitectureSection";
import { HeroSection } from "@/components/HeroSection";
import { SiteFooter } from "@/components/SiteFooter";
import { TopNav } from "@/components/TopNav";
import { UseCasesSection } from "@/components/UseCasesSection";
import { InteractiveGridBackground } from "@/components/ui/InteractiveGridBackground";
import { WaysToWorkSection } from "@/components/WaysToWorkSection";
import { agents } from "@/data/agents";
import { getCurrentUser } from "@/lib/auth/current-user";
import { toSafeUser } from "@/lib/db/operator-users";

const AgentStore = nextDynamic(() =>
  import("@/components/AgentStore").then((mod) => mod.AgentStore),
);

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Home({ searchParams }: HomePageProps) {
  const [user, resolvedSearchParams] = await Promise.all([getCurrentUser(), searchParams]);
  const requestedAgentId = getSingleSearchParam(resolvedSearchParams.agent);
  const initialAgentId = agents.some((agent) => agent.id === requestedAgentId)
    ? requestedAgentId
    : undefined;

  return (
    <div className="cyber-main-layout">
      <a className="skip-link" href="#main-content">
        跳到主要内容
      </a>
      <InteractiveGridBackground />
      <TopNav user={user ? toSafeUser(user) : null} />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <WaysToWorkSection />
        <ArchitectureSection />
        <UseCasesSection />
        <AgentStore agents={agents} initialAgentId={initialAgentId} />
        <AgentIntegrationSection />
      </main>
      <SiteFooter />
    </div>
  );
}
