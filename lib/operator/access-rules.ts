import type { RecruiterBinding, Tenant } from "@/lib/reply-authority/types";

export type BossIdentity = {
  platform: string;
  username: string;
};

export function matchesRecruiterBinding(boss: BossIdentity, binding: RecruiterBinding) {
  return binding.platform === boss.platform && binding.username === boss.username;
}

export function tenantMatchesBoss(tenant: Tenant, boss: BossIdentity) {
  const bindings = tenant.bindings?.zhipinRecruiters ?? [];
  return bindings.some((binding) => matchesRecruiterBinding(boss, binding));
}

export function filterTenantsForBoss(tenants: Tenant[], boss: BossIdentity) {
  return tenants.filter((tenant) => tenantMatchesBoss(tenant, boss));
}
