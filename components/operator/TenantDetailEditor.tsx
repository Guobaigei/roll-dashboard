"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Braces,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RequestOverlay } from "@/components/ui/RequestOverlay";
import { StatusToast } from "@/components/ui/StatusToast";
import { readApiError } from "@/lib/http/read-api-error";
import type {
  BrandSyncRunSlice,
  RecruiterBinding,
  Tenant,
  TenantPatchInput,
} from "@/lib/reply-authority/types";

type TenantDetailResponse = {
  tenant: Tenant;
  canWrite: boolean;
  canSyncBrand: boolean;
};

type BrandSyncResponse = {
  run: BrandSyncRunSlice;
  tenant: Tenant;
  canWrite: boolean;
  canSyncBrand: boolean;
};

type EditableText = {
  id: string;
  value: string;
};

type EditableRecruiter = RecruiterBinding & {
  id: string;
};

type TenantForm = {
  baseManifestRevision: string;
  displayName: string;
  recruiters: EditableRecruiter[];
  brandAliasList: EditableText[];
  cityNames: EditableText[];
  preferredDefaultBrandName: string;
};

let nextLocalId = 0;

function createLocalId() {
  nextLocalId += 1;
  return `field-${nextLocalId}`;
}

function textItem(value = ""): EditableText {
  return {
    id: createLocalId(),
    value,
  };
}

function recruiterItem(binding?: RecruiterBinding): EditableRecruiter {
  return {
    id: createLocalId(),
    platform: "zhipin",
    username: binding?.username ?? "",
    accountId: binding?.accountId,
  };
}

function toEditableList(values: string[] | undefined) {
  return values && values.length > 0 ? values.map((value) => textItem(value)) : [textItem()];
}

function tenantToForm(tenant: Tenant): TenantForm {
  return {
    baseManifestRevision: tenant.manifestRevision ?? "",
    displayName: tenant.displayName ?? "",
    recruiters:
      tenant.bindings?.zhipinRecruiters && tenant.bindings.zhipinRecruiters.length > 0
        ? tenant.bindings.zhipinRecruiters.map((binding) => recruiterItem(binding))
        : [recruiterItem()],
    brandAliasList: toEditableList(tenant.syncParams?.brandAliasList),
    cityNames: toEditableList(tenant.syncParams?.cityNames),
    preferredDefaultBrandName: tenant.syncParams?.preferredDefaultBrandName ?? "",
  };
}

function cleanList(values: EditableText[]) {
  return values.map((item) => item.value.trim()).filter(Boolean);
}

function cleanRecruiters(recruiters: EditableRecruiter[]) {
  return recruiters
    .map((recruiter) => ({
      platform: "zhipin" as const,
      username: recruiter.username.trim(),
      accountId: recruiter.accountId?.trim() || undefined,
    }))
    .filter((recruiter) => recruiter.username.length > 0);
}

function formToPatchPayload(form: TenantForm): TenantPatchInput {
  return {
    baseManifestRevision: form.baseManifestRevision || undefined,
    displayName: form.displayName.trim() || undefined,
    bindings: {
      zhipinRecruiters: cleanRecruiters(form.recruiters),
    },
    syncParams: {
      brandAliasList: cleanList(form.brandAliasList),
      cityNames: cleanList(form.cityNames),
      preferredDefaultBrandName: form.preferredDefaultBrandName.trim() || undefined,
    },
  };
}

function formToJsonText(form: TenantForm) {
  return JSON.stringify(formToPatchPayload(form), null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertKnownKeys(value: Record<string, unknown>, allowed: string[], label: string) {
  const allowedKeys = new Set(allowed);
  const unknownKey = Object.keys(value).find((key) => !allowedKeys.has(key));
  if (unknownKey) {
    throw new Error(`${label} 不支持字段 ${unknownKey}`);
  }
}

function optionalRecord(value: unknown, label: string) {
  if (value === undefined || value === null) {
    return {};
  }

  if (!isRecord(value)) {
    throw new Error(`${label} 必须是对象`);
  }

  return value;
}

function optionalString(value: unknown, label: string) {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new Error(`${label} 必须是字符串`);
  }

  return value;
}

function optionalStringValue(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`${label} 必须是字符串`);
  }

  return value;
}

