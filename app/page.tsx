import nextDynamic from "next/dynamic";
import { ArchitectureSection } from "@/components/ArchitectureSection";
import { HeroSection } from "@/components/HeroSection";
import { SiteFooter } from "@/components/SiteFooter";
import { TopNav } from "@/components/TopNav";
import { InteractiveGridBackground } from "@/components/ui/InteractiveGridBackground";
import { agents } from "@/data/agents";
import { getCurrentUser } from "@/lib/auth/current-user";
import { toSafeUser } from "@/lib/db/operator-users";

const AgentStore = nextDynamic(() =>
  import("@/components/AgentStore").then((mod) => mod.AgentStore),
);

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <main className="cyber-main-layout">
      <InteractiveGridBackground />
      <TopNav user={user ? toSafeUser(user) : null} />
      <HeroSection />
      <ArchitectureSection />
      <AgentStore agents={agents} />
      <SiteFooter />
    </main>
  );
}
