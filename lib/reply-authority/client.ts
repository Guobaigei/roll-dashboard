import "server-only";

import { ConfigError, UpstreamHttpError, UpstreamUnavailableError } from "@/lib/http/errors";
import type {
  AuthContext,
  BrandSyncRunSlice,
  Tenant,
  TenantPatchInput,
  TenantsResponse,
} from "@/lib/reply-authority/types";

function getBaseUrl() {
  const baseUrl = process.env.REPLY_AUTHORITY_BASE_URL;
  if (!baseUrl) {
    throw new ConfigError("缺少 REPLY_AUTHORITY_BASE_URL 配置");
  }

  return baseUrl;
}

async function parseJson(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function requestReplyAuthority<T>(
  path: string,
  clientToken: string,
  init?: RequestInit,
): Promise<T> {
  const url = new URL(path, getBaseUrl());

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${clientToken}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new UpstreamUnavailableError();
  }

  const payload = await parseJson(response);
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "租户服务请求失败";
    throw new UpstreamHttpError(response.status, message, payload);
  }

  return payload as T;
}

export function getAuthContext(clientToken: string) {
  return requestReplyAuthority<AuthContext>("/auth/context", clientToken);
}

export function listClientTenants(clientToken: string) {
  return requestReplyAuthority<TenantsResponse>("/tenants", clientToken);
}

export function getClientTenant(clientToken: string, tenantId: string) {
  return requestReplyAuthority<Tenant>(`/tenants/${encodeURIComponent(tenantId)}`, clientToken);
}

export function patchClientTenant(clientToken: string, tenantId: string, body: TenantPatchInput) {
  return requestReplyAuthority<Tenant>(`/tenants/${encodeURIComponent(tenantId)}`, clientToken, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function syncClientTenantBrandConfig(clientToken: string, tenantId: string) {
  return requestReplyAuthority<BrandSyncRunSlice>(
    `/tenants/${encodeURIComponent(tenantId)}/brand-config:sync`,
    clientToken,
    {
      method: "POST",
    },
  );
}
