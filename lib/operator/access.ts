import "server-only";

import { decryptOperatorUserClientTokens } from "@/lib/db/operator-user-client-tokens";
import type { OperatorUserRow } from "@/lib/db/types";
import { ForbiddenError, UpstreamHttpError } from "@/lib/http/errors";
import {
  type BossIdentity,
  filterTenantsForBoss,
  tenantMatchesBoss,
} from "@/lib/operator/access-rules";
import {
  getAuthContext,
  getClientTenant,
  listClientTenants,
  patchClientTenant,
  syncClientTenantBrandConfig,
} from "@/lib/reply-authority/client";
import type { AuthContext, Tenant, TenantPatchInput } from "@/lib/reply-authority/types";
import { formatClientTokenFingerprint } from "@/lib/security/client-token-vault";

const TENANT_CONFIG_READ_SCOPE = "tenant-config:read";
const TENANT_CONFIG_WRITE_SCOPE = "tenant-config:write";
const BRAND_SYNC_WRITE_SCOPE = "brand-sync:write";

type DecryptedClientToken = Awaited<ReturnType<typeof decryptOperatorUserClientTokens>>[number];

export type TokenWarning = {
  tokenId: string;
  label: string | null;
  fingerprint: string;
  message: string;
};

export type AccessibleTenant = Tenant & {
  access: {
    canWrite: boolean;
  };
};

export function bossIdentityFromUser(user: OperatorUserRow): BossIdentity {
  return {
    platform: user.boss_platform,
    username: user.boss_username,
  };
}

function tokenWarning(token: DecryptedClientToken, message: string): TokenWarning {
  return {
    tokenId: token.id,
    label: token.client_token_label,
    fingerprint: formatClientTokenFingerprint(token.client_token_fingerprint),
    message,
  };
}

function hasScope(context: AuthContext, scope: string) {
  return Array.isArray(context.scopes) && context.scopes.includes(scope);
}

async function getReadableClientContext(clientToken: string) {
  const context = await getAuthContext(clientToken);

  if (context.role !== "client" || !Array.isArray(context.tenantIds)) {
    throw new ForbiddenError("客户端令牌无效");
  }

  if (!hasScope(context, TENANT_CONFIG_READ_SCOPE)) {
    throw new ForbiddenError("客户端令牌缺少 tenant-config:read 权限");
  }

  return context;
}

function mergeTenantGroups(tenantGroups: AccessibleTenant[][]) {
  const tenantsById = new Map<string, AccessibleTenant>();

  for (const tenants of tenantGroups) {
    for (const tenant of tenants) {
      const current = tenantsById.get(tenant.tenantId);
      if (!current) {
        tenantsById.set(tenant.tenantId, tenant);
        continue;
      }

      tenantsById.set(tenant.tenantId, {
        ...current,
        access: {
          canWrite: current.access.canWrite || tenant.access.canWrite,
        },
      });
    }
  }

  return [...tenantsById.values()].sort((left, right) =>
    left.tenantId.localeCompare(right.tenantId),
  );
}

type TenantTokenCandidate = {
  token: DecryptedClientToken;
  tenant: Tenant;
  canWrite: boolean;
  canSyncBrand: boolean;
};

async function findTenantTokenCandidates(
  user: OperatorUserRow,
  tenantId: string,
): Promise<TenantTokenCandidate[]> {
  const savedClientTokens = await decryptOperatorUserClientTokens(user.id);
  const boss = bossIdentityFromUser(user);
  const candidates: TenantTokenCandidate[] = [];
  let firstUnexpectedError: Error | null = null;

  for (const savedClientToken of savedClientTokens) {
    try {
      const context = await getReadableClientContext(savedClientToken.clientToken);
      const tenant = await getClientTenant(savedClientToken.clientToken, tenantId);

      if (!tenantMatchesBoss(tenant, boss)) {
        continue;
      }

      candidates.push({
        token: savedClientToken,
        tenant,
        canWrite: hasScope(context, TENANT_CONFIG_WRITE_SCOPE),
        canSyncBrand: hasScope(context, BRAND_SYNC_WRITE_SCOPE),
      });
    } catch (error) {
      if (error instanceof UpstreamHttpError && (error.status === 403 || error.status === 404)) {
        continue;
      }

      if (error instanceof ForbiddenError) {
        continue;
      }

      if (!firstUnexpectedError && error instanceof Error) {
        firstUnexpectedError = error;
      }
    }
  }

  if (candidates.length > 0) {
    return candidates;
  }

  if (firstUnexpectedError) {
    throw firstUnexpectedError;
  }

  throw new ForbiddenError("当前账号无权访问该租户");
}

export async function getAccessibleTenantsForUser(user: OperatorUserRow) {
  const savedClientTokens = await decryptOperatorUserClientTokens(user.id);
  if (savedClientTokens.length === 0) {
    return {
      tenants: [] as AccessibleTenant[],
      warnings: [] as TokenWarning[],
      tokenCount: 0,
    };
  }

  const boss = bossIdentityFromUser(user);
  const results = await Promise.all(
    savedClientTokens.map(async (savedClientToken) => {
      try {
        const context = await getReadableClientContext(savedClientToken.clientToken);
        const tenantResponse = await listClientTenants(savedClientToken.clientToken);
        const canWrite = hasScope(context, TENANT_CONFIG_WRITE_SCOPE);
        const tenants = filterTenantsForBoss(tenantResponse.tenants, boss).map((tenant) => ({
          ...tenant,
          access: { canWrite },
        }));

        return { tenants, warning: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : "客户端令牌请求失败";
        return {
          tenants: [] as AccessibleTenant[],
          warning: tokenWarning(savedClientToken, message),
        };
      }
    }),
  );

  return {
    tenants: mergeTenantGroups(results.map((result) => result.tenants)),
    warnings: results
      .map((result) => result.warning)
      .filter((warning): warning is TokenWarning => Boolean(warning)),
    tokenCount: savedClientTokens.length,
  };
}

export async function getAccessibleTenantDetail(user: OperatorUserRow, tenantId: string) {
  const candidates = await findTenantTokenCandidates(user, tenantId);
  const result = candidates[0];

  return {
    tenant: result.tenant,
    canWrite: candidates.some((candidate) => candidate.canWrite),
    canSyncBrand: candidates.some((candidate) => candidate.canSyncBrand),
  };
}

export async function patchAccessibleTenant(
  user: OperatorUserRow,
  tenantId: string,
  patch: TenantPatchInput,
) {
  const candidates = await findTenantTokenCandidates(user, tenantId);
  const result = candidates.find((candidate) => candidate.canWrite);
  if (!result) {
    throw new ForbiddenError("当前客户端令牌缺少 tenant-config:write 权限");
  }

  const tenant = await patchClientTenant(result.token.clientToken, tenantId, patch);

  return {
    tenant,
    canWrite: true,
    canSyncBrand: candidates.some((candidate) => candidate.canSyncBrand),
  };
}

export async function syncAccessibleTenantBrandConfig(user: OperatorUserRow, tenantId: string) {
  const candidates = await findTenantTokenCandidates(user, tenantId);
  const result = candidates.find((candidate) => candidate.canSyncBrand);
  if (!result) {
    throw new ForbiddenError("当前客户端令牌缺少 brand-sync:write 权限");
  }

  const run = await syncClientTenantBrandConfig(result.token.clientToken, tenantId);
  const tenant = await getClientTenant(result.token.clientToken, tenantId);

  return {
    run,
    tenant,
    canWrite: candidates.some((candidate) => candidate.canWrite),
    canSyncBrand: true,
  };
}
