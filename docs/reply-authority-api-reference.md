# Reply Authority Service — API Reference

## Base URL

```
http://localhost:3100
```

Production: `https://reply-authority.duliday.com`

## Authentication

Protected endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Supported token types:

| Token type   | Config source                | Allowed actions                                                    |
| ------------ | ---------------------------- | ------------------------------------------------------------------ |
| Admin token  | `SERVICE_AUTH_TOKEN`         | All protected endpoints and all reply-policy scopes                |
| Client token | `SERVICE_CLIENT_TOKENS_JSON` | Only its bound `tenantIds`; scoped endpoints also require `scopes` |

Client token example:

```json
[
  {
    "token": "client-a-token",
    "clientId": "client-a",
    "tenantIds": ["chengdu-liujie"],
    "scopes": [
      "tenant-config:read",
      "tenant-config:write",
      "brand-config:read",
      "brand-sync:read",
      "brand-sync:write",
      "reply-policy:read",
      "reply-policy:write",
      "reply-policy:validate",
      "reply-policy:preview",
      "reply-policy:judge"
    ]
  }
]
```

Comparison uses `timingSafeEqual` to prevent timing attacks.

Scopes are explicit opt-in. Existing client tokens without `scopes` parse as
`[]` and cannot access tenant management or reply-policy management endpoints.

`GET /auth/context` lets a caller introspect the current Bearer token. It
returns the token's `role`, `clientId`, bound `tenantIds`, and `scopes`, but
never returns the token secret itself.

**Unauthenticated endpoints**: `GET /health`, `GET /.well-known/reply-authority-keys`

## Request Encoding

All JSON request bodies must be encoded as UTF-8 and should send:

```http
Content-Type: application/json; charset=utf-8
```

The service rejects non-UTF-8 JSON bodies with `400 Bad Request` before route-level schema validation or recruiter lookup. This prevents Windows client code page issues, such as GBK/CP936 bytes for Chinese recruiter names, from being misdiagnosed as tenant binding misses.

## Rate Limiting

Protected endpoints are rate-limited per IP (default: 60 requests / 60s window). Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` environment variables.

When exceeded, returns:

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded, retry in 52 seconds"
}
```

Rate limit headers are included in all responses: `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`.

## Admin Log Buffer

The service keeps a bounded, sanitized in-memory log ring buffer for local admin
tools and the TUI.

| Environment variable    | Default | Description                                 |
| ----------------------- | ------- | ------------------------------------------- |
| `ADMIN_LOG_BUFFER_SIZE` | `500`   | Maximum entries retained for admin log APIs |

The value is clamped to `1..10000`. Restarting the process clears the in-memory
buffer.

## Tenant Brand Sync Scheduler

The service runs a daily tenant brand-data sync by default. The scheduler is
inside the Fastify process and reuses the same tenant sync code path as the
manual admin endpoint.

| Environment variable              | Default         | Description                                            |
| --------------------------------- | --------------- | ------------------------------------------------------ |
| `TENANT_BRAND_SYNC_ENABLED`       | `true`          | Enable daily automatic tenant brand sync               |
| `TENANT_BRAND_SYNC_DAILY_TIME`    | `03:30`         | Daily execution time in `HH:mm`                        |
| `TENANT_BRAND_SYNC_TIMEZONE`      | `Asia/Shanghai` | Time zone used to calculate the next run               |
| `TENANT_BRAND_SYNC_CONCURRENCY`   | `1`             | Number of tenants synced concurrently                  |
| `TENANT_BRAND_SYNC_RUN_ON_START`  | `false`         | Whether to run one batch shortly after service startup |
| `TENANT_BRAND_SYNC_HISTORY_LIMIT` | `100`           | Number of persisted sync run records to retain         |

The default schedule means **03:30 in `Asia/Shanghai`**, not "03:30 in the
container's local time zone". If the server or container already uses Beijing
time, the observed execution time is the same. If it uses another time zone,
the scheduler still calculates the corresponding UTC instant for
`Asia/Shanghai 03:30`.

Each batch writes an auditable run record under `data/brand-sync-runs/`. The
record contains per-tenant success, failure, skip reason, synced brand/store/job
counts, timing, and the Duliday endpoint/brand aliases used by successful
tenant syncs.

---

## Endpoints

### GET /auth/context

Return the authorization context for the current Bearer token. This is the
recommended way for a third-party Agent to discover which tenant IDs and scopes
it can use before calling tenant-scoped reply-policy endpoints.

**Auth**: Required
**Rate limit**: Yes

Client token response:

```json
{
  "role": "client",
  "clientId": "browser-use-agent",
  "tenantIds": ["chengdu-liujie", "creator-yh"],
  "scopes": [
    "tenant-config:read",
    "brand-config:read",
    "reply-policy:read",
    "reply-policy:validate",
    "reply-policy:preview"
  ]
}
```

Admin token response:

```json
{
  "role": "admin",
  "clientId": "admin",
  "tenantIds": null,
  "scopes": [
    "tenant-config:read",
    "tenant-config:write",
    "brand-config:read",
    "brand-sync:read",
    "brand-sync:write",
    "reply-policy:read",
    "reply-policy:write",
    "reply-policy:validate",
    "reply-policy:preview",
    "reply-policy:judge"
  ]
}
```

`tenantIds: null` means the admin token is not tenant-bound. This endpoint does
not list tenant manifests, tenant display names, recruiter bindings, or token
secrets.

### POST /generate-signed-reply

Generate an AI reply and return it wrapped in a signed envelope. This is the core endpoint — reply generation and signing are atomic (no separate `/sign` endpoint).

**Auth**: Required
**Rate limit**: Yes

#### Request Body

```jsonc
{
  // Required
  "candidateMessage": "你好，请问薪资是多少？",
  "target": {
    "platform": "zhipin",
    "tenantId": "tenant-001",
    "recruiterBinding": {
      "platform": "zhipin",
      "username": "recruiter-alice",
    },
    "conversationId": "conv-abc",
    "candidateId": "cand-xyz",
  },

  // Optional
  "requestId": "req-123",
  "conversationHistory": ["HR: 你好", "候选人: 请问在哪里上班"],
  "candidateInfo": {
    "name": "张三",
    "position": "门店服务员",
    "expectedPosition": "全职",
    "communicationPosition": "服务员",
    "age": "25",
    "gender": "男",
    "experience": "2年餐饮",
    "education": "大专",
    "expectedSalary": "5000",
    "expectedLocation": "浦东",
    "jobAddress": "陆家嘴",
    "height": "175cm",
    "weight": "65kg",
    "healthCertificate": true,
    "activeTime": "2026-04-10",
    "info": ["有健康证", "可立即上岗"],
    "fullText": "原始简历文本...",
  },
  "preferredBrand": "品牌A",
  "channelType": "public", // "public" | "private"
  "defaultWechatId": "wx_12345",
  "industryVoiceId": "default",
  "turnIndex": 2, // >= 1
  "stream": false, // false/omitted = JSON response; true = SSE response
  "modelConfig": {
    "classifyModel": "anthropic/claude-haiku-4-5",
    "replyModel": "anthropic/claude-sonnet-4-6",
    "reasoning": {
      "enabled": true,
      "effort": "medium", // "low" | "medium" | "high"
      "scope": "reply", // "reply" | "all"
    },
    "providerConfigs": {}, // deprecated request-level provider baseURL overrides
  },
}
```

| Field                               | Type                      | Required | Description                                                                                 |
| ----------------------------------- | ------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `requestId`                         | string                    | No       | Caller-supplied idempotency / audit request identifier                                      |
| `candidateMessage`                  | string                    | Yes      | Candidate's latest message                                                                  |
| `target`                            | object                    | Yes      | Signing target — also used to route tenant-specific config before signing                   |
| `target.platform`                   | `"zhipin"`                | Yes      | Fixed to zhipin                                                                             |
| `target.tenantId`                   | string                    | Yes      | Tenant identifier; must match the tenant bound to the caller token                          |
| `target.recruiterBinding`           | object                    | Yes      | Recruiter identity bound to the tenant and signed into the envelope                         |
| `target.recruiterBinding.platform`  | `"zhipin"`                | Yes      | Fixed to zhipin                                                                             |
| `target.recruiterBinding.username`  | string                    | Yes      | Recruiter username returned by the caller-side platform tool                                |
| `target.recruiterBinding.accountId` | string                    | No       | Optional stronger recruiter identifier for future use                                       |
| `target.conversationId`             | string                    | Yes      | Conversation identifier                                                                     |
| `target.candidateId`                | string                    | Yes      | Candidate identifier                                                                        |
| `conversationHistory`               | string[]                  | No       | Recent conversation turns                                                                   |
| `candidateInfo`                     | object                    | No       | Known candidate profile fields (see all fields below)                                       |
| `preferredBrand`                    | string                    | No       | Structured brand signal, typically extracted from job title / communication position prefix |
| `channelType`                       | `"public"` \| `"private"` | No       | Channel type (BOSS vs WeChat)                                                               |
| `defaultWechatId`                   | string                    | No       | Default WeChat ID used by the reply pipeline                                                |
| `industryVoiceId`                   | string                    | No       | Voice/persona preset identifier                                                             |
| `turnIndex`                         | integer >= 1              | No       | Current conversation turn number                                                            |
| `stream`                            | boolean                   | No       | When `true`, return Server-Sent Events instead of the one-shot JSON response                |
| `modelConfig`                       | object                    | No       | Override LLM model selections                                                               |

**Deprecated `modelConfig.providerConfigs`**

`modelConfig.providerConfigs` is retained for backward compatibility as a request-level provider `baseURL` override. Prefer server-side environment variables for provider endpoint configuration; this field is planned for future removal.

