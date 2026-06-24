"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Megaphone,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { RequestOverlay } from "@/components/ui/RequestOverlay";
import { StatusToast } from "@/components/ui/StatusToast";
import { readApiError } from "@/lib/http/read-api-error";
import type { JsonObject, ReplyPolicyResponse, Tenant } from "@/lib/reply-authority/types";

type ReplyPolicyEditorResponse = ReplyPolicyResponse & {
  tenant: Tenant;
  canWrite: boolean;
};

type JsonPathSegment = string | number;
type JsonPath = readonly JsonPathSegment[];
type PolicyTabId = "persona" | "stages" | "industry" | "rules" | "guards";

type SelectOption = {
  label: string;
  value: string;
};

type HardConstraintRule = {
  id: string;
  rule: string;
  severity: string;
};

const DEFAULT_SAVE_REASON = "操作台策略配置更新";
const replyPolicyRequests = new Map<string, Promise<ReplyPolicyEditorResponse>>();
let nextPolicyRowKey = 0;

const POLICY_TABS = [
  { id: "persona", label: "人格", icon: UserRound },
  { id: "stages", label: "阶段目标", icon: Target },
  { id: "industry", label: "行业语境", icon: Megaphone },
  { id: "rules", label: "红线", icon: ShieldCheck },
  { id: "guards", label: "输出保护", icon: SlidersHorizontal },
] as const;

const STAGE_DEFS = [
  { id: "trust_building", label: "建立信任" },
  { id: "private_channel", label: "私域转化" },
  { id: "qualify_candidate", label: "资质确认" },
  { id: "job_consultation", label: "岗位咨询" },
  { id: "interview_scheduling", label: "面试邀约" },
  { id: "onboard_followup", label: "到岗跟进" },
] as const;

type StageId = (typeof STAGE_DEFS)[number]["id"];

const PERSONA_TEXT_FIELDS = [
  { label: "语气", path: ["persona", "tone"] },
  { label: "亲和度", path: ["persona", "warmth"] },
  { label: "幽默度", path: ["persona", "humor"] },
  { label: "提问风格", path: ["persona", "questionStyle"] },
  { label: "共情策略", path: ["persona", "empathyStrategy"] },
  { label: "称呼方式", path: ["persona", "addressStyle"] },
  { label: "职业身份", path: ["persona", "professionalIdentity"] },
  { label: "公司背景", path: ["persona", "companyBackground"] },
] as const;

const INDUSTRY_TEXT_FIELDS = [
  { label: "名称", path: "name", multiline: false },
  { label: "行业背景", path: "industryBackground", multiline: true },
] as const;

const LENGTH_OPTIONS = [
  { value: "short", label: "short / 简短" },
  { value: "medium", label: "medium / 适中" },
  { value: "long", label: "long / 详细" },
];

const SEVERITY_OPTIONS = [
  { value: "high", label: "high / 高" },
  { value: "medium", label: "medium / 中" },
  { value: "low", label: "low / 低" },
];

const FACT_GATE_MODE_OPTIONS = [
  { value: "strict", label: "strict / 严格" },
  { value: "balanced", label: "balanced / 平衡" },
  { value: "open", label: "open / 开放" },
];

const FALLBACK_OPTIONS = [
  { value: "generic_answer", label: "generic_answer / 泛化回答" },
  { value: "ask_followup", label: "ask_followup / 追问补充" },
  { value: "handoff", label: "handoff / 转人工" },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "high / 高" },
  { value: "medium", label: "medium / 中" },
  { value: "low", label: "low / 低" },
];

function fetchReplyPolicyOnce(tenantId: string) {
  const current = replyPolicyRequests.get(tenantId);
  if (current) {
    return current;
  }

  const request = fetch(`/api/operator/tenants/${encodeURIComponent(tenantId)}/reply-policy`, {
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await readApiError(response, "策略配置请求失败"));
      }

      return (await response.json()) as ReplyPolicyEditorResponse;
    })
    .finally(() => {
      replyPolicyRequests.delete(tenantId);
    });

  replyPolicyRequests.set(tenantId, request);
  return request;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneJsonObject(value: JsonObject): JsonObject {
  return JSON.parse(JSON.stringify(value)) as JsonObject;
}

function valuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getPathValue(source: unknown, path: JsonPath): unknown {
  let cursor = source;

  for (const segment of path) {
    if (Array.isArray(cursor) && typeof segment === "number") {
      cursor = cursor[segment];
      continue;
    }

    if (isJsonObject(cursor) && typeof segment === "string") {
      cursor = cursor[segment];
      continue;
    }

    return undefined;
  }

  return cursor;
}