function stringList(value: unknown, label: string) {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error(`${label} 必须是字符串数组`);
  }

  return value.map((item, index) => {
    if (typeof item !== "string") {
      throw new Error(`${label}[${index}] 必须是字符串`);
    }

    return item;
  });
}

type JsonParseResult =
  | {
      form: TenantForm;
      error: null;
    }
  | {
      form: null;
      error: string;
    };

function jsonTextToForm(value: string): JsonParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return {
      form: null,
      error: "JSON 格式无效",
    };
  }

  try {
    if (!isRecord(parsed)) {
      throw new Error("JSON 根节点必须是对象");
    }

    assertKnownKeys(
      parsed,
      ["baseManifestRevision", "displayName", "bindings", "syncParams"],
      "配置",
    );

    const bindings = optionalRecord(parsed.bindings, "bindings");
    assertKnownKeys(bindings, ["zhipinRecruiters"], "bindings");

    const syncParams = optionalRecord(parsed.syncParams, "syncParams");
    assertKnownKeys(
      syncParams,
      ["brandAliasList", "cityNames", "preferredDefaultBrandName"],
      "syncParams",
    );

    const recruiterValues = bindings.zhipinRecruiters;
    if (recruiterValues !== undefined && !Array.isArray(recruiterValues)) {
      throw new Error("bindings.zhipinRecruiters 必须是数组");
    }

    const recruiters = (recruiterValues ?? []).map((item, index) => {
      if (!isRecord(item)) {
        throw new Error(`bindings.zhipinRecruiters[${index}] 必须是对象`);
      }

      assertKnownKeys(
        item,
        ["platform", "username", "accountId"],
        `bindings.zhipinRecruiters[${index}]`,
      );

      const platform = optionalString(
        item.platform,
        `bindings.zhipinRecruiters[${index}].platform`,
      );
      if (platform && platform !== "zhipin") {
        throw new Error(`bindings.zhipinRecruiters[${index}].platform 只支持 zhipin`);
      }

      return recruiterItem({
        platform: "zhipin",
        username: optionalString(item.username, `bindings.zhipinRecruiters[${index}].username`),
        accountId: optionalStringValue(
          item.accountId,
          `bindings.zhipinRecruiters[${index}].accountId`,
        ),
      });
    });

    return {
      form: {
        baseManifestRevision: optionalString(parsed.baseManifestRevision, "baseManifestRevision"),
        displayName: optionalString(parsed.displayName, "displayName"),
        recruiters: recruiters.length > 0 ? recruiters : [recruiterItem()],
        brandAliasList: toEditableList(
          stringList(syncParams.brandAliasList, "syncParams.brandAliasList"),
        ),
        cityNames: toEditableList(stringList(syncParams.cityNames, "syncParams.cityNames")),
        preferredDefaultBrandName: optionalString(
          syncParams.preferredDefaultBrandName,
          "syncParams.preferredDefaultBrandName",
        ),
      },
      error: null,
    };
  } catch (error) {
    return {
      form: null,
      error: error instanceof Error ? error.message : "JSON 内容无效",
    };
  }
}

const tenantDetailRequests = new Map<string, Promise<TenantDetailResponse>>();

function fetchTenantDetailOnce(tenantId: string) {
  const current = tenantDetailRequests.get(tenantId);
  if (current) {
    return current;
  }

  const request = fetch(`/api/operator/tenants/${encodeURIComponent(tenantId)}`, {
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      return (await response.json()) as TenantDetailResponse;
    })
    .finally(() => {
      tenantDetailRequests.delete(tenantId);
    });

  tenantDetailRequests.set(tenantId, request);
  return request;
}