| Behavior              | Current implementation                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Priority              | Request `providerConfigs.<provider>.baseURL` > provider `*_BASE_URL` env > `SMART_REPLY_PROXY_BASE_URL` for `anthropic`/`openai`/`ohmygpt` > built-in default |
| Supported effect      | Overrides `baseURL` for an already registered provider                                                                                                        |
| Ignored fields        | `name` and `description` are accepted for compatibility but do not affect runtime provider creation                                                           |
| Not supported         | Does not add new providers, override API keys, or change the AI SDK provider factory                                                                          |
| Unknown provider keys | Ignored with a redacted warning; full URLs are not logged                                                                                                     |

**`modelConfig.reasoning` fields** (optional):

| Field     | Type                              | Default  | Description                                                                                      |
| --------- | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `enabled` | boolean                           | Required | Whether to request model reasoning/thinking mode                                                 |
| `effort`  | `"low"` \| `"medium"` \| `"high"` | `medium` | Provider-specific reasoning strength or budget mapped through AI SDK `providerOptions`           |
| `scope`   | `"reply"` \| `"all"`              | `reply`  | `reply` applies to reply generation and gate rewrites; `all` also applies to turn planning calls |

Reasoning compatibility is model/provider specific. When `enabled: true` is requested for an unsupported model, the endpoint returns `400 Bad Request` before running the LLM. Raw reasoning/thinking text is never returned to business callers; the service only uses provider reasoning controls internally and may expose non-sensitive diagnostics such as the applied provider, effort, and support status.

When `modelConfig.reasoning` is omitted, the service preserves provider defaults for backward compatibility. To explicitly request non-reasoning behavior where the provider supports it, send `"reasoning": { "enabled": false }`.

Provider mapping:

| Model provider | Supported mapping                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------- |
| `openai/*`     | `providerOptions.openai.reasoningEffort = low/medium/high` for OpenAI reasoning models          |
| `anthropic/*`  | Claude thinking/effort options with raw thinking omitted from public output                     |
| `google/*`     | `providerOptions.google.thinkingConfig.thinkingLevel = low/medium/high`                         |
| `deepseek/*`   | DeepSeek thinking enabled/disabled; `high` maps to provider `reasoningEffort: high`             |
| `qwen/*`       | Alibaba `enableThinking` plus token budget mapped from effort                                   |
| `moonshotai/*` | Supported only for model IDs that indicate thinking/reasoning, such as `kimi-k2-thinking-turbo` |

**`candidateInfo` fields** (all optional):

| Field                   | Type     | Description       |
| ----------------------- | -------- | ----------------- |
| `name`                  | string   | 候选人姓名        |
| `position`              | string   | 当前/最近岗位     |
| `expectedPosition`      | string   | 期望岗位          |
| `communicationPosition` | string   | 沟通中提到的岗位  |
| `age`                   | string   | 年龄              |
| `gender`                | string   | 性别              |
| `experience`            | string   | 工作经验          |
| `education`             | string   | 学历              |
| `expectedSalary`        | string   | 期望薪资          |
| `expectedLocation`      | string   | 期望工作地点      |
| `jobAddress`            | string   | 岗位地址          |
| `height`                | string   | 身高              |
| `weight`                | string   | 体重              |
| `healthCertificate`     | boolean  | 是否有健康证      |
| `activeTime`            | string   | 最近活跃时间      |
| `info`                  | string[] | 补充信息标签      |
| `fullText`              | string   | 原始简历/资料全文 |

#### Response (200)

```jsonc
{
  "suggestedReply": "感谢你的关注！我们这边...",
  "signedEnvelope": "eyJ2Ijoy...base64url.signatureBase64url",
  "envelopeExp": 1712736600,
  "confidence": 0.85,
  "stage": "trust_building",
  "replyPolicySource": "file",       // "file" | "default"

  // Optional fields
  "latencyMs": 1234,
  "shouldExchangeWechat": false,
  "error": "...",
  "diagnostics": { ... }
}
```

| Field                  | Type                    | Description                                                  |
| ---------------------- | ----------------------- | ------------------------------------------------------------ |
| `suggestedReply`       | string                  | Generated reply text                                         |
| `signedEnvelope`       | string                  | Opaque compact envelope (see format below)                   |
| `envelopeExp`          | integer                 | Envelope expiration (Unix seconds)                           |
| `confidence`           | number 0-1              | Pipeline confidence score                                    |
| `stage`                | string                  | Current funnel stage                                         |
| `replyPolicySource`    | `"file"` \| `"default"` | Which reply policy was used                                  |
| `latencyMs`            | number?                 | LLM call latency                                             |
| `shouldExchangeWechat` | boolean?                | Whether to prompt WeChat exchange                            |
| `error`                | string?                 | User-visible generation error detail                         |
| `diagnostics`          | object?                 | Debug info (turn plan, brand lock state, gate results, etc.) |

#### Streaming Response (SSE)

Set `stream: true` in the same request body to receive `text/event-stream` instead of the JSON response.

For client-side parsing, UI state, progress rendering, and error handling, see [Reply streaming client guide](./reply-streaming-client-guide.md).

The stream uses the Reply Authority SSE protocol, not the AI SDK UI message protocol. Draft deltas are provisional and are not safe to send. Only the `final` event contains the signed, safe-to-send reply. When reasoning is enabled, the service emits reasoning start/end status around the LLM generation step. If the provider stream exposes AI SDK `reasoning-start` / `reasoning-end` parts, `observed` is set to `true`; raw reasoning deltas are never forwarded.

```text
stream.started
  -> phase.started / phase.completed
  -> turn_plan.completed
  -> context.completed
  -> qualification.completed
  -> draft.started
  -> reasoning.started / reasoning.completed (optional, no raw reasoning text)
  -> draft.delta / draft.completed
  -> gate.completed
  -> final
  -> stream.completed
```

All events use this SSE shape:

```text
event: <event-name>
data: {"type":"<event-name>","sequence":1,"timestamp":"2026-05-11T00:00:00.000Z",...}
```

| Event                     | Purpose                              | Important fields                                                     |
| ------------------------- | ------------------------------------ | -------------------------------------------------------------------- |
| `stream.started`          | Stream accepted                      | `protocolVersion`, `requestId`, `tenantId`                           |
| `phase.started`           | A pipeline phase started             | `phase`, `label`                                                     |
| `phase.completed`         | A pipeline phase completed           | `phase`, `latencyMs`                                                 |
| `turn_plan.completed`     | Turn planning result                 | `stage`, `primaryNeed`, `needs`, `riskFlags`, `confidence`           |
| `context.completed`       | Business context result              | `resolvedBrand`, `detailLevel`, `storeCount`, `brandLockState`       |
| `qualification.completed` | Qualification gate result            | `gate`, `status`, `strategy`                                         |
| `draft.started`           | Provisional model output started     | `draftId`, `source`, `provisional: true`                             |
| `reasoning.started`       | Reasoning-enabled generation started | `reasoningId`, `source`, `modelId`, `provider`, `effort`, `observed` |
| `reasoning.completed`     | Reasoning-enabled generation ended   | `reasoningId`, `source`, `observed`, `latencyMs?`                    |
| `draft.delta`             | Provisional model text delta         | `draftId`, `delta`, `provisional: true`                              |
| `draft.completed`         | Provisional model output ended       | `draftId`, `textLength`, `provisional: true`                         |
| `tool.started`            | A model/tool step started            | `toolCallId`, `toolName`, `title?`                                   |
| `tool.completed`          | A model/tool step completed          | `toolCallId`, `toolName`, `preliminary?`                             |
| `tool.failed`             | A model/tool step failed             | `toolCallId`, `toolName`, `message`                                  |
| `gate.completed`          | `FactGate` or `ReplyGate` completed  | `gate`, `rewritten`, `violations?`                                   |
| `final`                   | Final signed reply                   | `suggestedReply`, `signedEnvelope`, `safeToSend: true`               |
| `error`                   | Stream failed after SSE started      | `statusCode`, `error`, `message`                                     |
| `stream.completed`        | Stream ended successfully            | `ok: true`                                                           |

Stable `phase` values:

| Phase                 | Meaning                                                       |
| --------------------- | ------------------------------------------------------------- |
| `tenant_context`      | Load tenant manifest, brand config, and reply policy          |
| `binding_check`       | Verify `target.recruiterBinding` belongs to `target.tenantId` |
| `turn_planning`       | Generate `TurnPlan`                                           |
| `context_building`    | Build business context from brand/job facts                   |
| `qualification_check` | Run qualification gates such as age eligibility               |
| `reply_generation`    | Generate the provisional LLM reply                            |
| `fact_gate`           | Check unsupported concrete facts                              |
| `reply_gate`          | Check output shape, tone, question count, and fact axis       |
| `signing`             | Sign the final reply envelope                                 |

Error notes:

- `409 Conflict` — tenant exists but brand data is not ready yet. Current message: `租户数据未就绪，请先同步品牌数据`
- `403 Forbidden` — tenant is disabled, caller is not allowed to access the requested tenant, or `target.recruiterBinding` does not belong to `target.tenantId`
- `404 Not Found` — tenant manifest/config cannot be loaded. Current message: `租户配置不可用`

---

### POST /resolve-recruiter-binding

Resolve a recruiter identity to its unique tenant binding before calling `/generate-signed-reply`.

**Auth**: Required
**Rate limit**: Yes

#### Request Body

```json
{
  "platform": "zhipin",
  "username": "recruiter-alice"
}
```

| Field       | Type       | Required | Description                                      |
| ----------- | ---------- | -------- | ------------------------------------------------ |
| `platform`  | `"zhipin"` | Yes      | Fixed to zhipin                                  |
| `username`  | string     | Yes      | Recruiter username to resolve                    |
| `accountId` | string     | No       | Optional stronger identifier for future matching |

#### Response (200)

```json
{
  "tenantId": "chengdu-liujie",
  "recruiterBinding": {
    "platform": "zhipin",
    "username": "recruiter-alice"
  }
}
```

Error notes:

