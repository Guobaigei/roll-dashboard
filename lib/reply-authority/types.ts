export type AuthContext = {
  role: "client" | "admin";
  clientId: string;
  tenantIds: string[] | null;
  scopes: string[];
};

export type RecruiterBinding = {
  platform: string;
  username: string;
  accountId?: string;
};

export type TenantSyncParams = {
  provider?: string;
  enabled?: boolean;
  brandAliasList?: string[];
  cityNames?: string[];
  preferredDefaultBrandName?: string;
  [key: string]: unknown;
};

export type Tenant = {
  tenantId: string;
  displayName?: string;
  status: "created" | "ready" | "disabled" | string;
  bindings?: {
    zhipinRecruiters?: RecruiterBinding[];
  };
  syncParams?: TenantSyncParams;
  manifestRevision?: string;
  ready: boolean;
  syncedAt: string | null;
  hasLocalReplyPolicy: boolean;
};

export type TenantsResponse = {
  tenants: Tenant[];
};

export type TenantPatchInput = {
  baseManifestRevision?: string;
  displayName?: string;
  bindings?: {
    zhipinRecruiters?: RecruiterBinding[];
  };
  syncParams?: {
    brandAliasList?: string[];
    cityNames?: string[];
    preferredDefaultBrandName?: string;
  };
};

export type BrandSyncTenantResult = {
  tenantId: string;
  status: "success" | "failed" | "skipped" | string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  source?: string;
  syncedAt?: string | null;
  brands?: number;
  stores?: number;
  positions?: number;
  usedJobListUrl?: string;
  brandAliases?: string[];
  reason?: string;
  error?: string;
};

export type BrandSyncRunSlice = {
  runId: string;
  trigger: "manual" | "scheduled" | string;
  status: "success" | "partial_failed" | "failed" | string;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  tenantResult: BrandSyncTenantResult;
};