export function TenantDetailEditor({ tenantId }: { tenantId: string }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [canWrite, setCanWrite] = useState(false);
  const [canSyncBrand, setCanSyncBrand] = useState(false);
  const [form, setForm] = useState<TenantForm | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [lastSavedJsonText, setLastSavedJsonText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingBrand, setSyncingBrand] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const title = useMemo(
    () => tenant?.displayName || tenant?.tenantId || tenantId,
    [tenant, tenantId],
  );
  const currentFormJsonText = form ? formToJsonText(form) : "";
  const hasUnsavedChanges = Boolean(jsonError) || currentFormJsonText !== lastSavedJsonText;

  useEffect(() => {
    let cancelled = false;

    fetchTenantDetailOnce(tenantId)
      .then((body) => {
        if (!cancelled) {
          const nextForm = tenantToForm(body.tenant);
          setTenant(body.tenant);
          setCanWrite(body.canWrite);
          setCanSyncBrand(Boolean(body.canSyncBrand));
          setForm(nextForm);
          const nextJsonText = formToJsonText(nextForm);
          setJsonText(nextJsonText);
          setLastSavedJsonText(nextJsonText);
          setJsonError(null);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "租户详情请求失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 2600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  function applyForm(nextForm: TenantForm) {
    setForm(nextForm);
    setJsonText(formToJsonText(nextForm));
    setJsonError(null);
  }

  function updateListField(field: "brandAliasList" | "cityNames", index: number, value: string) {
    if (!form) return;

    const next = [...form[field]];
    next[index] = { ...next[index], value };
    applyForm({ ...form, [field]: next });
  }

  function addListField(field: "brandAliasList" | "cityNames") {
    if (!form) return;

    applyForm({ ...form, [field]: [...form[field], textItem()] });
  }

  function removeListField(field: "brandAliasList" | "cityNames", index: number) {
    if (!form) return;

    const next = form[field].filter((_, itemIndex) => itemIndex !== index);
    applyForm({ ...form, [field]: next.length > 0 ? next : [textItem()] });
  }

  function updateRecruiter(index: number, field: "username" | "accountId", value: string) {
    if (!form) return;

    const recruiters = form.recruiters.map((recruiter, itemIndex) =>
      itemIndex === index ? { ...recruiter, [field]: value } : recruiter,
    );
    applyForm({ ...form, recruiters });
  }

  function addRecruiter() {
    if (!form) return;

    applyForm({ ...form, recruiters: [...form.recruiters, recruiterItem()] });
  }

  function removeRecruiter(index: number) {
    if (!form) return;

    const recruiters = form.recruiters.filter((_, itemIndex) => itemIndex !== index);
    applyForm({
      ...form,
      recruiters: recruiters.length > 0 ? recruiters : [recruiterItem()],
    });
  }

  function updateJsonText(value: string) {
    setJsonText(value);
    const parsed = jsonTextToForm(value);
    setJsonError(parsed.error);

    if (parsed.form) {
      setForm(parsed.form);
    }
  }

  function formatJsonText() {
    if (!form || jsonError) {
      return;
    }

    setJsonText(formToJsonText(form));
  }

  async function saveTenant() {
    if (!form || saving || syncingBrand || jsonError) {
      return;
    }

    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/operator/tenants/${encodeURIComponent(tenantId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPatchPayload(form)),
      });

      if (!response.ok) {
        setError(await readApiError(response));
        setSaving(false);
        return;
      }

      const body = (await response.json()) as TenantDetailResponse;
      const nextForm = tenantToForm(body.tenant);
      setTenant(body.tenant);
      setCanWrite(body.canWrite);
      setCanSyncBrand(Boolean(body.canSyncBrand));
      setForm(nextForm);
      const nextJsonText = formToJsonText(nextForm);
      setJsonText(nextJsonText);
      setLastSavedJsonText(nextJsonText);
      setJsonError(null);
      setNotice("租户配置已保存");
      setSaving(false);
    } catch {
      setError("租户配置保存失败，请稍后重试");
      setSaving(false);
    }
  }

  async function syncBrandConfig() {
    if (!form || saving || syncingBrand || hasUnsavedChanges) {
      return;
    }

    setError(null);
    setNotice(null);
    setSyncingBrand(true);

    try {
      const response = await fetch(
        `/api/operator/tenants/${encodeURIComponent(tenantId)}/brand-sync`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        setError(await readApiError(response));
        setSyncingBrand(false);
        return;
      }

      const body = (await response.json()) as BrandSyncResponse;
      const nextForm = tenantToForm(body.tenant);
      const result = body.run.tenantResult;
      setTenant(body.tenant);
      setCanWrite(body.canWrite);
      setCanSyncBrand(body.canSyncBrand);
      setForm(nextForm);
      const nextJsonText = formToJsonText(nextForm);
      setJsonText(nextJsonText);
      setLastSavedJsonText(nextJsonText);
      setJsonError(null);
      setNotice(
        `品牌/门店数据已同步：品牌 ${result.brands ?? 0}，门店 ${result.stores ?? 0}，职位 ${
          result.positions ?? 0
        }`,
      );
      setSyncingBrand(false);
    } catch {
      setError("品牌数据同步失败，请稍后重试");
      setSyncingBrand(false);
    }
  }

  if (loading) {
    return (
      <section className="operator-shell">
        <div className="operator-empty-state">
          <Loader2 className="spin" size={18} />
          <span>正在通过 /api/operator/tenants/{tenantId} 读取租户详情</span>
        </div>
      </section>
    );
  }

  if (error && !tenant) {
    return (
      <section className="operator-shell">
        <Link className="operator-back-link" href="/operator">
          <ArrowLeft size={15} />
          返回租户列表
        </Link>
        <div className="operator-alert operator-alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      </section>
    );
  }

  if (!tenant || !form) {
    return null;
  }

  return (
    <section
      aria-busy={saving || syncingBrand}
      className="operator-shell"
      aria-labelledby="tenant-detail-title"
    >
      <RequestOverlay
        active={saving || syncingBrand}
        label={saving ? "正在保存租户配置" : "正在同步数据"}
      />
      <StatusToast active={Boolean(notice)} message={notice ?? ""} />
      <Link className="operator-back-link" href="/operator">
        <ArrowLeft size={15} />
        返回租户列表
      </Link>

      <div className="operator-hero operator-hero-row">
        <div>
          <p className="eyebrow">TENANT_CONFIG</p>
          <h1 id="tenant-detail-title">{title}</h1>
          <p>{tenant.tenantId}</p>
        </div>
        <div
          className={canWrite ? "operator-access-card writable" : "operator-access-card readonly"}
        >
          <ShieldCheck size={18} />
          <span>{canWrite ? "可编辑" : "只读"}</span>
        </div>
      </div>

      {!canWrite ? (
        <div className="operator-alert">
          <AlertTriangle size={16} />
          <span>当前客户端令牌缺少 tenant-config:write 权限，配置仅可查看。</span>
        </div>
      ) : null}
      {error ? (
        <div className="operator-alert operator-alert-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="operator-save-bar">
        <div className="operator-save-meta">
          <span>配置版本</span>
          <code>{form.baseManifestRevision || "UNAVAILABLE"}</code>
        </div>
        <div className="operator-save-actions">
          <button
            className="operator-secondary-btn operator-sync-btn"
            disabled={!canSyncBrand || saving || syncingBrand || hasUnsavedChanges}
            onClick={syncBrandConfig}
            title={
              hasUnsavedChanges
                ? "请先保存配置后再同步数据"
                : canSyncBrand
                  ? "同步数据"
                  : "当前客户端令牌缺少 brand-sync:write 权限"
            }
            type="button"
          >
            {syncingBrand ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
            同步数据
          </button>
          <button
            className="auth-submit-btn"
            disabled={!canWrite || saving || syncingBrand || Boolean(jsonError)}
            onClick={saveTenant}
            type="button"
          >
            {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
            保存配置
          </button>
        </div>
      </div>

      <div className={jsonOpen ? "operator-json-dock is-open" : "operator-json-dock"}>
        {jsonOpen ? (
          <article
            className={
              jsonError
                ? "operator-panel operator-json-panel operator-json-panel-error"
                : "operator-panel operator-json-panel"
            }
          >
            <div className="operator-json-header">
              <div className="operator-panel-title">
                <Braces size={18} />
                配置 JSON
              </div>
              <div className="operator-json-header-actions">
                <span className={jsonError ? "operator-json-status error" : "operator-json-status"}>
                  {jsonError ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                  {jsonError ? "JSON 有误" : "已同步"}
                </span>
                <button
                  aria-label="收起配置 JSON"
                  className="operator-json-close-btn"
                  onClick={() => setJsonOpen(false)}
                  type="button"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
            <textarea
              aria-invalid={Boolean(jsonError)}
              className="operator-json-textarea"
              onChange={(event) => updateJsonText(event.target.value)}
              readOnly={!canWrite || saving}
              spellCheck={false}
              value={jsonText}
            />
            <div className="operator-json-footer">
              <span className={jsonError ? "operator-json-message error" : "operator-json-message"}>
                {jsonError ?? "PATCH_PAYLOAD"}
              </span>
              <button
                className="operator-secondary-btn operator-json-format-btn"
                disabled={!canWrite || saving || Boolean(jsonError)}
                onClick={formatJsonText}
                type="button"
              >
                <Braces size={15} />
                格式化
              </button>
            </div>
          </article>
        ) : null}
        <button
          aria-expanded={jsonOpen}
          className={jsonError ? "operator-json-toggle has-error" : "operator-json-toggle"}
          onClick={() => setJsonOpen((current) => !current)}
          type="button"
        >
          <Braces size={17} />
          <span>配置 JSON</span>
          <small>{jsonError ? "JSON 有误" : "已同步"}</small>
        </button>
      </div>

      <div className="operator-detail-grid">
        <article className="operator-panel operator-form operator-detail-panel">
          <div className="operator-panel-title">基础配置</div>
          <label>
            <span>显示名</span>
            <input
              disabled={!canWrite || saving}
              onChange={(event) => applyForm({ ...form, displayName: event.target.value })}
              value={form.displayName}
            />
          </label>
          <label>
            <span>默认品牌</span>
            <input
              disabled={!canWrite || saving}
              onChange={(event) =>
                applyForm({ ...form, preferredDefaultBrandName: event.target.value })
              }
              value={form.preferredDefaultBrandName}
            />
          </label>
        </article>

        <article className="operator-panel operator-form operator-detail-panel">
          <div className="operator-panel-title">Boss 绑定</div>
          <div className="operator-list-editor">
            {form.recruiters.map((recruiter, index) => (
              <div className="operator-binding-row" key={recruiter.id}>
                <input disabled value="zhipin" />
                <input
                  disabled={!canWrite || saving}
                  onChange={(event) => updateRecruiter(index, "username", event.target.value)}
                  placeholder="Boss 用户名"
                  value={recruiter.username}
                />
                <input
                  disabled={!canWrite || saving}
                  onChange={(event) => updateRecruiter(index, "accountId", event.target.value)}
                  placeholder="accountId 可选"
                  value={recruiter.accountId ?? ""}
                />
                <button
                  className="operator-icon-btn"
                  disabled={!canWrite || saving}
                  onClick={() => removeRecruiter(index)}
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            className="operator-secondary-btn"
            disabled={!canWrite || saving}
            onClick={addRecruiter}
            type="button"
          >
            <Plus size={15} />
            添加 Boss 绑定
          </button>
        </article>

        <ListEditor
          disabled={!canWrite || saving}
          label="品牌别名"
          onAdd={() => addListField("brandAliasList")}
          onChange={(index, value) => updateListField("brandAliasList", index, value)}
          onRemove={(index) => removeListField("brandAliasList", index)}
          placeholder="例如：成都你六姐"
          values={form.brandAliasList}
        />

        <ListEditor
          disabled={!canWrite || saving}
          label="城市"
          onAdd={() => addListField("cityNames")}
          onChange={(index, value) => updateListField("cityNames", index, value)}
          onRemove={(index) => removeListField("cityNames", index)}
          placeholder="例如：成都市"
          values={form.cityNames}
        />
      </div>
    </section>
  );
}

function ListEditor({
  disabled,
  label,
  onAdd,
  onChange,
  onRemove,
  placeholder,
  values,
}: {
  disabled: boolean;
  label: string;
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  values: EditableText[];
}) {
  const filledCount = values.filter((item) => item.value.trim()).length;

  return (
    <article className="operator-panel operator-form operator-list-panel">
      <div className="operator-panel-title operator-panel-title-row">
        <span>{label}</span>
        <small>{filledCount}</small>
      </div>
      <div className="operator-list-editor">
        {values.map((item, index) => (
          <div className="operator-list-row" key={item.id}>
            <input
              disabled={disabled}
              onChange={(event) => onChange(index, event.target.value)}
              placeholder={placeholder}
              value={item.value}
            />
            <button
              className="operator-icon-btn"
              disabled={disabled}
              onClick={() => onRemove(index)}
              type="button"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <button className="operator-secondary-btn" disabled={disabled} onClick={onAdd} type="button">
        <Plus size={15} />
        添加{label}
      </button>
    </article>
  );
}