- `404 Not Found` — recruiter is not bound to any tenant. Current message: `recruiter 未绑定到任何 tenant：<username>`
- `409 Conflict` — recruiter is bound to multiple tenants. Current message: `recruiter <username> 在多个 tenant 中（<t1>, <t2>），请联系管理员`
- `403 Forbidden` — caller token cannot access the resolved `tenantId`

Operational note:

- Admin tenant APIs can create and replace `bindings.zhipinRecruiters`. If you still edit `data/tenants/<tenantId>/tenant.json` operationally, keep the file aligned with the recruiter accounts you actually operate.

---

### Tenant Reply Policy APIs

Manage tenant-local reply policies in `data/tenants/<tenantId>/reply-policy.json`.
These endpoints do not modify the global `data/reply-policy.json`.

For a complete Agent loop that uses these endpoints for recursive policy
improvement, see
[`docs/reply-policy-agent-iteration-guide.md`](reply-policy-agent-iteration-guide.md).

**Auth**: Required

**Rate limit**: Yes

Authorization order:

```text
authenticate
  -> assert tenant access
  -> require reply-policy scope
```

Required scopes:

| Method   | Endpoint                                         | Scope                   | Behavior                                                     |
| -------- | ------------------------------------------------ | ----------------------- | ------------------------------------------------------------ |
| `GET`    | `/tenants/:tenantId/reply-policy`                | `reply-policy:read`     | Return current effective policy and version                  |
| `POST`   | `/tenants/:tenantId/reply-policy:validate`       | `reply-policy:validate` | Validate and normalize a draft policy without saving         |
| `POST`   | `/tenants/:tenantId/reply-policy:validate-patch` | `reply-policy:validate` | Merge and validate a patch without saving                    |
| `POST`   | `/tenants/:tenantId/reply-policy:preview`        | `reply-policy:preview`  | Generate base/draft preview replies without signing          |
| `POST`   | `/tenants/:tenantId/reply-policy:evaluate`       | `reply-policy:preview`  | Batch replay base/draft policy cases without signing         |
| `PUT`    | `/tenants/:tenantId/reply-policy`                | `reply-policy:write`    | Replace tenant-local policy                                  |
| `PATCH`  | `/tenants/:tenantId/reply-policy`                | `reply-policy:write`    | Deep-merge patch into effective policy, then save            |
| `DELETE` | `/tenants/:tenantId/reply-policy`                | `reply-policy:write`    | Delete tenant-local override and fall back to global/default |

When `POST /tenants/:tenantId/reply-policy:evaluate` sets
`judge.enabled=true`, the token must also include `reply-policy:judge`.
Admin tokens implicitly have all scopes.

Admin-only judge rubric governance endpoints:

| Method | Endpoint                                           | Behavior                                              |
| ------ | -------------------------------------------------- | ----------------------------------------------------- |
| `GET`  | `/admin/reply-policy/judge-rubrics`                | List available frozen judge rubrics                   |
| `POST` | `/admin/reply-policy/judge-rubrics:validate`       | Validate a rubric draft without saving                |
| `POST` | `/admin/reply-policy/judge-rubrics:evaluate`       | Check rubric draft promotion readiness                |
| `PUT`  | `/admin/reply-policy/judge-rubrics/:rubricVersion` | Save a promoted rubric version and write rubric audit |

`PUT /admin/reply-policy/judge-rubrics/:rubricVersion` requires explicit
promotion evidence in the request body:

```json
{
  "rubric": {
    "rubricVersion": "reply-quality-v2",
    "name": "Reply Quality Pairwise Judge v2",
    "mode": "pairwise",
    "dimensions": ["goalFit", "policyCompliance", "factualSafety"],
    "blockingRules": ["hard_gate_failures_cannot_pass"],
    "systemPrompt": "..."
  },
  "promotion": {
    "reason": "通过 golden/regression 样本并完成 shadow review",
    "goldenSetPass": true,
    "regressionSetPass": true,
    "shadowModeAccepted": true,
    "benchmarkSummary": "golden=42/45, regression=30/30",
    "judgeModel": "anthropic/claude-sonnet-4-6"
  }
}
```

The route rejects missing or false promotion flags. The audit line records the
actor, rubric version, reason, prompt hash, dimensions, blocking rules, and
promotion metadata.

#### Response Shape

All successful reply-policy endpoints return:

```json
{
  "tenantId": "chengdu-liujie",
  "source": "tenant-file",
  "policyVersion": "chengdu-liujie:tenant-file:xxxx",
  "policy": {},
  "warnings": []
}
```

`source` is one of:

| Source        | Meaning                                     |
| ------------- | ------------------------------------------- |
| `tenant-file` | `data/tenants/<tenantId>/reply-policy.json` |
| `global-file` | `data/reply-policy.json` fallback           |
| `default`     | Built-in `DEFAULT_REPLY_POLICY` fallback    |

#### ReplyPolicyConfig Field Schema

`policy` is validated by `ReplyPolicyConfigSchema` in `src/types/reply-policy.ts`.
`GET` returns the normalized shape. `POST :validate` and `PUT` require a policy
object with all non-defaulted sections. `PATCH` accepts a partial object, merges
it into the current effective policy, then validates the merged full policy.

Type notes:

| Type       | Meaning                                                                   |
| ---------- | ------------------------------------------------------------------------- |
| `string`   | Arbitrary non-null text. The service does not enforce a fixed vocabulary. |
| `string[]` | Array of arbitrary non-null text items.                                   |
| `enum`     | Must match one of the documented values exactly.                          |
| `record`   | Object with caller-defined string keys and a documented value shape.      |

Unknown object keys are not part of the supported contract. Current schema
normalization may strip unknown keys, so callers should not rely on storing
extension fields inside `reply-policy.json`.

Top-level fields:

| Field                    | Type   | Required | Default / normalization                                        | Notes                                 |
| ------------------------ | ------ | -------- | -------------------------------------------------------------- | ------------------------------------- |
| `stageGoals`             | object | Yes      | `private_channel` is copied from `trust_building` when omitted | Fixed stage keys only                 |
| `persona`                | object | Yes      | None                                                           | Recruiter voice and answer style      |
| `industryVoices`         | record | Yes      | None                                                           | Keys are caller-defined voice IDs     |
| `defaultIndustryVoiceId` | string | Yes      | None                                                           | Must exist in `industryVoices`        |
| `hardConstraints`        | object | Yes      | None                                                           | `rules` must not be empty             |
| `factGate`               | object | Yes      | None                                                           | `mode !== "strict"` returns a warning |
| `qualificationPolicy`    | object | No       | Defaults to the built-in age policy                            | Qualification handling rules          |
| `outputGuards`           | object | No       | Defaults to `DEFAULT_OUTPUT_GUARDS`                            | Output safety limits                  |

`stageGoals`:

| Field path                        | Type              | Required | Allowed values / notes                  |
| --------------------------------- | ----------------- | -------- | --------------------------------------- |
| `stageGoals.trust_building`       | `StageGoalPolicy` | Yes      | Fixed key                               |
| `stageGoals.private_channel`      | `StageGoalPolicy` | No       | Fixed key; defaults to `trust_building` |
| `stageGoals.qualify_candidate`    | `StageGoalPolicy` | Yes      | Fixed key                               |
| `stageGoals.job_consultation`     | `StageGoalPolicy` | Yes      | Fixed key                               |
| `stageGoals.interview_scheduling` | `StageGoalPolicy` | Yes      | Fixed key                               |
| `stageGoals.onboard_followup`     | `StageGoalPolicy` | Yes      | Fixed key                               |

`StageGoalPolicy`:

| Field               | Type       | Required | Allowed values / notes                                       |
| ------------------- | ---------- | -------- | ------------------------------------------------------------ |
| `description`       | string     | No       | Arbitrary text                                               |
| `primaryGoal`       | string     | Yes      | Arbitrary text                                               |
| `successCriteria`   | `string[]` | Yes      | Arbitrary text items                                         |
| `ctaStrategy`       | string     | Yes      | Arbitrary text; array input is normalized with newline joins |
| `disallowedActions` | `string[]` | No       | Arbitrary text items                                         |

`persona`:

| Field                  | Type   | Required | Allowed values / notes    |
| ---------------------- | ------ | -------- | ------------------------- |
| `tone`                 | string | Yes      | Arbitrary text            |
| `warmth`               | string | Yes      | Arbitrary text            |
| `humor`                | string | Yes      | Arbitrary text            |
| `length`               | enum   | Yes      | `short`, `medium`, `long` |
| `questionStyle`        | string | Yes      | Arbitrary text            |
| `empathyStrategy`      | string | Yes      | Arbitrary text            |
| `addressStyle`         | string | Yes      | Arbitrary text            |
| `professionalIdentity` | string | Yes      | Arbitrary text            |
| `companyBackground`    | string | Yes      | Arbitrary text            |

`industryVoices` is a record. The record key is an arbitrary string voice ID,
for example `restaurant` or `retail`.

| Field                                         | Type       | Required | Allowed values / notes |
| --------------------------------------------- | ---------- | -------- | ---------------------- |
| `industryVoices.<voiceId>.name`               | string     | Yes      | Arbitrary text         |
| `industryVoices.<voiceId>.industryBackground` | string     | Yes      | Arbitrary text         |
| `industryVoices.<voiceId>.jargon`             | `string[]` | Yes      | Arbitrary text items   |
| `industryVoices.<voiceId>.styleKeywords`      | `string[]` | Yes      | Arbitrary text items   |
| `industryVoices.<voiceId>.tabooPhrases`       | `string[]` | Yes      | Arbitrary text items   |
| `industryVoices.<voiceId>.guidance`           | `string[]` | Yes      | Arbitrary text items   |

`hardConstraints`:

| Field                              | Type     | Required | Allowed values / notes                                  |
| ---------------------------------- | -------- | -------- | ------------------------------------------------------- |
| `hardConstraints.rules`            | object[] | Yes      | Must contain at least one item                          |
| `hardConstraints.rules[].id`       | string   | Yes      | Arbitrary rule ID; uniqueness is not enforced by schema |
| `hardConstraints.rules[].rule`     | string   | Yes      | Arbitrary rule text                                     |
| `hardConstraints.rules[].severity` | enum     | Yes      | `high`, `medium`, `low`                                 |

`factGate`:

| Field                                | Type       | Required | Allowed values / notes                                                 |
| ------------------------------------ | ---------- | -------- | ---------------------------------------------------------------------- |
| `factGate.mode`                      | enum       | Yes      | `strict`, `balanced`, `open`; non-`strict` returns a warning           |
| `factGate.verifiableClaimTypes`      | `string[]` | Yes      | Claim type labels such as `salary`, `schedule`, `location`, `benefits` |
| `factGate.fallbackBehavior`          | enum       | Yes      | `generic_answer`, `ask_followup`, `handoff`                            |
| `factGate.forbiddenWhenMissingFacts` | `string[]` | Yes      | Arbitrary text items                                                   |

`qualificationPolicy`:

| Field                                      | Type    | Required | Default / allowed values                  |
| ------------------------------------------ | ------- | -------- | ----------------------------------------- |
| `qualificationPolicy.age.enabled`          | boolean | No       | `true`                                    |
| `qualificationPolicy.age.revealRange`      | boolean | No       | `false`                                   |
| `qualificationPolicy.age.failStrategy`     | string  | No       | Arbitrary text; defaults to built-in copy |
| `qualificationPolicy.age.unknownStrategy`  | string  | No       | Arbitrary text; defaults to built-in copy |
| `qualificationPolicy.age.passStrategy`     | string  | No       | Arbitrary text; defaults to built-in copy |
| `qualificationPolicy.age.allowRedirect`    | boolean | No       | `true`                                    |
| `qualificationPolicy.age.redirectPriority` | enum    | No       | `low`, `medium`, `high`; default `medium` |

`outputGuards`:

| Field                                      | Type       | Required | Allowed values / notes              |
| ------------------------------------------ | ---------- | -------- | ----------------------------------- |
| `outputGuards.maxQuestionsByMode.minimal`  | integer    | Yes      | `>= 0`; policy lint requires `<= 3` |
| `outputGuards.maxQuestionsByMode.focused`  | integer    | Yes      | `>= 0`; policy lint requires `<= 3` |
| `outputGuards.blockedAuditPhrases`         | `string[]` | Yes      | Arbitrary text items                |
| `outputGuards.blockFirstTurnSpecificFacts` | boolean    | Yes      | `true` or `false`                   |

Enum summary:

| Field path                                 | Values                                      |
| ------------------------------------------ | ------------------------------------------- |
| `persona.length`                           | `short`, `medium`, `long`                   |
| `hardConstraints.rules[].severity`         | `high`, `medium`, `low`                     |
| `factGate.mode`                            | `strict`, `balanced`, `open`                |
| `factGate.fallbackBehavior`                | `generic_answer`, `ask_followup`, `handoff` |
| `qualificationPolicy.age.redirectPriority` | `low`, `medium`, `high`                     |

Minimal full-policy skeleton:

```json
{
  "stageGoals": {
    "trust_building": {
      "primaryGoal": "建立信任",
      "successCriteria": ["候选人愿意继续沟通"],
      "ctaStrategy": "自然推进下一步"
    },
    "qualify_candidate": {
      "primaryGoal": "确认关键资格",
      "successCriteria": ["确认候选人基本匹配"],
      "ctaStrategy": "轻量提问"
    },
    "job_consultation": {
      "primaryGoal": "回答岗位问题",
      "successCriteria": ["候选人理解岗位信息"],
      "ctaStrategy": "基于事实回应"
    },
    "interview_scheduling": {
      "primaryGoal": "推进面试",
      "successCriteria": ["候选人愿意确认时间"],
      "ctaStrategy": "给出明确安排"
    },
    "onboard_followup": {
      "primaryGoal": "跟进到岗",
      "successCriteria": ["候选人确认到岗计划"],
      "ctaStrategy": "保持简洁提醒"
    }
  },
  "persona": {
    "tone": "真诚直接",
    "warmth": "适中",
    "humor": "少量",
    "length": "short",
    "questionStyle": "一次只问一个关键问题",
    "empathyStrategy": "先回应关切再推进",
    "addressStyle": "自然称呼",
    "professionalIdentity": "招聘顾问",
    "companyBackground": "本地招聘服务"
  },
  "industryVoices": {
    "default": {
      "name": "默认行业话术",
      "industryBackground": "通用招聘",
      "jargon": [],
      "styleKeywords": ["清楚", "可信"],
      "tabooPhrases": [],
      "guidance": ["避免承诺未验证事实"]
    }
  },
  "defaultIndustryVoiceId": "default",
  "hardConstraints": {
    "rules": [
      {
        "id": "no-unverified-promises",
        "rule": "不得承诺未验证的薪资、福利或录用结果",
        "severity": "high"
      }
    ]
  },
  "factGate": {
    "mode": "strict",
    "verifiableClaimTypes": ["salary", "schedule", "location", "benefits"],
    "fallbackBehavior": "ask_followup",
    "forbiddenWhenMissingFacts": ["具体薪资", "具体门店地址"]
  }
}
```

#### GET /tenants/:tenantId/reply-policy

Returns the current effective policy. Tenant-local policy wins over global policy,
and global policy wins over built-in default policy.

#### POST /tenants/:tenantId/reply-policy:validate

Request body:

```json
{
  "policy": {}
}
```

The service parses the policy with `ReplyPolicyConfigSchema`, applies policy lint,
and returns the normalized policy and warnings. It does not write any tenant file.

#### POST /tenants/:tenantId/reply-policy:validate-patch

Request body:

```json
{
  "basePolicyVersion": "chengdu-liujie:tenant-file:xxxx",
  "hypothesis": "首轮沟通需要更快推进微信",
  "patch": {
    "persona": {
      "tone": "更直接但保持礼貌"
    }
  }
}
```

The service reloads the current effective policy, checks `basePolicyVersion`,
deep-merges `patch`, validates the merged draft policy, and returns the draft
policy plus a field-level diff. It does not write `reply-policy.json` and does
not append audit records.

Response:

```json
{
  "tenantId": "chengdu-liujie",
  "basePolicyVersion": "chengdu-liujie:tenant-file:xxxx",
  "draftPolicyVersion": "chengdu-liujie:draft:yyyy",
  "source": "tenant-file",
  "policy": {},
  "patch": {},
  "warnings": [],
  "diff": [
    {
      "path": "persona.tone",
      "before": "温和亲切",
      "after": "更直接但保持礼貌"
    }
  ]
}
```

#### POST /tenants/:tenantId/reply-policy:preview

Generate one base reply and one draft reply for the same input. The endpoint
uses the current effective policy for `base`, uses `base + patch` for `draft`,
and does not sign or persist either reply.

Request body:

```json
{
  "basePolicyVersion": "chengdu-liujie:tenant-file:xxxx",
  "patch": {},
  "input": {
    "candidateMessage": "可以，怎么加微信？",
    "conversationHistory": ["HR: 你好，想了解下店员岗位吗？"],
    "target": {
      "platform": "zhipin",
      "tenantId": "chengdu-liujie",
      "recruiterBinding": {
        "platform": "zhipin",
        "username": "recruiter-alice"
      },
      "conversationId": "preview-conv-1",
      "candidateId": "preview-candidate-1"
    }
  }
}
```

`input` uses the same core fields as `/generate-signed-reply`, except `stream`
is not allowed. `input.target.tenantId` must match the route `tenantId`, and
`input.target.recruiterBinding` must be bound to the tenant.

Response:

```json
{
  "tenantId": "chengdu-liujie",
  "basePolicyVersion": "chengdu-liujie:tenant-file:xxxx",
  "draftPolicyVersion": "chengdu-liujie:draft:yyyy",
  "warnings": [],
  "diff": [],
  "base": {
    "suggestedReply": "...",
    "confidence": 0.82,
    "stage": "private_channel",
    "diagnostics": {}
  },
  "draft": {
    "suggestedReply": "...",
    "confidence": 0.87,
    "stage": "private_channel",
    "diagnostics": {}
  }
}
```

Preview responses never include `signedEnvelope` or `envelopeExp`.

#### POST /tenants/:tenantId/reply-policy:evaluate

Batch replay up to 10 cases against the base policy and the draft policy. The
endpoint always returns deterministic hard-gate comparison plus evidence-backed
fact verification. It can optionally run a frozen pairwise LLM Judge when
`judge.enabled=true`.

Request body:

```json
{
  "basePolicyVersion": "chengdu-liujie:tenant-file:xxxx",
  "patch": {},
  "judge": {
    "enabled": true,
    "mode": "pairwise",
    "rubricVersion": "reply-quality-v1"
  },
  "cases": [
    {
      "caseId": "main-001",
      "role": "primary",
      "tags": ["wechat", "first-turn"],
      "input": {
        "candidateMessage": "可以，怎么加微信？",
        "target": {
          "platform": "zhipin",
          "tenantId": "chengdu-liujie",
          "recruiterBinding": {
            "platform": "zhipin",
            "username": "recruiter-alice"
          },
          "conversationId": "eval-conv-1",
          "candidateId": "eval-candidate-1"
        }
      }
    }
  ]
}
```

`cases` must contain `1..10` items. `role` is `primary` or `regression`.
`judge.enabled=false` or missing `judge` preserves deterministic-only behavior.
`judge.rubricVersion` defaults to `reply-quality-v1` when omitted.

Response:

```json
{
  "tenantId": "chengdu-liujie",
  "basePolicyVersion": "chengdu-liujie:tenant-file:xxxx",
  "draftPolicyVersion": "chengdu-liujie:draft:yyyy",
  "summary": {
    "totalCases": 1,
    "primaryCases": 1,
    "regressionCases": 0,
    "draftFailures": 0,
    "regressionWarnings": 0,
    "hardRecommendedForPublish": true,
    "factRecommendedForPublish": true,
    "judgeRecommendedForPublish": true,
    "recommendedForPublish": true
  },
  "cases": [
    {
      "caseId": "main-001",
      "role": "primary",
      "base": {
        "suggestedReply": "...",
        "stage": "private_channel",
        "confidence": 0.82,
        "replyGateRewritten": false,
        "factGateRewritten": false,
        "gateViolations": []
      },
      "draft": {
        "suggestedReply": "...",
        "stage": "private_channel",
        "confidence": 0.87,
        "replyGateRewritten": false,
        "factGateRewritten": false,
        "gateViolations": []
      },
      "comparison": {
        "stageChanged": false,
        "confidenceDelta": 0.05,
        "draftIntroducedGateViolations": false,
        "draftIntroducedFactRewrite": false,
        "draftIntroducedReplyRewrite": false
      },
      "evidenceSummary": {
        "tenantId": "chengdu-liujie",
        "policyVersion": "chengdu-liujie:tenant-file:xxxx",
        "conversationEvidence": {
          "candidateMessage": "可以，怎么加微信？",
          "historyTurns": 0
        },
        "candidateEvidence": {
          "fieldNames": []
        },
        "tenantEvidence": {
          "recruiterBinding": {
            "platform": "zhipin",
            "username": "recruiter-alice"
          }
        },
        "jobEvidence": {
          "source": "tenant-brand-config",
          "candidateCount": 0,
          "candidates": []
        }
      },
      "factVerification": {
        "base": {
          "claims": [],
          "blockingIssues": [],
          "nonBlockingIssues": []
        },
        "draft": {
          "claims": [],
          "blockingIssues": [],
          "nonBlockingIssues": []
        }
      },
      "judge": {
        "rubricVersion": "reply-quality-v1",
        "source": "llm",
        "winner": "draft",
        "scores": {
          "goalFit": 5,
          "policyCompliance": 5,
          "factualSafety": 5,
          "toneFit": 4,
          "conversionIntent": 5,
          "candidateExperience": 4,
          "brevity": 5,
          "regressionRisk": 0
        },
        "blockingIssues": [],
        "rationale": "draft 更符合推进目标",
        "recommendedForPublish": true
      }
    }
  ],
  "warnings": []
}
```

`recommendedForPublish` is `true` only when:

- `hardRecommendedForPublish=true`: draft generation succeeds and draft does not
  leave hard gate violations.
- `factRecommendedForPublish=true`: draft does not contain blocking
  contradicted or unsupported facts against the evidence context.
- `judgeRecommendedForPublish=true`: either Judge is disabled, or the frozen
  Judge says primary cases are not worse than base and regression cases are not
  worse than base.

`factVerification.*.nonBlockingIssues` contains warnings that should feed the
Agent's next iteration but do not flip `factRecommendedForPublish` to `false`.
For example, process-style location wording such as `具体门店我确认后发你` is
reported as a non-blocking location issue instead of a publish blocker.

The Judge cannot override hard-gate or fact-verification failures. The default
rubric file is `data/judge-rubrics/reply-quality-v1.json`.

When `cases[].judge` is present, `cases[].judge.source` tells callers whether
the returned Judge block came from the frozen LLM Judge or a service-side
fallback:

| `source`           | Meaning                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| `llm`              | The frozen LLM Judge ran successfully and produced this result                                   |
| `upstream_blocker` | The LLM Judge was skipped because hard gates or fact verification failed                         |
| `judge_error`      | The service attempted the LLM Judge call, but returned a blocking fallback after the call failed |

#### PUT /tenants/:tenantId/reply-policy

Request body:

```json
{
  "basePolicyVersion": "chengdu-liujie:global-file:xxxx",
  "reason": "优化首轮微信引导话术",
  "policy": {}
}
```

`basePolicyVersion` is required. If it does not match the current effective
policy version, the service returns `409 Conflict` and does not write the file.

#### PATCH /tenants/:tenantId/reply-policy

Request body:

```json
{
  "basePolicyVersion": "chengdu-liujie:tenant-file:xxxx",
  "reason": "优化首轮微信引导话术",
  "patch": {
    "persona": {
      "tone": "更直接"
    }
  }
}
```

Patch semantics:

- objects recursively merge
- arrays, strings, numbers, booleans, and `null` replace the existing value
- `null` does not mean delete; it must still pass `ReplyPolicyConfigSchema`

#### DELETE /tenants/:tenantId/reply-policy

Request body:

```json
{
  "basePolicyVersion": "chengdu-liujie:tenant-file:xxxx",
  "reason": "回退到全局策略"
}
```

Deletes only `data/tenants/<tenantId>/reply-policy.json`. The response returns
the new effective global/default policy.

#### Policy Lint

The service rejects writes and validation requests when:

- `hardConstraints.rules` is empty
- `industryVoices` does not contain `defaultIndustryVoiceId`
- `outputGuards.maxQuestionsByMode.minimal` is greater than `3`
- `outputGuards.maxQuestionsByMode.focused` is greater than `3`

The service returns a warning, but does not reject, when `factGate.mode` is not
`strict`.

#### Audit

`PUT`, `PATCH`, and `DELETE` append one JSONL record to:

```text
data/tenants/<tenantId>/reply-policy.audit.jsonl
```

Each record includes `tenantId`, `action`, `actor`, `oldPolicyVersion`,
`newPolicyVersion`, `reason`, and `createdAt`. Audit append failure blocks the
policy write; if append fails after a local policy change, the service restores
the previous tenant-local policy state before returning the error.

---

### GET /admin/status

Return a redacted runtime summary for the TUI and other local admin tools.

**Auth**: Admin token only

**Rate limit**: Yes

This endpoint never returns raw tokens, API keys, PEM private keys, or provider
secret values. Provider fields are boolean readiness flags only.

#### Response (200)

```json
{
  "version": "0.2.0",
  "uptimeSec": 123.45,
  "nodeVersion": "v22.15.0",
  "keyId": "reply-signing-key-2026-04",
  "envelopeTtlSec": 300,
  "rateLimit": {
    "max": 60,
    "windowMs": 60000
  },
  "tenantCache": {
    "ttlMs": 300000,
    "maxSize": 100
  },
  "providers": {
    "alibaba": { "configured": false },
    "anthropic": { "configured": true },
    "dashscope": { "configured": false },
    "deepseek": { "configured": false },
    "duliday": { "configured": true },
    "gemini": { "configured": false },
    "moonshot": { "configured": false },
    "openai": { "configured": false }
  },
  "brandSync": {
    "enabled": true,
    "dailyTime": "03:30",
    "timezone": "Asia/Shanghai",
    "concurrency": 1,
    "historyLimit": 100,
    "runOnStart": false
  },
  "tenantSummary": {
    "total": 4,
    "ready": 3,
    "created": 1,
    "disabled": 0,
    "localPolicyCount": 2
  }
}
```

If a client token calls this endpoint, the service returns `403`.

---

### GET /admin/logs

Return recent sanitized runtime logs from the in-process admin ring buffer.

**Auth**: Admin token only

**Rate limit**: Yes

Logs are scrubbed before entering the admin buffer. The response must not
contain bearer tokens, API keys, PEM private keys, prompt/candidate text, stack
details, or other configured secret-like fields.

Query parameters:

| Field   | Type            | Default | Description                               |
| ------- | --------------- | ------- | ----------------------------------------- |
| `limit` | integer 1..1000 | `200`   | Number of most recent log entries to read |

#### Response (200)

```json
{
  "logs": [
    {
      "id": 1,
      "timestamp": "2026-06-01T00:00:00.000Z",
      "level": "info",
      "message": "request completed",
      "line": "2026-06-01T00:00:00.000Z INFO    request completed",
      "fields": {
        "reqId": "req-123",
        "route": "/health"
      }
    }
  ],
  "limit": 200,
  "maxEntries": 500
}
```

If a client token calls this endpoint, the service returns `403`.

---

### GET /admin/logs/stream

Stream sanitized runtime logs as Server-Sent Events. The stream first replays
the most recent `limit` entries, then emits newly appended log entries.

**Auth**: Admin token only

**Rate limit**: Yes

Query parameters are the same as `GET /admin/logs`.

SSE event format:

```text
id: 1
event: log
data: {"id":1,"timestamp":"2026-06-01T00:00:00.000Z","level":"info","message":"request completed","line":"...","fields":{}}
```

The endpoint also sends heartbeat comments:

```text
: keepalive
```

If a client token calls this endpoint, the service returns `403`.

---

### PATCH /admin/log-level

Change the Fastify/Pino runtime log level without restarting the service.

**Auth**: Admin token only

**Rate limit**: Yes

The operation appends a sanitized audit entry to the admin log buffer.
This change is in-memory only; after a process restart, the service starts with
`LOG_LEVEL` again.

#### Request Body

```json
{
  "level": "debug"
}
```

Allowed `level` values: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.

#### Response (200)

```json
{
  "previousLevel": "info",
  "level": "debug",
  "auditLogId": 42
}
```

If a client token calls this endpoint, the service returns `403`.

---

### Tenant-scoped Web UI management

These endpoints are intended for a Web UI/BFF that authenticates registered
users itself, then calls Reply Authority with tenant-bound client tokens. They
never require or expose `SERVICE_AUTH_TOKEN`.

Authorization order:

```text
authenticate
  -> assertTenantAccess(request, tenantId)
  -> requireScope(request, scope)
```

