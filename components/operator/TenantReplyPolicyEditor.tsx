"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Braces,
  CheckCircle2,
  FileDiff,
  Loader2,
  Save,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import type { editor as MonacoEditor } from "monaco-editor";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { RequestOverlay } from "@/components/ui/RequestOverlay";
import { StatusToast } from "@/components/ui/StatusToast";
import { readApiError } from "@/lib/http/read-api-error";
import type {
  JsonObject,
  ReplyPolicyDiff,
  ReplyPolicyResponse,
  ReplyPolicyValidatePatchResponse,
  Tenant,
} from "@/lib/reply-authority/types";

const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((module) => module.DiffEditor),
  {
    loading: () => (
      <div className="operator-policy-monaco-loading">
        <Loader2 className="spin" size={18} />
        <span>正在加载策略对比编辑器</span>
      </div>
    ),
    ssr: false,
  },
);

type ReplyPolicyEditorResponse = ReplyPolicyResponse & {
  tenant: Tenant;
  canWrite: boolean;
  canValidate: boolean;
};

type ParsedPolicy =
  | {
      error: null;
      signature: string;
      value: JsonObject;
    }
  | {
      error: string;
      signature: null;
      value: null;
    };

const DEFAULT_SAVE_REASON = "操作台策略配置更新";
const replyPolicyRequests = new Map<string, Promise<ReplyPolicyEditorResponse>>();
const MONACO_THEME_NAME = "roll-policy-diff";

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

function parsePolicyText(value: string): ParsedPolicy {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return {
      error: "JSON 格式无效",
      signature: null,
      value: null,
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      error: "策略草稿必须是 JSON 对象",
      signature: null,
      value: null,
    };
  }

  return {
    error: null,
    signature: JSON.stringify(parsed),
    value: parsed as JsonObject,
  };
}

function toPrettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valuesEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
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

function formatWarning(warning: unknown) {
  if (typeof warning === "string") {
    return warning;
  }

  if (warning && typeof warning === "object") {
    if ("message" in warning && typeof warning.message === "string") {
      return warning.message;
    }

    return toPrettyJson(warning);
  }

  return String(warning);
}

