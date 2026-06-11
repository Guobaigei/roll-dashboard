"use client";

import { AlertTriangle, ArrowUpRight, Inbox, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatDateTime } from "@/lib/format";
import { readApiError } from "@/lib/http/client";
import type { Tenant } from "@/lib/reply-authority/types";

type TokenWarning = {
  tokenId: string;
  label: string | null;
  fingerprint: string;
  message: string;
};

type AccessibleTenant = Tenant & {
  access: {
    canWrite: boolean;
  };
};

type TenantsResponse = {
  tenants: AccessibleTenant[];
  warnings: TokenWarning[];
  tokenCount: number;
};

function bindingCount(tenant: Tenant) {
  return tenant.bindings?.zhipinRecruiters?.length ?? 0;
}

let tenantListRequest: Promise<TenantsResponse> | null = null;

function fetchTenantListOnce() {
  if (!tenantListRequest) {
    tenantListRequest = fetch("/api/operator/tenants", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response, "租户数据请求失败"));
        }

        return (await response.json()) as TenantsResponse;
      })
      .finally(() => {
        tenantListRequest = null;
      });
  }

  return tenantListRequest;
}

function ConfigureTokenPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="operator-panel operator-empty-panel">
      <KeyRound size={22} />
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="operator-action-link" href="/operator/account">
        去配置客户端令牌
        <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}

export function TenantList() {
  const [data, setData] = useState<TenantsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchTenantListOnce()
      .then((body) => {
        if (!cancelled) {
          setData(body);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "租户数据请求失败");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <section className="operator-shell">
        <div className="operator-hero">
          <p className="eyebrow">TENANT_ACCESS</p>
          <h1>我的租户</h1>
        </div>
        <div className="operator-alert operator-alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
        <ConfigureTokenPanel
          description="当前账号还没有可用客户端令牌，或已保存客户端令牌需要更新。请先进入账号配置检查客户端令牌。"
          title="先检查客户端令牌"
        />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="operator-shell">
        <div className="operator-hero">
          <p className="eyebrow">TENANT_ACCESS</p>
          <h1>我的租户</h1>
        </div>
        <div className="operator-empty-state">
          <Loader2 className="spin" size={18} />
          <span>正在通过 /api/operator/tenants 读取租户</span>
        </div>
      </section>
    );
  }

  const allTokensFailed =
    data.tokenCount > 0 && data.tenants.length === 0 && data.warnings.length >= data.tokenCount;

  return (
    <section className="operator-shell" aria-labelledby="tenant-title">
      <div className="operator-hero operator-hero-row">
        <div>
          <p className="eyebrow">TENANT_ACCESS</p>
          <h1 id="tenant-title">我的租户</h1>
          <p>租户列表由已保存客户端令牌拉取，并按当前用户名绑定过滤。</p>
        </div>
        <div className="operator-metric-card">
          <strong>{data.tenants.length}</strong>
          <span>可访问租户</span>
        </div>
      </div>

      {data.warnings.length > 0 ? (
        <div className="operator-warning-list">
          {data.warnings.map((warning) => (
            <div className="operator-alert" key={warning.tokenId}>
              <AlertTriangle size={16} />
              <span>
                {warning.label || `fp:${warning.fingerprint}`}：{warning.message}
              </span>
              <Link className="operator-alert-action" href="/operator/account">
                检查客户端令牌
                <ArrowUpRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      ) : null}

      {data.tokenCount === 0 ? (
        <ConfigureTokenPanel
          description="添加客户端令牌后，系统会自动拉取并合并可访问租户。"
          title="先添加客户端令牌"
        />
      ) : allTokensFailed ? (
        <ConfigureTokenPanel
          description="所有已保存客户端令牌都没有成功返回租户，请前往账号配置更新或删除失效客户端令牌。"
          title="客户端令牌不可用"
        />
      ) : data.tenants.length === 0 ? (
        <div className="operator-panel operator-empty-panel">
          <Inbox size={22} />
          <h2>暂无匹配租户</h2>
          <p>当前客户端令牌范围内没有绑定你用户名的租户。</p>
        </div>
      ) : (
        <div className="operator-table">
          <div className="operator-table-head">
            <span>租户</span>
            <span>状态</span>
            <span>同步时间</span>
            <span>Boss 绑定</span>
            <span>权限</span>
            <span />
          </div>
          {data.tenants.map((tenant) => (
            <Link
              className="operator-table-row"
              href={`/operator/tenants/${tenant.tenantId}`}
              key={tenant.tenantId}
            >
              <span className="operator-tenant-title">
                <strong>{tenant.displayName || tenant.tenantId}</strong>
                <small>{tenant.tenantId}</small>
              </span>
              <span className={tenant.ready ? "operator-status-ready" : "operator-status-created"}>
                {tenant.status}
              </span>
              <span className="operator-muted">{formatDateTime(tenant.syncedAt)}</span>
              <span className="operator-count-chip">{bindingCount(tenant)}</span>
              <span className="operator-access-chip">
                <ShieldCheck size={14} />
                {tenant.access.canWrite ? "可编辑" : "只读"}
              </span>
              <span className="operator-row-action">
                查看
                <ArrowUpRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