| Method  | Endpoint                                    | Scope                 | Behavior                                       |
| ------- | ------------------------------------------- | --------------------- | ---------------------------------------------- |
| `GET`   | `/tenants`                                  | `tenant-config:read`  | List only tenants visible to the current token |
| `GET`   | `/tenants/:tenantId`                        | `tenant-config:read`  | Return narrow tenant config detail             |
| `PATCH` | `/tenants/:tenantId`                        | `tenant-config:write` | Patch Web UI-safe tenant config fields         |
| `GET`   | `/tenants/:tenantId/brand-config`           | `brand-config:read`   | Return synced brand/store/position summary     |
| `POST`  | `/tenants/:tenantId/brand-config:sync`      | `brand-sync:write`    | Trigger this tenant's brand sync run           |
| `GET`   | `/tenants/:tenantId/brand-sync-runs`        | `brand-sync:read`     | List this tenant's sync run slices             |
| `GET`   | `/tenants/:tenantId/brand-sync-runs/latest` | `brand-sync:read`     | Return latest sync run slice for this tenant   |

#### GET /tenants

Admin tokens return all tenants. Client tokens return only tenants listed in the
token's `tenantIds`.

Response items use the same narrow shape as `GET /tenants/:tenantId`.

#### GET /tenants/:tenantId

```json
{
  "tenantId": "chengdu-liujie",
  "displayName": "成都你六姐",
  "status": "ready",
  "ready": true,
  "syncedAt": "2026-04-13T09:00:00.000Z",
  "hasLocalReplyPolicy": true,
  "manifestRevision": "tenant-manifest-revision",
  "bindings": {
    "zhipinRecruiters": [
      {
        "platform": "zhipin",
        "username": "recruiter-alice"
      }
    ]
  },
  "syncParams": {
    "provider": "duliday",
    "enabled": true,
    "brandAliasList": ["成都你六姐"],
    "cityNames": ["成都市"],
    "preferredDefaultBrandName": "成都你六姐"
  }
}
```

The response intentionally omits platform-level sync fields such as
`jobListUrl`, `brandListUrl`, and `include`.

#### PATCH /tenants/:tenantId

```json
{
  "baseManifestRevision": "tenant-manifest-revision",
  "displayName": "成都你六姐直营",
  "bindings": {
    "zhipinRecruiters": [
      {
        "platform": "zhipin",
        "username": "recruiter-alice"
      }
    ]
  },
  "syncParams": {
    "brandAliasList": ["成都你六姐", "成都六姐"],
    "cityNames": ["成都市"],
    "preferredDefaultBrandName": "成都你六姐"
  }
}
```

Allowed patch fields are `displayName`, `bindings.zhipinRecruiters`,
`syncParams.brandAliasList`, `syncParams.cityNames`, and
`syncParams.preferredDefaultBrandName`.

Tenant-scoped patches explicitly reject `status`, `syncParams.provider`,
`syncParams.enabled`, `syncParams.brandListUrl`, `syncParams.jobListUrl`, and
`syncParams.include` with `400 Bad Request`. A stale `baseManifestRevision`
returns `409 Conflict`. Duplicate `platform + username` recruiter bindings
within or across tenants also return `409 Conflict`.

#### GET /tenants/:tenantId/brand-config

When `brand-config.json` is missing:

```json
{
  "tenantId": "chengdu-liujie",
  "ready": false,
  "syncedAt": null,
  "brands": []
}
```

When synced data exists:

```json
{
  "tenantId": "chengdu-liujie",
  "ready": true,
  "syncedAt": "2026-04-13T09:00:00.000Z",
  "defaultBrandId": "10001",
  "brands": [
    {
      "brandId": "10001",
      "name": "成都你六姐",
      "storeCount": 14,
      "positionCount": 37,
      "cities": ["成都市"]
    }
  ]
}
```

#### POST /tenants/:tenantId/brand-config:sync

Runs a one-tenant manual brand sync through the auditable sync runner and returns
only this tenant's run slice:

```json
{
  "runId": "brand-sync-2026-06-09T00-00-00-000Z-abcd1234",
  "trigger": "manual",
  "status": "success",
  "startedAt": "2026-06-09T00:00:00.000Z",
  "finishedAt": "2026-06-09T00:00:01.000Z",
  "durationMs": 1000,
  "tenantResult": {
    "tenantId": "chengdu-liujie",
    "status": "success",
    "startedAt": "2026-06-09T00:00:00.000Z",
    "finishedAt": "2026-06-09T00:00:01.000Z",
    "durationMs": 1000,
    "source": "duliday",
    "syncedAt": "2026-06-09T00:00:01.000Z",
    "brands": 2,
    "stores": 14,
    "positions": 37,
    "usedJobListUrl": "https://example.com/job-list",
    "brandAliases": ["成都你六姐"]
  }
}
```

`GET /tenants/:tenantId/brand-sync-runs` returns `{ "runs": [...] }` using the
same run-slice shape. It filters persisted run records so no other tenant's
`tenantResults` are returned.

---

### GET /admin/tenants

List all tenant manifests plus effective readiness metadata. This is intended for the Admin Web tenant table.

**Auth**: Admin token only

**Rate limit**: Yes

#### Response (200)

```json
{
  "tenants": [
    {
      "manifest": {
        "tenantId": "chengdu-liujie",
        "displayName": "成都你六姐",
        "status": "ready",
        "bindings": {
          "zhipinRecruiters": [
            {
              "platform": "zhipin",
              "username": "recruiter-alice"
            }
          ]
        },
        "syncParams": {
          "provider": "duliday",
          "enabled": true,
          "jobListUrl": "https://example.com/job-list",
          "brandAliasList": ["成都你六姐"],
          "cityNames": ["成都市"]
        }
      },
      "manifestRevision": "tenant-manifest-revision",
      "status": "ready",
      "ready": true,
      "syncedAt": "2026-04-13T09:00:00.000Z",
      "hasLocalReplyPolicy": true
    }
  ]
}
```

Notes:

- Results are sorted by `tenantId` ascending for stable Admin Web rendering.
- Response items use the same shape as `GET /admin/tenants/:tenantId`.
- If a client token calls this endpoint, the service returns `403`.

---

### POST /admin/tenants

Create a tenant manifest explicitly. This is an admin-only management action and does not create `brand-config.json`.

**Auth**: Admin token only  
**Rate limit**: Yes

#### Request Body

```json
{
  "tenantId": "chengdu-liujie",
  "displayName": "成都你六姐",
  "status": "created",
  "bindings": {
    "zhipinRecruiters": [
      {
        "platform": "zhipin",
        "username": "recruiter-alice",
        "accountId": "optional-account-id"
      }
    ]
  },
  "syncParams": {
    "provider": "duliday",
    "enabled": true,
    "jobListUrl": "https://example.com/job-list",
    "brandAliasList": ["成都你六姐"],
    "cityNames": ["成都市"]
  }
}
```

Notes:

- `status` can be omitted and defaults to `created`
- `status="ready"` is rejected on create with `400 Bad Request`; tenants must become `ready` via successful sync
- `bindings` can be omitted and defaults to `{ "zhipinRecruiters": [] }`
- When `bindings` is provided, each `platform + username` pair must be unique
  across the current tenant and all other tenant manifests. Duplicate recruiter
  usernames return `409 Conflict`.
- `syncParams.brandListUrl` is optional and unused in Phase 1
- The server uses an in-memory per-tenant write lock to prevent duplicate concurrent creates

#### Response (201)

```json
{
  "manifest": {
    "tenantId": "chengdu-liujie",
    "displayName": "成都你六姐",
    "status": "created",
    "bindings": {
      "zhipinRecruiters": [
        {
          "platform": "zhipin",
          "username": "recruiter-alice",
          "accountId": "optional-account-id"
        }
      ]
    },
    "syncParams": {
      "provider": "duliday",
      "enabled": true,
      "jobListUrl": "https://example.com/job-list",
      "brandAliasList": ["成都你六姐"],
      "cityNames": ["成都市"]
    }
  },
  "manifestRevision": "tenant-manifest-revision",
  "status": "created",
  "ready": false,
  "syncedAt": null,
  "hasLocalReplyPolicy": false
}
```

---

### GET /admin/tenants/:tenantId

Query the current tenant manifest plus effective readiness metadata.

**Auth**: Admin token only  
**Rate limit**: Yes

#### Response (200)

```json
{
  "manifest": {
    "tenantId": "chengdu-liujie",
    "displayName": "成都你六姐",
    "status": "ready",
    "bindings": {
      "zhipinRecruiters": [
        {
          "platform": "zhipin",
          "username": "recruiter-alice"
        }
      ]
    }
  },
  "manifestRevision": "tenant-manifest-revision",
  "status": "ready",
  "ready": true,
  "syncedAt": "2026-04-13T09:00:00.000Z",
  "hasLocalReplyPolicy": true
}
```

Field notes:

- `manifest` is the stored tenant manifest
- `manifestRevision` is a server-generated content revision for optimistic
  concurrency on `PATCH /admin/tenants/:tenantId`
- `status` is the effective tenant lifecycle state: `created` | `ready` | `disabled`
- `ready` means `brand-config.json` exists
- `syncedAt` is read from `brand-config.json.meta.syncedAt`
- `hasLocalReplyPolicy` indicates whether `data/tenants/<tenantId>/reply-policy.json` exists

---

### PATCH /admin/tenants/:tenantId

Partially update `displayName`, `syncParams`, `status`, or `bindings`.

**Auth**: Admin token only  
**Rate limit**: Yes

#### Request Body

```json
{
  "baseManifestRevision": "tenant-manifest-revision",
  "displayName": "成都你六姐直营",
  "bindings": {
    "zhipinRecruiters": [
      {
        "platform": "zhipin",
        "username": "recruiter-alice"
      }
    ]
  },
  "syncParams": {
    "include": {
      "includeJobSalary": true
    }
  }
}
```

Notes:

- `baseManifestRevision` is optional. When provided, the server compares it
  with the current tenant manifest revision under the tenant write lock before
  writing. A mismatch returns `409 Conflict` and no manifest update is written.