function assignPathValue(container: unknown, segment: JsonPathSegment, value: unknown) {
  if (Array.isArray(container) && typeof segment === "number") {
    container[segment] = value;
    return true;
  }

  if (isJsonObject(container) && typeof segment === "string") {
    container[segment] = value;
    return true;
  }

  return false;
}

function readChildValue(container: unknown, segment: JsonPathSegment) {
  if (Array.isArray(container) && typeof segment === "number") {
    return container[segment];
  }

  if (isJsonObject(container) && typeof segment === "string") {
    return container[segment];
  }

  return undefined;
}

function setPathValue(source: JsonObject, path: JsonPath, value: unknown): JsonObject {
  const clone = cloneJsonObject(source);
  let cursor: unknown = clone;

  for (let index = 0; index < path.length; index += 1) {
    const segment = path[index];
    const isLast = index === path.length - 1;

    if (isLast) {
      assignPathValue(cursor, segment, value);
      return clone;
    }

    let nextValue = readChildValue(cursor, segment);
    if (!isJsonObject(nextValue) && !Array.isArray(nextValue)) {
      nextValue = typeof path[index + 1] === "number" ? [] : {};
      assignPathValue(cursor, segment, nextValue);
    }

    cursor = nextValue;
  }

  return clone;
}

function buildPolicyPatch(base: JsonObject, draft: JsonObject, path = "") {
  const patch: JsonObject = {};
  const removedPaths: string[] = [];

  for (const key of Object.keys(base)) {
    if (!(key in draft)) {
      removedPaths.push(path ? `${path}.${key}` : key);
    }
  }

  for (const [key, draftValue] of Object.entries(draft)) {
    const baseValue = base[key];
    const nextPath = path ? `${path}.${key}` : key;

    if (isJsonObject(baseValue) && isJsonObject(draftValue)) {
      const nested = buildPolicyPatch(baseValue, draftValue, nextPath);
      removedPaths.push(...nested.removedPaths);

      if (Object.keys(nested.patch).length > 0) {
        patch[key] = nested.patch;
      }
      continue;
    }

    if (!valuesEqual(baseValue, draftValue)) {
      patch[key] = draftValue;
    }
  }

  return {
    patch,
    removedPaths,
  };
}

function hasPatchChanges(patch: JsonObject) {
  return Object.keys(patch).length > 0;
}

function getStringAt(policy: JsonObject, path: JsonPath) {
  const value = getPathValue(policy, path);
  if (typeof value === "string") {
    return value;
  }

  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function getBooleanAt(policy: JsonObject, path: JsonPath, fallback = false) {
  const value = getPathValue(policy, path);
  return typeof value === "boolean" ? value : fallback;
}

function getNumberAt(policy: JsonObject, path: JsonPath, fallback = 0) {
  const value = getPathValue(policy, path);
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getStringArrayAt(policy: JsonObject, path: JsonPath) {
  const value = getPathValue(policy, path);
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => (typeof item === "string" ? item : String(item)));
}

function getRecordAt(policy: JsonObject, path: JsonPath) {
  const value = getPathValue(policy, path);
  return isJsonObject(value) ? value : {};
}

function policySourceLabel(source: string) {
  if (source === "tenant-file") return "租户本地策略";
  if (source === "global-file") return "全局策略";
  if (source === "default") return "默认策略";

  return source;
}

function tenantDisplayName(tenant: Tenant | null, tenantId: string) {
  return tenant?.displayName || tenant?.tenantId || tenantId;
}

function getIndustryVoiceIds(policy: JsonObject) {
  return Object.keys(getRecordAt(policy, ["industryVoices"]));
}

function getDefaultVoiceId(policy: JsonObject) {
  const configured = getStringAt(policy, ["defaultIndustryVoiceId"]);
  const voiceIds = getIndustryVoiceIds(policy);

  if (configured && voiceIds.includes(configured)) {
    return configured;
  }

  return voiceIds[0] ?? "default";
}

function createIndustryVoice(voiceId: string): JsonObject {
  return {
    name: voiceId,
    industryBackground: "",
    jargon: [],
    styleKeywords: [],
    tabooPhrases: [],
    guidance: [],
  };
}

function getRules(policy: JsonObject) {
  const value = getPathValue(policy, ["hardConstraints", "rules"]);
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index): HardConstraintRule => {
    if (!isJsonObject(item)) {
      return {
        id: `rule-${index + 1}`,
        rule: String(item ?? ""),
        severity: "high",
      };
    }

    return {
      id: typeof item.id === "string" ? item.id : `rule-${index + 1}`,
      rule: typeof item.rule === "string" ? item.rule : "",
      severity: typeof item.severity === "string" ? item.severity : "high",
    };
  });
}

