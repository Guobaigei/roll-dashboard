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
  getClientTenantReplyPolicy,
  listClientTenantBrandSyncRuns,
  listClientTenants,
  patchClientTenant,
  patchClientTenantReplyPolicy,
  syncClientTenantBrandConfig,
  validateClientTenantReplyPolicyPatch,
} from "@/lib/reply-authority/client";
import type {
  AuthContext,
  ReplyPolicyPatchInput,
  ReplyPolicyValidatePatchInput,
  Tenant,
  TenantPatchInput,
} from "@/lib/reply-authority/types";
import { formatClientTokenFingerprint } from "@/lib/security/client-token-vault";

const TENANT_CONFIG_READ_SCOPE = "tenant-config:read";
const TENANT_CONFIG_WRITE_SCOPE = "tenant-config:write";
const BRAND_SYNC_READ_SCOPE = "brand-sync:read";
const BRAND_SYNC_WRITE_SCOPE = "brand-sync:write";
const REPLY_POLICY_READ_SCOPE = "reply-policy:read";
const REPLY_POLICY_WRITE_SCOPE = "reply-policy:write";
const REPLY_POLICY_VALIDATE_SCOPE = "reply-policy:validate";

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
    canReadReplyPolicy: boolean;
    canWriteReplyPolicy: boolean;
    canValidateReplyPolicy: boolean;
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

function tenantAccessFromContext(context: AuthContext): AccessibleTenant["access"] {
  return {
    canWrite: hasScope(context, TENANT_CONFIG_WRITE_SCOPE),
    canReadReplyPolicy: hasScope(context, REPLY_POLICY_READ_SCOPE),
    canWriteReplyPolicy: hasScope(context, REPLY_POLICY_WRITE_SCOPE),
    canValidateReplyPolicy: hasScope(context, REPLY_POLICY_VALIDATE_SCOPE),
  };
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
          canReadReplyPolicy: current.access.canReadReplyPolicy || tenant.access.canReadReplyPolicy,
          canWriteReplyPolicy:
            current.access.canWriteReplyPolicy || tenant.access.canWriteReplyPolicy,
          canValidateReplyPolicy:
            current.access.canValidateReplyPolicy || tenant.access.canValidateReplyPolicy,
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
  canReadBrandSync: boolean;
  canSyncBrand: boolean;
  canReadReplyPolicy: boolean;
  canWriteReplyPolicy: boolean;
  canValidateReplyPolicy: boolean;
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
        canReadBrandSync: hasScope(context, BRAND_SYNC_READ_SCOPE),
        canSyncBrand: hasScope(context, BRAND_SYNC_WRITE_SCOPE),
        canReadReplyPolicy: hasScope(context, REPLY_POLICY_READ_SCOPE),
        canWriteReplyPolicy: hasScope(context, REPLY_POLICY_WRITE_SCOPE),
        canValidateReplyPolicy: hasScope(context, REPLY_POLICY_VALIDATE_SCOPE),
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
        const access = tenantAccessFromContext(context);
        const tenants = filterTenantsForBoss(tenantResponse.tenants, boss).map((tenant) => ({
          ...tenant,
          access,
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

export async function listAccessibleTenantBrandSyncRuns(user: OperatorUserRow, tenantId: string) {
  const candidates = await findTenantTokenCandidates(user, tenantId);
  const result = candidates.find((candidate) => candidate.canReadBrandSync);
  if (!result) {
    throw new ForbiddenError("当前客户端令牌缺少 brand-sync:read 权限");
  }

  return listClientTenantBrandSyncRuns(result.token.clientToken, tenantId);
}

export async function getAccessibleTenantReplyPolicy(user: OperatorUserRow, tenantId: string) {
  const candidates = await findTenantTokenCandidates(user, tenantId);
  const result = candidates.find((candidate) => candidate.canReadReplyPolicy);
  if (!result) {
    throw new ForbiddenError("当前客户端令牌缺少 reply-policy:read 权限");
  }

  const replyPolicy = await getClientTenantReplyPolicy(result.token.clientToken, tenantId);

  return {
    tenant: result.tenant,
    ...replyPolicy,
    canWrite: candidates.some((candidate) => candidate.canWriteReplyPolicy),
    canValidate: candidates.some((candidate) => candidate.canValidateReplyPolicy),
  };
}

export async function validateAccessibleTenantReplyPolicyPatch(
  user: OperatorUserRow,
  tenantId: string,
  patch: ReplyPolicyValidatePatchInput,
) {
  const candidates = await findTenantTokenCandidates(user, tenantId);
  const result = candidates.find((candidate) => candidate.canValidateReplyPolicy);
  if (!result) {
    throw new ForbiddenError("当前客户端令牌缺少 reply-policy:validate 权限");
  }

  return validateClientTenantReplyPolicyPatch(result.token.clientToken, tenantId, patch);
}

export async function patchAccessibleTenantReplyPolicy(
  user: OperatorUserRow,
  tenantId: string,
  patch: ReplyPolicyPatchInput,
) {
  const candidates = await findTenantTokenCandidates(user, tenantId);
  const result = candidates.find((candidate) => candidate.canWriteReplyPolicy);
  if (!result) {
    throw new ForbiddenError("当前客户端令牌缺少 reply-policy:write 权限");
  }

  const replyPolicy = await patchClientTenantReplyPolicy(result.token.clientToken, tenantId, patch);

  return {
    tenant: result.tenant,
    ...replyPolicy,
    canWrite: true,
    canValidate: candidates.some((candidate) => candidate.canValidateReplyPolicy),
  };
}