- `syncParams` uses deep merge semantics; omitted fields are preserved
- `bindings` uses replacement semantics; when present, the whole `bindings` object is replaced
- `bindings.zhipinRecruiters` can be an empty array
- When `bindings` is present, each `platform + username` pair must be unique
  within the current tenant and across other tenants; duplicate recruiter
  usernames return `409 Conflict`.
- When `bindings` is omitted, the service does not scan historical duplicate
  bindings. This lets admins patch `syncParams` or `status` even if old runtime
  data still contains duplicate recruiter usernames.
- `status=ready` is rejected unless tenant brand data already exists
- `status=created` is rejected after brand data exists

#### Response (200)

Response shape is the same as `GET /admin/tenants/:tenantId`.

#### Errors

- `400 Bad Request` — invalid patch body or invalid lifecycle transition.
- `404 Not Found` — tenant manifest does not exist.
- `409 Conflict` — submitted `bindings.zhipinRecruiters[]` contains a
  duplicate `platform + username` in the same tenant or another tenant, or
  `baseManifestRevision` no longer matches the current tenant manifest.

---

### POST /admin/recruiter-bindings:move

Move one Zhipin recruiter binding from one tenant to another in a single
admin-only operation. Callers use the single-colon URL shown here; the Fastify
route is registered internally as `"/admin/recruiter-bindings::move"` so the
literal action suffix is not parsed as a path parameter.

**Auth**: Admin token only  
**Rate limit**: Yes

#### Request Body

```json
{
  "sourceTenantId": "tenant-a",
  "targetTenantId": "tenant-b",
  "binding": {
    "platform": "zhipin",
    "username": "recruiter-alice",
    "accountId": "optional-account-id"
  },
  "sourceBaseManifestRevision": "source-tenant-manifest-revision",
  "targetBaseManifestRevision": "target-tenant-manifest-revision"
}
```

Notes:

- `sourceTenantId` and `targetTenantId` must be different.
- Both `sourceBaseManifestRevision` and `targetBaseManifestRevision` are
  required. Either mismatch returns `409 Conflict` and no intended move is
  written.
- The source tenant must contain exactly one matching `platform + username`.
  If `binding.accountId` is provided, it must also match the stored source
  binding.
- The moved binding is the canonical binding stored in the source tenant. If
  the request omits `accountId` but the stored binding has one, the target
  tenant receives the stored `accountId`.
- The target tenant and every other tenant must not already contain the same
  `platform + username`.

#### Response (200)

```json
{
  "sourceTenant": {
    "manifest": {
      "tenantId": "tenant-a",
      "status": "created",
      "bindings": {
        "zhipinRecruiters": []
      }
    },
    "manifestRevision": "new-source-tenant-manifest-revision",
    "status": "created",
    "ready": false,
    "syncedAt": null,
    "hasLocalReplyPolicy": false
  },
  "targetTenant": {
    "manifest": {
      "tenantId": "tenant-b",
      "status": "created",
      "bindings": {
        "zhipinRecruiters": [
          {
            "platform": "zhipin",
            "username": "recruiter-alice",
            "accountId": "optional-account-id"
          }
        ]
      }
    },
    "manifestRevision": "new-target-tenant-manifest-revision",
    "status": "created",
    "ready": false,
    "syncedAt": null,
    "hasLocalReplyPolicy": false
  },
  "movedBinding": {
    "platform": "zhipin",
    "username": "recruiter-alice",
    "accountId": "optional-account-id"
  }
}
```

#### Errors

- `400 Bad Request` — invalid body or identical source and target tenant ids.
- `403 Forbidden` — caller is not an admin token.
- `404 Not Found` — source tenant, target tenant, or source recruiter binding
  does not exist.
- `409 Conflict` — source or target manifest revision is stale; source tenant
  has duplicate matching recruiter bindings; `accountId` does not match the
  stored source binding; or the target/another tenant already has the same
  `platform + username`.

#### After a move: downstream impact

After a successful move the binding lives only in the target tenant. Reply
generation resolves the reply policy and brand data from the `tenantId` that the
caller sends to `POST /generate-signed-reply`, not from the recruiter username
directly. To pick up the new tenant automatically, downstream callers must
re-resolve the tenant by username (via `POST /resolve-recruiter-binding`, or by
sending only `recruiterUsername` so the client resolves it) on each request —
this is what the roll-agent smart-reply / browser-use flow already does, so it is
self-healing across a move.

Do **not** cache or persist a tenant id and reuse it after a move. A stale
tenant id fails fast rather than silently using the old tenant's policy:

- Sending the old `tenantId` together with the `recruiterBinding` returns
  `403 Forbidden` (`recruiterBinding 与 tenantId 不匹配`), because the binding no
  longer belongs to that tenant.
- Sending the old `tenantId` with only a username makes the reply-authority
  client raise a `tenantId` mismatch error when the resolved tenant differs.

---

### DELETE /admin/tenants/:tenantId

Delete a tenant and its entire `data/tenants/<tenantId>/` directory, including
`tenant.json`, `brand-config.json`, tenant-local `reply-policy.json`, and audit
files. This action cannot be undone.

**Auth**: Admin token only  
**Rate limit**: Yes

#### Path Params

| Param      | Type   | Description       |
| ---------- | ------ | ----------------- |
| `tenantId` | string | Tenant identifier |

#### Response (200)

```json
{
  "tenantId": "chengdu-liujie",
  "deleted": true
}
```

#### Errors

- `404 Not Found` — tenant manifest does not exist.
- `403 Forbidden` — client token (non-admin) callers.

---

### POST /admin/tenants/:tenantId/brand-config:sync

Trigger tenant-scoped Duliday sync on the server side. The service reads `data/tenants/<tenantId>/tenant.json`, uses shared Duliday credentials, and atomically refreshes `brand-config.json`.

**Auth**: Admin token only  
**Rate limit**: Yes

#### Path Params

| Param      | Type   | Description       |
| ---------- | ------ | ----------------- |
| `tenantId` | string | Tenant identifier |

#### Response (200)

```json
{
  "tenantId": "chengdu-liujie",
  "source": "duliday",
  "syncedAt": "2026-04-13T09:00:00.000Z",
  "brands": 2,
  "stores": 14,
  "positions": 37,
  "usedJobListUrl": "https://example.com/job-list",
  "brandAliases": ["成都你六姐"]
}
```

Notes:

- Same-tenant concurrent sync requests are merged by an in-memory inflight lock.
- Sync will promote tenant status from `created` to `ready` after a successful write.
- If a client token calls this endpoint, the service returns `403`.
- Error responses do not expose whether another tenant exists for non-admin callers.
- `jobListUrl` is the only Duliday endpoint consumed in Phase 1. `brandListUrl` stays optional for future expansion.
- Duliday Sponge 2.0 keeps the API path as `/ai/api/job/list`; configure the production base URL through `DULIDAY_JOB_LIST_URL`.

---

### POST /admin/brand-sync-runs

Trigger an auditable brand sync batch. This endpoint can sync all tenants, or a
selected subset when `tenantIds` is provided. It uses each tenant's own
`syncParams`; disabled tenants or tenants without enabled sync configuration are
recorded as `skipped`.

**Auth**: Admin token only  
**Rate limit**: Yes

#### Request Body

```json
{
  "tenantIds": ["chengdu-liujie"]
}
```

`tenantIds` is optional. Omit it to scan all tenant manifests under
`data/tenants/`.

#### Response (200)

```json
{
  "runId": "brand-sync-2026-05-30T19-30-00-000Z-a1b2c3d4",
  "trigger": "manual",
  "status": "partial_failed",
  "startedAt": "2026-05-30T19:30:00.000Z",
  "finishedAt": "2026-05-30T19:31:25.000Z",
  "durationMs": 85000,
  "totalTenants": 3,
  "successCount": 1,
  "failedCount": 1,
  "skippedCount": 1,
  "totals": {
    "brands": 2,
    "stores": 14,
    "positions": 37
  },
  "tenantResults": [
    {
      "tenantId": "chengdu-liujie",
      "status": "success",
      "startedAt": "2026-05-30T19:30:00.000Z",
      "finishedAt": "2026-05-30T19:30:20.000Z",
      "durationMs": 20000,
      "source": "duliday",
      "syncedAt": "2026-05-30T19:30:20.000Z",
      "brands": 2,
      "stores": 14,
      "positions": 37,
      "usedJobListUrl": "https://example.com/job-list",
      "brandAliases": ["成都你六姐"]
    },
    {
      "tenantId": "disabled-tenant",
      "status": "skipped",
      "reason": "tenant_disabled",
      "startedAt": "2026-05-30T19:30:20.000Z",
      "finishedAt": "2026-05-30T19:30:20.000Z",
      "durationMs": 0
    },
    {
      "tenantId": "misconfigured-tenant",
      "status": "failed",
      "startedAt": "2026-05-30T19:30:20.000Z",
      "finishedAt": "2026-05-30T19:30:21.000Z",
      "durationMs": 1000,
      "errorType": "TenantConfigError",
      "errorMessage": "Missing shared DULIDAY_TOKEN"
    }
  ]
}
```

Notes:

- `status="success"` means the batch completed with no failed tenants. It can
  still include skipped tenants.
- `status="partial_failed"` means at least one tenant failed and at least one
  tenant succeeded or was skipped.
- `status="failed"` means every tenant attempted in the batch failed.
- `status="stale_running"` means the service found a previous `running` record
  during startup and closed it as incomplete. The response includes run-level
  `errorType` / `errorMessage`.
- If another batch run is active, the endpoint returns `409 Conflict`.

---

### GET /admin/brand-sync-runs

List persisted brand sync batch records.

**Auth**: Admin token only  
**Rate limit**: Yes

#### Query Params

| Param   | Type    | Default | Description                     |
| ------- | ------- | ------- | ------------------------------- |
| `limit` | integer | `20`    | Number of recent runs to return |