function nextRuleId(rules: HardConstraintRule[]) {
  const existingIds = new Set(rules.map((rule) => rule.id));
  let index = rules.length + 1;
  let candidate = `rule-${index}`;

  while (existingIds.has(candidate)) {
    index += 1;
    candidate = `rule-${index}`;
  }

  return candidate;
}

function createPolicyRowKey(prefix: string) {
  nextPolicyRowKey += 1;
  return `${prefix}-${nextPolicyRowKey}`;
}

function createPolicyRowKeys(prefix: string, count: number) {
  return Array.from({ length: count }, () => createPolicyRowKey(prefix));
}

function syncPolicyRowKeys(keys: string[], count: number, prefix: string) {
  if (keys.length === count) {
    return keys;
  }

  if (keys.length > count) {
    return keys.slice(0, count);
  }

  return [...keys, ...createPolicyRowKeys(prefix, count - keys.length)];
}

function toggleStage(openStageIds: Set<StageId>, stageId: StageId) {
  const next = new Set(openStageIds);
  if (next.has(stageId)) {
    next.delete(stageId);
  } else {
    next.add(stageId);
  }

  return next;
}

export function TenantReplyPolicyEditor({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<ReplyPolicyEditorResponse | null>(null);
  const [draftPolicy, setDraftPolicy] = useState<JsonObject | null>(null);
  const [activeTab, setActiveTab] = useState<PolicyTabId>("persona");
  const [openStageIds, setOpenStageIds] = useState<Set<StageId>>(() => new Set([STAGE_DEFS[0].id]));
  const [selectedVoiceId, setSelectedVoiceId] = useState("default");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const draftPatch = useMemo(() => {
    if (!data || !draftPolicy) {
      return null;
    }

    return buildPolicyPatch(data.policy, draftPolicy);
  }, [data, draftPolicy]);
  const title = tenantDisplayName(data?.tenant ?? null, tenantId);
  const hasDraftChanges = Boolean(draftPatch && hasPatchChanges(draftPatch.patch));
  const draftError =
    draftPatch && draftPatch.removedPaths.length > 0
      ? `当前 PATCH 接口不支持删除字段：${draftPatch.removedPaths.slice(0, 3).join("、")}`
      : null;
  const canSave = Boolean(data?.canWrite) && hasDraftChanges && !draftError && !saving;
  const draftStatusText = draftError ?? (hasDraftChanges ? "有未保存修改" : "暂无变更");
  const draftStatusClass = draftError ? "operator-json-message error" : "operator-json-message";

  useEffect(() => {
    let cancelled = false;

    fetchReplyPolicyOnce(tenantId)
      .then((body) => {
        if (!cancelled) {
          setData(body);
          setDraftPolicy(cloneJsonObject(body.policy));
          setSelectedVoiceId(getDefaultVoiceId(body.policy));
          setError(null);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "策略配置请求失败");
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

  useEffect(() => {
    if (!draftPolicy) {
      return;
    }

    const voiceIds = getIndustryVoiceIds(draftPolicy);
    if (voiceIds.length > 0 && !voiceIds.includes(selectedVoiceId)) {
      setSelectedVoiceId(getDefaultVoiceId(draftPolicy));
    }
  }, [draftPolicy, selectedVoiceId]);

  function updateDraftValue(path: JsonPath, value: unknown) {
    setDraftPolicy((current) => (current ? setPathValue(current, path, value) : current));
  }

  function updateDraftPolicy(updater: (policy: JsonObject) => JsonObject) {
    setDraftPolicy((current) => (current ? updater(current) : current));
  }

  function addIndustryVoice(voiceId: string) {
    const normalized = voiceId.trim();
    if (!normalized) {
      return;
    }

    updateDraftPolicy((current) => {
      if (getIndustryVoiceIds(current).includes(normalized)) {
        return current;
      }

      return setPathValue(current, ["industryVoices", normalized], createIndustryVoice(normalized));
    });
    setSelectedVoiceId(normalized);
  }

  async function savePolicy() {
    if (!data || !draftPatch || !canSave) {
      return;
    }

    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      const response = await fetch(
        `/api/operator/tenants/${encodeURIComponent(tenantId)}/reply-policy`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            basePolicyVersion: data.policyVersion,
            reason: DEFAULT_SAVE_REASON,
            patch: draftPatch.patch,
          }),
        },
      );

      if (!response.ok) {
        setError(await readApiError(response));
        setSaving(false);
        return;
      }

      const body = (await response.json()) as ReplyPolicyEditorResponse;
      setData(body);
      setDraftPolicy(cloneJsonObject(body.policy));
      setSelectedVoiceId(getDefaultVoiceId(body.policy));
      setNotice("策略配置已保存");
      setSaving(false);
    } catch {
      setError("策略配置保存失败，请稍后重试");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="operator-shell">
        <div className="operator-empty-state">
          <Loader2 className="spin" size={18} />
          <span>正在通过 /api/operator/tenants/{tenantId}/reply-policy 读取策略配置</span>
        </div>
      </section>
    );
  }

  if (error && !data) {
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

  if (!data || !draftPolicy) {
    return null;
  }

  const fieldsDisabled = !data.canWrite || saving;

  return (
    <section aria-busy={saving} aria-labelledby="reply-policy-title" className="operator-shell">
      <RequestOverlay active={saving} label="正在保存策略" />
      <StatusToast active={Boolean(notice)} message={notice ?? ""} />

      <Link className="operator-back-link" href="/operator">
        <ArrowLeft size={15} />
        返回租户列表
      </Link>

      <div className="operator-hero operator-hero-row">
        <div>
          <p className="eyebrow">REPLY_POLICY</p>
          <h1 id="reply-policy-title">策略配置</h1>
          <p>
            {title}
            <span className="operator-inline-divider">/</span>
            {data.tenant.tenantId}
          </p>
        </div>
        <div
          className={
            data.canWrite ? "operator-access-card writable" : "operator-access-card readonly"
          }
        >
          <ShieldCheck size={18} />
          <span>{data.canWrite ? "可保存" : "只读"}</span>
        </div>
      </div>

      {error ? (
        <div className="operator-alert operator-alert-error">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {!data.canWrite ? (
        <div className="operator-alert">
          <AlertTriangle size={16} />
          <span>当前客户端令牌缺少 reply-policy:write 权限，策略仅可查看。</span>
        </div>
      ) : null}

      <div className="operator-save-bar">
        <div className="operator-save-meta">
          <span>{policySourceLabel(data.source)}</span>
          <code>{data.policyVersion}</code>
        </div>
        <div className="operator-save-actions">
          <span className={draftStatusClass}>{draftStatusText}</span>
          <button
            className="auth-submit-btn"
            disabled={!canSave}
            onClick={savePolicy}
            type="button"
          >
            {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
            保存策略
          </button>
        </div>
      </div>

      <article className="operator-panel operator-policy-panel">
        <div className="operator-policy-editor-head">
          <div className="operator-panel-title">
            <SlidersHorizontal size={18} />
            策略表单
          </div>
        </div>

        <PolicyTabNav activeTab={activeTab} onSelect={setActiveTab} />

        <div className="operator-policy-form-shell">
          {activeTab === "persona" ? (
            <PersonaPolicySection
              disabled={fieldsDisabled}
              draftPolicy={draftPolicy}
              onChange={updateDraftValue}
            />
          ) : null}
          {activeTab === "stages" ? (
            <StagePolicySection
              disabled={fieldsDisabled}
              draftPolicy={draftPolicy}
              onChange={updateDraftValue}
              onOpenStageChange={(stageId) =>
                setOpenStageIds((current) => toggleStage(current, stageId))
              }
              openStageIds={openStageIds}
            />
          ) : null}
          {activeTab === "industry" ? (
            <IndustryPolicySection
              disabled={fieldsDisabled}
              draftPolicy={draftPolicy}
              onAddVoice={addIndustryVoice}
              onChange={updateDraftValue}
              onSelectedVoiceChange={setSelectedVoiceId}
              selectedVoiceId={selectedVoiceId}
            />
          ) : null}
          {activeTab === "rules" ? (
            <RulesPolicySection
              disabled={fieldsDisabled}
              draftPolicy={draftPolicy}
              onChange={updateDraftValue}
            />
          ) : null}
          {activeTab === "guards" ? (
            <OutputGuardsPolicySection
              disabled={fieldsDisabled}
              draftPolicy={draftPolicy}
              onChange={updateDraftValue}
            />
          ) : null}
        </div>
      </article>
    </section>
  );
}

function PolicyTabNav({
  activeTab,
  onSelect,
}: {
  activeTab: PolicyTabId;
  onSelect: (tab: PolicyTabId) => void;
}) {
  return (
    <div aria-label="策略配置分组" className="operator-policy-tabs" role="tablist">
      {POLICY_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;

        return (
          <button
            aria-selected={active}
            className={active ? "operator-policy-tab is-active" : "operator-policy-tab"}
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            role="tab"
            type="button"
          >
            <Icon size={17} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

type PolicySectionProps = {
  disabled: boolean;
  draftPolicy: JsonObject;
  onChange: (path: JsonPath, value: unknown) => void;
};

function PersonaPolicySection({ disabled, draftPolicy, onChange }: PolicySectionProps) {
  return (
    <div className="operator-policy-section">
      <SelectPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="回复长度"
        onChange={onChange}
        options={LENGTH_OPTIONS}
        path={["persona", "length"]}
      />
      {PERSONA_TEXT_FIELDS.map((field) => (
        <TextPolicyField
          disabled={disabled}
          draftPolicy={draftPolicy}
          key={field.label}
          label={field.label}
          multiline={
            field.path[1] === "companyBackground" ||
            field.path[1] === "empathyStrategy" ||
            field.path[1] === "questionStyle"
          }
          onChange={onChange}
          path={field.path}
        />
      ))}
    </div>
  );
}

function StagePolicySection({
  disabled,
  draftPolicy,
  onChange,
  onOpenStageChange,
  openStageIds,
}: PolicySectionProps & {
  onOpenStageChange: (stageId: StageId) => void;
  openStageIds: Set<StageId>;
}) {
  return (
    <div className="operator-policy-accordion">
      {STAGE_DEFS.map((stage) => {
        const open = openStageIds.has(stage.id);

        return (
          <section className="operator-policy-accordion-item" key={stage.id}>
            <button
              aria-expanded={open}
              className="operator-policy-accordion-trigger"
              onClick={() => onOpenStageChange(stage.id)}
              type="button"
            >
              <span>
                <code>{stage.id}</code>
                <strong>{stage.label}</strong>
              </span>
              <ChevronDown size={18} />
            </button>
            {open ? (
              <div className="operator-policy-accordion-body">
                <TextPolicyField
                  disabled={disabled}
                  draftPolicy={draftPolicy}
                  label="阶段定义"
                  multiline
                  onChange={onChange}
                  path={["stageGoals", stage.id, "description"]}
                />
                <TextPolicyField
                  disabled={disabled}
                  draftPolicy={draftPolicy}
                  label="主要目标"
                  multiline
                  onChange={onChange}
                  path={["stageGoals", stage.id, "primaryGoal"]}
                />
                <ArrayPolicyField
                  disabled={disabled}
                  draftPolicy={draftPolicy}
                  label="成功标准"
                  onChange={onChange}
                  path={["stageGoals", stage.id, "successCriteria"]}
                  placeholder="新增成功标准"
                />
                <TextPolicyField
                  disabled={disabled}
                  draftPolicy={draftPolicy}
                  label="推进策略 (CTA)"
                  multiline
                  onChange={onChange}
                  path={["stageGoals", stage.id, "ctaStrategy"]}
                />
                <ArrayPolicyField
                  disabled={disabled}
                  draftPolicy={draftPolicy}
                  label="禁止行为"
                  onChange={onChange}
                  path={["stageGoals", stage.id, "disallowedActions"]}
                  placeholder="新增禁止行为"
                />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function IndustryPolicySection({
  disabled,
  draftPolicy,
  onAddVoice,
  onChange,
  onSelectedVoiceChange,
  selectedVoiceId,
}: PolicySectionProps & {
  onAddVoice: (voiceId: string) => void;
  onSelectedVoiceChange: (voiceId: string) => void;
  selectedVoiceId: string;
}) {
  const [newVoiceId, setNewVoiceId] = useState("");
  const voiceOptions = getIndustryVoiceIds(draftPolicy).map((voiceId) => ({
    label: voiceId,
    value: voiceId,
  }));
  const activeVoiceId = voiceOptions.some((option) => option.value === selectedVoiceId)
    ? selectedVoiceId
    : (voiceOptions[0]?.value ?? "default");

  function addVoice() {
    const normalized = newVoiceId.trim();
    if (!normalized) {
      return;
    }

    onAddVoice(normalized);
    setNewVoiceId("");
  }

  return (
    <div className="operator-policy-section">
      <div className="operator-policy-voice-toolbar">
        <label>
          <span>当前语境 ID</span>
          <select
            className="operator-policy-input"
            onChange={(event) => onSelectedVoiceChange(event.currentTarget.value)}
            value={activeVoiceId}
          >
            {voiceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="operator-policy-add-inline">
          <input
            className="operator-policy-input"
            disabled={disabled}
            onChange={(event) => setNewVoiceId(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addVoice();
              }
            }}
            placeholder="voice_id"
            value={newVoiceId}
          />
          <button
            className="operator-secondary-btn"
            disabled={disabled || !newVoiceId.trim()}
            onClick={addVoice}
            type="button"
          >
            <Plus size={15} />
            新增语境
          </button>
        </div>
      </div>

      <SelectPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="默认语境"
        onChange={onChange}
        options={voiceOptions}
        path={["defaultIndustryVoiceId"]}
      />

      {INDUSTRY_TEXT_FIELDS.map((field) => (
        <TextPolicyField
          disabled={disabled}
          draftPolicy={draftPolicy}
          key={`${activeVoiceId}.${field.path}`}
          label={field.label}
          multiline={field.multiline}
          onChange={onChange}
          path={["industryVoices", activeVoiceId, field.path]}
        />
      ))}

      <ArrayPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="行业术语"
        onChange={onChange}
        path={["industryVoices", activeVoiceId, "jargon"]}
        placeholder="新增术语"
      />
      <ArrayPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="风格关键词"
        onChange={onChange}
        path={["industryVoices", activeVoiceId, "styleKeywords"]}
        placeholder="新增关键词"
      />
      <ArrayPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="禁忌用语"
        onChange={onChange}
        path={["industryVoices", activeVoiceId, "tabooPhrases"]}
        placeholder="新增禁忌用语"
      />
      <ArrayPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="引导原则"
        onChange={onChange}
        path={["industryVoices", activeVoiceId, "guidance"]}
        placeholder="新增原则"
      />
    </div>
  );
}

function RulesPolicySection({ disabled, draftPolicy, onChange }: PolicySectionProps) {
  return (
    <div className="operator-policy-section">
      <HardRulesField disabled={disabled} draftPolicy={draftPolicy} onChange={onChange} />

      <div className="operator-policy-section-divider" />

      <SelectPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="FactGate 模式"
        onChange={onChange}
        options={FACT_GATE_MODE_OPTIONS}
        path={["factGate", "mode"]}
      />
      <SelectPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="缺事实回退策略"
        onChange={onChange}
        options={FALLBACK_OPTIONS}
        path={["factGate", "fallbackBehavior"]}
      />
      <ArrayPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="可验证声明类型"
        onChange={onChange}
        path={["factGate", "verifiableClaimTypes"]}
        placeholder="新增类型"
      />
      <ArrayPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="缺事实时禁止内容"
        onChange={onChange}
        path={["factGate", "forbiddenWhenMissingFacts"]}
        placeholder="新增禁止内容"
      />

      <div className="operator-policy-section-divider" />

      <BooleanPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="启用年龄 Gate"
        onChange={onChange}
        path={["qualificationPolicy", "age", "enabled"]}
      />
      <BooleanPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="允许透露年龄区间"
        onChange={onChange}
        path={["qualificationPolicy", "age", "revealRange"]}
      />
      <TextPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="不匹配策略"
        multiline
        onChange={onChange}
        path={["qualificationPolicy", "age", "failStrategy"]}
      />
      <TextPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="信息不足策略"
        multiline
        onChange={onChange}
        path={["qualificationPolicy", "age", "unknownStrategy"]}
      />
      <TextPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="匹配通过策略"
        multiline
        onChange={onChange}
        path={["qualificationPolicy", "age", "passStrategy"]}
      />
      <BooleanPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="不匹配时允许转推荐"
        onChange={onChange}
        path={["qualificationPolicy", "age", "allowRedirect"]}
      />
      <SelectPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="转推荐优先级"
        onChange={onChange}
        options={PRIORITY_OPTIONS}
        path={["qualificationPolicy", "age", "redirectPriority"]}
      />
    </div>
  );
}

function OutputGuardsPolicySection({ disabled, draftPolicy, onChange }: PolicySectionProps) {
  return (
    <div className="operator-policy-section">
      <NumberPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="最少模式最大提问数"
        onChange={onChange}
        path={["outputGuards", "maxQuestionsByMode", "minimal"]}
      />
      <NumberPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="聚焦模式最大提问数"
        onChange={onChange}
        path={["outputGuards", "maxQuestionsByMode", "focused"]}
      />
      <ArrayPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="阻断审计短语"
        onChange={onChange}
        path={["outputGuards", "blockedAuditPhrases"]}
        placeholder="新增短语"
      />
      <BooleanPolicyField
        disabled={disabled}
        draftPolicy={draftPolicy}
        label="首轮阻断具体事实"
        onChange={onChange}
        path={["outputGuards", "blockFirstTurnSpecificFacts"]}
      />
    </div>
  );
}

function TextPolicyField({
  disabled,
  draftPolicy,
  label,
  multiline = false,
  onChange,
  path,
}: PolicySectionProps & {
  label: string;
  multiline?: boolean;
  path: JsonPath;
}) {
  const draftValue = getStringAt(draftPolicy, path);

  return (
    <PolicyField label={label}>
      {multiline ? (
        <textarea
          aria-label={label}
          className="operator-policy-input"
          disabled={disabled}
          onChange={(event) => onChange(path, event.currentTarget.value)}
          rows={3}
          value={draftValue}
        />
      ) : (
        <input
          aria-label={label}
          className="operator-policy-input"
          disabled={disabled}
          onChange={(event) => onChange(path, event.currentTarget.value)}
          value={draftValue}
        />
      )}
    </PolicyField>
  );
}

function SelectPolicyField({
  disabled,
  draftPolicy,
  label,
  onChange,
  options,
  path,
}: PolicySectionProps & {
  label: string;
  options: SelectOption[];
  path: JsonPath;
}) {
  const draftValue = getStringAt(draftPolicy, path);

  return (
    <PolicyField label={label}>
      <select
        aria-label={label}
        className="operator-policy-input"
        disabled={disabled}
        onChange={(event) => onChange(path, event.currentTarget.value)}
        value={draftValue}
      >
        {draftValue ? null : <option value="">未设置</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </PolicyField>
  );
}

function BooleanPolicyField({
  disabled,
  draftPolicy,
  label,
  onChange,
  path,
}: PolicySectionProps & {
  label: string;
  path: JsonPath;
}) {
  const draftValue = getBooleanAt(draftPolicy, path);

  return (
    <PolicyField label={label}>
      <select
        aria-label={label}
        className="operator-policy-input"
        disabled={disabled}
        onChange={(event) => onChange(path, event.currentTarget.value === "true")}
        value={String(draftValue)}
      >
        <option value="true">启用</option>
        <option value="false">停用</option>
      </select>
    </PolicyField>
  );
}

function NumberPolicyField({
  disabled,
  draftPolicy,
  label,
  onChange,
  path,
}: PolicySectionProps & {
  label: string;
  path: JsonPath;
}) {
  const draftValue = getNumberAt(draftPolicy, path);

  return (
    <PolicyField label={label}>
      <input
        aria-label={label}
        className="operator-policy-input"
        disabled={disabled}
        min={0}
        onChange={(event) => {
          const nextValue = Number(event.currentTarget.value);
          onChange(path, Number.isFinite(nextValue) ? Math.max(0, nextValue) : 0);
        }}
        type="number"
        value={draftValue}
      />
    </PolicyField>
  );
}

function ArrayPolicyField({
  disabled,
  draftPolicy,
  label,
  onChange,
  path,
  placeholder,
}: PolicySectionProps & {
  label: string;
  path: JsonPath;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState("");
  const draftValues = getStringArrayAt(draftPolicy, path);
  const [itemKeys, setItemKeys] = useState(() => createPolicyRowKeys("array", draftValues.length));
  const keyedDraftValues = useMemo(
    () =>
      draftValues.map((value, index) => ({
        index,
        key: itemKeys[index] ?? createPolicyRowKey("array"),
        value,
      })),
    [draftValues, itemKeys],
  );

  useEffect(() => {
    setItemKeys((current) => syncPolicyRowKeys(current, draftValues.length, "array"));
  }, [draftValues.length]);

  function addValue() {
    const nextValue = inputValue.trim();
    if (!nextValue) {
      return;
    }

    onChange(path, [...draftValues, nextValue]);
    setItemKeys((current) => [...current, createPolicyRowKey("array")]);
    setInputValue("");
  }

  function updateValue(index: number, value: string) {
    onChange(
      path,
      draftValues.map((item, itemIndex) => (itemIndex === index ? value : item)),
    );
  }

  function removeValue(index: number) {
    onChange(
      path,
      draftValues.filter((_, itemIndex) => itemIndex !== index),
    );
    setItemKeys((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <PolicyField label={label}>
      <div className="operator-policy-array-editor">
        {keyedDraftValues.map(({ index, key, value }) => (
          <div className="operator-policy-array-row" key={key}>
            <input
              aria-label={`${label} ${index + 1}`}
              className="operator-policy-input"
              disabled={disabled}
              onChange={(event) => updateValue(index, event.currentTarget.value)}
              value={value}
            />
            <button
              aria-label={`删除${label}`}
              className="operator-icon-btn"
              disabled={disabled}
              onClick={() => removeValue(index)}
              type="button"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <div className="operator-policy-add-inline">
          <input
            className="operator-policy-input"
            disabled={disabled}
            onBlur={addValue}
            onChange={(event) => setInputValue(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addValue();
              }
            }}
            placeholder={placeholder}
            value={inputValue}
          />
          <button
            className="operator-secondary-btn"
            disabled={disabled || !inputValue.trim()}
            onMouseDown={(event) => event.preventDefault()}
            onClick={addValue}
            type="button"
          >
            <Plus size={15} />
            添加
          </button>
        </div>
      </div>
    </PolicyField>
  );
}

function HardRulesField({ disabled, draftPolicy, onChange }: PolicySectionProps) {
  const draftRules = getRules(draftPolicy);
  const [ruleKeys, setRuleKeys] = useState(() => createPolicyRowKeys("rule", draftRules.length));
  const keyedDraftRules = useMemo(
    () =>
      draftRules.map((rule, index) => ({
        index,
        key: ruleKeys[index] ?? createPolicyRowKey("rule"),
        rule,
      })),
    [draftRules, ruleKeys],
  );

  useEffect(() => {
    setRuleKeys((current) => syncPolicyRowKeys(current, draftRules.length, "rule"));
  }, [draftRules.length]);

  function updateRule(index: number, patch: Partial<HardConstraintRule>) {
    onChange(
      ["hardConstraints", "rules"],
      draftRules.map((rule, itemIndex) => (itemIndex === index ? { ...rule, ...patch } : rule)),
    );
  }

  function removeRule(index: number) {
    onChange(
      ["hardConstraints", "rules"],
      draftRules.filter((_, itemIndex) => itemIndex !== index),
    );
    setRuleKeys((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <PolicyField label="红线规则">
      <div className="operator-policy-rule-editor">
        {keyedDraftRules.map(({ index, key, rule }) => (
          <div className="operator-policy-rule-card" key={key}>
            <div className="operator-policy-rule-head">
              <input
                aria-label="规则 ID"
                className="operator-policy-input"
                disabled={disabled}
                onChange={(event) => updateRule(index, { id: event.currentTarget.value })}
                value={rule.id}
              />
              <select
                aria-label="规则等级"
                className="operator-policy-input"
                disabled={disabled}
                onChange={(event) => updateRule(index, { severity: event.currentTarget.value })}
                value={rule.severity}
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                aria-label="删除红线规则"
                className="operator-icon-btn"
                disabled={disabled || draftRules.length <= 1}
                onClick={() => removeRule(index)}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <textarea
              aria-label="规则内容"
              className="operator-policy-input"
              disabled={disabled}
              onChange={(event) => updateRule(index, { rule: event.currentTarget.value })}
              rows={2}
              value={rule.rule}
            />
          </div>
        ))}
        <button
          className="operator-secondary-btn"
          disabled={disabled}
          onClick={() => {
            setRuleKeys((current) => [...current, createPolicyRowKey("rule")]);
            onChange(
              ["hardConstraints", "rules"],
              [
                ...draftRules,
                {
                  id: nextRuleId(draftRules),
                  rule: "",
                  severity: "high",
                },
              ],
            );
          }}
          type="button"
        >
          <Plus size={15} />
          添加规则
        </button>
      </div>
    </PolicyField>
  );
}

function PolicyField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="operator-policy-field">
      <span className="operator-policy-field-label">{label}</span>
      {children}
    </div>
  );
}