function formatDiffValue(value: unknown) {
  if (value === undefined) {
    return "未设置";
  }

  if (typeof value === "string") {
    return value;
  }

  return toPrettyJson(value);
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

export function TenantReplyPolicyEditor({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<ReplyPolicyEditorResponse | null>(null);
  const [draftText, setDraftText] = useState("");
  const [validation, setValidation] = useState<ReplyPolicyValidatePatchResponse | null>(null);
  const [validatedDraftSignature, setValidatedDraftSignature] = useState<string | null>(null);
  const [validatedBasePolicyVersion, setValidatedBasePolicyVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const validationRequestRef = useRef(0);

  const policyJsonText = useMemo(() => toPrettyJson(data?.policy ?? {}), [data?.policy]);
  const parsedDraft = useMemo(() => parsePolicyText(draftText), [draftText]);
  const draftPatch = useMemo(() => {
    if (!data || parsedDraft.error !== null) {
      return null;
    }

    return buildPolicyPatch(data.policy, parsedDraft.value);
  }, [data, parsedDraft]);
  const draftPatchSignature = useMemo(
    () => (draftPatch ? JSON.stringify(draftPatch.patch) : null),
    [draftPatch],
  );
  const title = tenantDisplayName(data?.tenant ?? null, tenantId);
  const hasDraftChanges = Boolean(draftPatch && hasPatchChanges(draftPatch.patch));
  const draftError =
    parsedDraft.error ??
    (draftPatch && draftPatch.removedPaths.length > 0
      ? `当前 PATCH 接口不支持删除字段：${draftPatch.removedPaths.slice(0, 3).join("、")}`
      : null);
  const isValidated =
    parsedDraft.error === null &&
    draftPatchSignature !== null &&
    validatedDraftSignature === parsedDraft.signature &&
    validatedBasePolicyVersion === data?.policyVersion;
  const canValidate =
    Boolean(data?.canValidate) &&
    Boolean(data?.canWrite) &&
    hasDraftChanges &&
    !draftError &&
    !validating &&
    !saving;
  const canSave =
    Boolean(data?.canWrite) && isValidated && hasDraftChanges && !validating && !saving;
  const draftStatusText =
    draftError ?? (isValidated ? "草稿已校验" : hasDraftChanges ? "等待校验" : "暂无变更");
  const draftStatusClass = draftError
    ? "operator-json-message error"
    : isValidated
      ? "operator-json-message success"
      : "operator-json-message";
  const monacoOptions = useMemo<MonacoEditor.IDiffEditorConstructionOptions>(
    () => ({
      automaticLayout: true,
      contextmenu: false,
      fontFamily:
        "var(--font-code), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 13,
      lineHeight: 22,
      minimap: { enabled: false },
      originalEditable: false,
      readOnly: !data?.canWrite || saving,
      renderSideBySide: true,
      renderSideBySideInlineBreakpoint: 0,
      scrollBeyondLastLine: false,
      wordWrap: "on",
    }),
    [data?.canWrite, saving],
  );

  useEffect(() => {
    let cancelled = false;

    fetchReplyPolicyOnce(tenantId)
      .then((body) => {
        if (!cancelled) {
          setData(body);
          setDraftText(toPrettyJson(body.policy));
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

  function updateDraftText(value: string) {
    validationRequestRef.current += 1;
    setDraftText(value);
    setValidation(null);
    setValidatedDraftSignature(null);
    setValidatedBasePolicyVersion(null);
    setValidating(false);
  }

  function formatDraftText() {
    if (parsedDraft.error !== null) {
      return;
    }

    updateDraftText(toPrettyJson(parsedDraft.value));
  }

  function beforeDiffEditorMount(monaco: typeof import("monaco-editor")) {
    monaco.editor.defineTheme(MONACO_THEME_NAME, {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "f4f4f5" },
        { token: "string.json", foreground: "ffb088" },
        { token: "number.json", foreground: "00ff66" },
        { token: "delimiter.bracket.json", foreground: "ff5e00" },
      ],
      colors: {
        "editor.background": "#050507",
        "editor.foreground": "#f4f4f5",
        "editor.lineHighlightBackground": "#ff5e0014",
        "editorGutter.background": "#050507",
        "editorLineNumber.activeForeground": "#ff5e00",
        "editorLineNumber.foreground": "#6d6d76",
      },
    });
  }

  function onDiffEditorMount(editor: MonacoEditor.IStandaloneDiffEditor) {
    editor.getOriginalEditor().updateOptions({
      domReadOnly: true,
      readOnly: true,
    });
    editor.getModifiedEditor().onDidChangeModelContent(() => {
      updateDraftText(editor.getModifiedEditor().getValue());
    });
  }

  async function validatePatch() {
    if (!data || !draftPatch || !canValidate || parsedDraft.error !== null) {
      return;
    }

    setError(null);
    setNotice(null);
    setValidating(true);

    const requestId = validationRequestRef.current + 1;
    validationRequestRef.current = requestId;
    const draftSignature = parsedDraft.signature;
    const basePolicyVersion = data.policyVersion;
    const patch = draftPatch.patch;

    try {
      const response = await fetch(
        `/api/operator/tenants/${encodeURIComponent(tenantId)}/reply-policy/validate-patch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            basePolicyVersion,
            patch,
          }),
        },
      );

      if (validationRequestRef.current !== requestId) {
        return;
      }

      if (!response.ok) {
        const message = await readApiError(response);
        if (validationRequestRef.current !== requestId) {
          return;
        }

        setError(message);
        setValidating(false);
        return;
      }

      const body = (await response.json()) as ReplyPolicyValidatePatchResponse;
      if (validationRequestRef.current !== requestId) {
        return;
      }

      setValidation(body);
      setValidatedDraftSignature(draftSignature);
      setValidatedBasePolicyVersion(basePolicyVersion);
      setNotice("草稿校验完成");
      setValidating(false);
    } catch {
      if (validationRequestRef.current !== requestId) {
        return;
      }

      setError("策略草稿校验失败，请稍后重试");
      setValidating(false);
    }
  }

  async function savePolicy() {
    if (!data || !draftPatch || !canSave || parsedDraft.error !== null) {
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
      setDraftText(toPrettyJson(body.policy));
      setValidation(null);
      setValidatedDraftSignature(null);
      setValidatedBasePolicyVersion(null);
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

  if (!data) {
    return null;
  }

  return (
    <section
      aria-busy={validating || saving}
      aria-labelledby="reply-policy-title"
      className="operator-shell"
    >
      <RequestOverlay
        active={validating || saving}
        label={saving ? "正在保存策略" : "正在校验草稿"}
      />
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

      {!data.canValidate ? (
        <div className="operator-alert">
          <AlertTriangle size={16} />
          <span>当前客户端令牌缺少 reply-policy:validate 权限，无法校验草稿。</span>
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
          <button
            className="operator-secondary-btn"
            disabled={!canValidate}
            onClick={validatePatch}
            type="button"
          >
            {validating ? <Loader2 className="spin" size={18} /> : <Wand2 size={18} />}
            校验草稿
          </button>
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
            <FileDiff size={18} />
            策略对比
          </div>
          <div className="operator-policy-editor-legend" aria-hidden="true">
            <span>当前策略</span>
            <span>修改草稿</span>
          </div>
        </div>
        <div
          className={
            draftError ? "operator-policy-monaco-shell invalid" : "operator-policy-monaco-shell"
          }
        >
          <MonacoDiffEditor
            beforeMount={beforeDiffEditorMount}
            height="100%"
            language="json"
            modified={draftText}
            modifiedModelPath={`policy://${tenantId}/${data.policyVersion}/draft.json`}
            onMount={onDiffEditorMount}
            options={monacoOptions}
            original={policyJsonText}
            originalModelPath={`policy://${tenantId}/${data.policyVersion}/current.json`}
            theme={MONACO_THEME_NAME}
          />
        </div>
        <div className="operator-json-footer">
          <span className={draftStatusClass}>{draftStatusText}</span>
          <button
            className="operator-secondary-btn operator-json-format-btn"
            disabled={!data.canWrite || saving || parsedDraft.error !== null}
            onClick={formatDraftText}
            type="button"
          >
            <Braces size={15} />
            格式化
          </button>
        </div>
        <WarningList warnings={data.warnings} />
      </article>

      {validation ? (
        <section className="operator-policy-validation" aria-labelledby="policy-validation-title">
          <div className="operator-panel-title">
            <CheckCircle2 size={18} />
            <span id="policy-validation-title">变更对比</span>
          </div>
          <div className="operator-policy-validation-grid">
            <ValidationSummary validation={validation} />
            <DiffList diff={validation.diff} />
            <WarningList warnings={validation.warnings} />
          </div>
        </section>
      ) : null}
    </section>
  );
}

function WarningList({ warnings }: { warnings: unknown[] }) {
  if (warnings.length === 0) {
    return (
      <div className="operator-policy-state">
        <CheckCircle2 size={16} />
        <span>无 warnings</span>
      </div>
    );
  }

  const seenWarnings = new Map<string, number>();
  const warningItems = warnings.map((warning) => {
    const text = formatWarning(warning);
    const count = seenWarnings.get(text) ?? 0;
    seenWarnings.set(text, count + 1);

    return {
      key: count === 0 ? text : `${text}:${count}`,
      text,
    };
  });

  return (
    <div className="operator-policy-warning-list">
      {warningItems.map((warning) => (
        <div className="operator-alert" key={warning.key}>
          <AlertTriangle size={15} />
          <span>{warning.text}</span>
        </div>
      ))}
    </div>
  );
}

function ValidationSummary({ validation }: { validation: ReplyPolicyValidatePatchResponse }) {
  return (
    <div className="operator-policy-summary">
      <span>
        <strong>{validation.diff.length}</strong>
        <small>变更字段</small>
      </span>
      <span>
        <strong>{validation.warnings.length}</strong>
        <small>warnings</small>
      </span>
      <span>
        <strong>{validation.draftPolicyVersion}</strong>
        <small>草稿版本</small>
      </span>
    </div>
  );
}

function DiffList({ diff }: { diff: ReplyPolicyDiff[] }) {
  if (diff.length === 0) {
    return (
      <div className="operator-policy-state">
        <CheckCircle2 size={16} />
        <span>无字段变更</span>
      </div>
    );
  }

  return (
    <div className="operator-policy-compare-list">
      {diff.map((item) => (
        <article className="operator-policy-compare-item" key={item.path}>
          <header>
            <strong>{item.path}</strong>
            <span>字段变更</span>
          </header>
          <div className="operator-policy-compare-columns">
            <div className="operator-policy-compare-side before">
              <span>当前策略</span>
              <code>{formatDiffValue(item.before)}</code>
            </div>
            <div className="operator-policy-compare-side after">
              <span>修改后</span>
              <code>{formatDiffValue(item.after)}</code>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