#### Response (200)

```json
{
  "runs": [
    {
      "runId": "brand-sync-2026-05-30T19-30-00-000Z-a1b2c3d4",
      "trigger": "scheduled",
      "status": "success",
      "startedAt": "2026-05-30T19:30:00.000Z",
      "finishedAt": "2026-05-30T19:31:00.000Z",
      "durationMs": 60000,
      "totalTenants": 2,
      "successCount": 2,
      "failedCount": 0,
      "skippedCount": 0,
      "totals": {
        "brands": 4,
        "stores": 28,
        "positions": 74
      },
      "tenantResults": []
    }
  ]
}
```

---

### GET /admin/brand-sync-runs/latest

Return the latest persisted brand sync run.

**Auth**: Admin token only  
**Rate limit**: Yes

Returns `404 Not Found` when no sync run record exists.

---

### GET /admin/brand-sync-runs/:runId

Return one persisted brand sync run by ID.

**Auth**: Admin token only  
**Rate limit**: Yes

Returns `404 Not Found` when the requested run ID does not exist.

---

### POST /verify-reply

Verify a signed envelope's signature, expiration, and payload integrity.

**Auth**: Required  
**Rate limit**: Yes

#### Request Body

```json
{
  "signedEnvelope": "eyJ2Ijoy...base64url.signatureBase64url"
}
```

#### Response (200) — Valid

```json
{
  "valid": true,
  "payload": {
    "v": 2,
    "iss": "reply-authority-service",
    "kid": "reply-signing-key-2026-04",
    "jti": "550e8400-e29b-41d4-a716-446655440000",
    "iat": 1712736300,
    "exp": 1712736600,
    "aud": "browser-use-agent/zhipin_send_reply",
    "platform": "zhipin",
    "tenantId": "tenant-001",
    "conversationId": "conv-abc",
    "candidateId": "cand-xyz",
    "reply": "感谢你的关注！...",
    "policyVersion": "chengdu-liujie:tenant-file:6B4i7wX5fX2Oa4A8",
    "recruiterBinding": {
      "platform": "zhipin",
      "username": "recruiter-alice"
    }
  }
}
```

#### Response (200) — Invalid

```json
{
  "valid": false,
  "error": "Envelope expired"
}
```

Possible error messages:

- `"Invalid signed envelope format"` — not a valid `payload.signature` compact string
- `"Signature verification failed"` — Ed25519 signature does not match payload
- `"Envelope payload schema validation failed"` — payload JSON missing required fields
- `"Unknown key ID: ..."` — `kid` does not match the server's current key
- `"Unknown issuer: ..."` — `iss` is not `reply-authority-service`
- `"Unexpected audience: ..."` / `"Unexpected platform: ..."` — bound fields mismatch
- `"Envelope expiry must be after issue time"` — `exp <= iat`
- `"Envelope expired"` — `exp < now - 60s`
- `"Envelope issued in the future"` — `iat > now + 60s`

---

### GET /health

Health check endpoint. No authentication required.

#### Response (200)

```json
{
  "status": "ok",
  "timestamp": "2026-04-10T12:00:00.000Z"
}
```

---

### GET /.well-known/reply-authority-keys

Public key distribution endpoint. No authentication required.

browser-use-agent fetches public keys from this endpoint to verify envelopes locally.

#### Response (200)

```json
{
  "keys": [
    {
      "kid": "reply-signing-key-2026-04",
      "algorithm": "Ed25519",
      "publicKey": "MCowBQYDK2Vw...base64url",
      "validFrom": "2026-04-10T12:00:00.000Z"
    }
  ]
}
```

| Field        | Type               | Description                                         |
| ------------ | ------------------ | --------------------------------------------------- |
| `kid`        | string             | Key identifier — matches `kid` in envelope payloads |
| `algorithm`  | `"Ed25519"`        | Always Ed25519                                      |
| `publicKey`  | string             | SPKI DER public key, base64url encoded              |
| `validFrom`  | string (ISO 8601)  | Server start time when this key became active       |
| `validUntil` | string (ISO 8601)? | Optional retirement time for rotated keys           |

---

## Signed Envelope Format

The `signedEnvelope` returned by `/generate-signed-reply` is a compact two-part string:

```
base64url(JSON.stringify(payload)) . base64url(Ed25519Signature)
```

The two parts are separated by a `.` (period). This is **not** JWT — it is a simpler custom format.

### Decoding

```js
const [payloadBase64, signatureBase64] = signedEnvelope.split(".");
const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf-8");
const payload = JSON.parse(payloadJson);
```

### Verification

```js
import { verify, createPublicKey } from "node:crypto";

const publicKeyDer = Buffer.from(publicKeyBase64url, "base64url");
const publicKey = createPublicKey({
  key: publicKeyDer,
  type: "spki",
  format: "der",
});

const isValid = verify(
  null,
  Buffer.from(payloadJson, "utf-8"),
  publicKey,
  Buffer.from(signatureBase64, "base64url"),
);
```

### Payload Fields

| Field                        | Type                                    | Description                                   |
| ---------------------------- | --------------------------------------- | --------------------------------------------- |
| `v`                          | `2`                                     | Envelope schema version                       |
| `iss`                        | `"reply-authority-service"`             | Issuer identifier                             |
| `kid`                        | string                                  | Signing key identifier (for key rotation)     |
| `jti`                        | UUID                                    | Unique envelope ID (for replay prevention)    |
| `iat`                        | integer                                 | Issued-at (Unix seconds)                      |
| `exp`                        | integer                                 | Expiration (Unix seconds, default: iat + 300) |
| `aud`                        | `"browser-use-agent/zhipin_send_reply"` | Authorized consumer tool                      |
| `platform`                   | `"zhipin"`                              | Target platform                               |
| `tenantId`                   | string                                  | Tenant ID — bound at signing                  |
| `conversationId`             | string                                  | Conversation ID — bound at signing            |
| `candidateId`                | string                                  | Candidate ID — bound at signing               |
| `reply`                      | string                                  | The actual reply text to send                 |
| `policyVersion`              | string                                  | Reply policy version used for generation      |
| `recruiterBinding`           | object                                  | Recruiter identity bound at signing           |
| `recruiterBinding.platform`  | `"zhipin"`                              | Recruiter platform                            |
| `recruiterBinding.username`  | string                                  | Recruiter username                            |
| `recruiterBinding.accountId` | string?                                 | Optional stronger recruiter identifier        |

### Security Properties

- **Reply binding**: `reply` is inside the signed payload — cannot be substituted
- **Target binding**: `conversationId` + `candidateId` prevent cross-session replay
- **Recruiter binding**: `recruiterBinding` prevents an envelope issued for recruiter A from being reused under recruiter B
- **One-time use**: `jti` enables consumer-side replay prevention
- **Time-limited**: `exp` with 60s clock skew tolerance
- **Non-forgeable**: Ed25519 private key never leaves the server

---

## Error Response Format

All error responses follow a consistent format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "body/candidateMessage must NOT have fewer than 1 characters"
}
```

| Status | When                                                                                                                                                                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400    | Request validation failure (missing/invalid fields, tenant config error)                                                                                                                                                                                                           |
| 401    | Missing or invalid Bearer token                                                                                                                                                                                                                                                    |
| 403    | Admin access required; tenant disabled (`租户已停用`); client token not bound to requested tenant; `recruiterBinding` and `tenantId` mismatch                                                                                                                                      |
| 404    | Tenant not found; tenant manifest/config unavailable on `/generate-signed-reply`; recruiter not bound on `/resolve-recruiter-binding`                                                                                                                                              |
| 409    | Tenant already exists (duplicate create); tenant not ready (`租户数据未就绪，请先同步品牌数据`); recruiter resolves to multiple tenants; submitted tenant recruiter binding username conflicts with the same tenant or another tenant; submitted tenant manifest revision is stale |
| 429    | Rate limit exceeded                                                                                                                                                                                                                                                                |
| 500    | Internal error (pipeline failure, upstream service error, etc.)                                                                                                                                                                                                                    |

In production (`NODE_ENV=production`), 5xx error messages are replaced with `"Internal Server Error"` to avoid leaking internals.

---

## Usage Examples

### Generate a signed reply

```bash
curl -s -X POST http://localhost:3100/generate-signed-reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_AUTH_TOKEN" \
  -d '{
    "candidateMessage": "你好，请问薪资是多少？",
    "target": {
      "platform": "zhipin",
      "tenantId": "tenant-001",
      "recruiterBinding": {
        "platform": "zhipin",
        "username": "recruiter-alice"
      },
      "conversationId": "conv-abc",
      "candidateId": "cand-xyz"
    }
  }' | jq .
```

### Stream a signed reply

```bash
curl -N -X POST http://localhost:3100/generate-signed-reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_AUTH_TOKEN" \
  -d '{
    "stream": true,
    "candidateMessage": "你好，请问薪资是多少？",
    "target": {
      "platform": "zhipin",
      "tenantId": "tenant-001",
      "recruiterBinding": {
        "platform": "zhipin",
        "username": "recruiter-alice"
      },
      "conversationId": "conv-abc",
      "candidateId": "cand-xyz"
    }
  }'
```

### Resolve recruiter binding

```bash
curl -s -X POST http://localhost:3100/resolve-recruiter-binding \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_AUTH_TOKEN" \
  -d '{
    "platform": "zhipin",
    "username": "recruiter-alice"
  }' | jq .
```

### Verify an envelope

```bash
curl -s -X POST http://localhost:3100/verify-reply \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_AUTH_TOKEN" \
  -d '{
    "signedEnvelope": "eyJ2Ijoy...base64url.signatureBase64url"
  }' | jq .
```

### Health check

```bash
curl -s http://localhost:3100/health | jq .
```

### Fetch public keys

```bash
curl -s http://localhost:3100/.well-known/reply-authority-keys | jq .
```
