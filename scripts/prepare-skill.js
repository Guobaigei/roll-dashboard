import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localPath = path.resolve(__dirname, "../../nano-agent/openclaw-roll-core-skill-template");
const publicDir = path.resolve(__dirname, "../public");
const zipDest = path.resolve(publicDir, "openclaw-roll-core-skill-latest.zip");
const versionFileDest = path.resolve(publicDir, "roll-versions.json");

const npmRegistryBaseUrl = "https://registry.npmjs.org";
const configuredVersionFetchTimeoutMs = Number.parseInt(
  process.env.ROLL_DASHBOARD_VERSION_FETCH_TIMEOUT_MS ?? "5000",
  10,
);
const versionFetchTimeoutMs =
  Number.isFinite(configuredVersionFetchTimeoutMs) && configuredVersionFetchTimeoutMs > 0
    ? configuredVersionFetchTimeoutMs
    : 5000;

const packageSources = {
  core: {
    defaultVersion: "0.9.0",
    localPackageJson: path.resolve(__dirname, "../../nano-agent/packages/core/package.json"),
    packageName: "@roll-agent/core",
  },
  browserUse: {
    defaultVersion: "0.15.0",
    localPackageJson: path.resolve(__dirname, "../../nano-agent/agents/browser-use/package.json"),
    packageName: "@roll-agent/browser-use-agent",
  },
  smartReply: {
    defaultVersion: "1.2.5",
    localPackageJson: path.resolve(__dirname, "../../nano-agent/agents/smart-reply/package.json"),
    packageName: "@roll-agent/smart-reply-agent",
  },
};

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

function formatError(err) {
  return err instanceof Error ? err.message : String(err);
}

function isVersionString(value) {
  return typeof value === "string" && /^[0-9][0-9A-Za-z.+-]*$/.test(value);
}

function readJsonFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.warn(`[roll-dashboard] ${label} 不是有效 JSON，已忽略:`, formatError(err));
    return null;
  }
}

function extractManifestVersions(json) {
  const versions = {};

  if (!json || typeof json !== "object") {
    return versions;
  }

  for (const key of Object.keys(packageSources)) {
    const value = json[key];
    if (isVersionString(value)) {
      versions[key] = value;
    }
  }

  return versions;
}

function defaultVersions() {
  return Object.fromEntries(
    Object.entries(packageSources).map(([key, source]) => [key, source.defaultVersion]),
  );
}

function readExistingVersionManifest() {
  return extractManifestVersions(readJsonFile(versionFileDest, "版本缓存文件"));
}

function readLocalPackageVersion(key, source) {
  const json = readJsonFile(source.localPackageJson, `${source.packageName} 本地 package.json`);
  const version = json?.version;

  if (!isVersionString(version)) {
    return null;
  }

  console.log(`[roll-dashboard] 使用本地 ${source.packageName} 版本: ${version}`);
  return [key, version];
}

function npmLatestUrl(packageName) {
  return `${npmRegistryBaseUrl}/${encodeURIComponent(packageName)}/latest`;
}

async function fetchNpmPackageVersion(key, source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), versionFetchTimeoutMs);

  try {
    const response = await fetch(npmLatestUrl(source.packageName), {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    const version = json?.version;

    if (!isVersionString(version)) {
      throw new Error("响应中缺少有效 version 字段");
    }

    console.log(`[roll-dashboard] 使用 npm ${source.packageName} latest 版本: ${version}`);
    return [key, version];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchNpmVersionsForMissingKeys(keys) {
  if (keys.length === 0) {
    return {};
  }

  console.log("[roll-dashboard] 正在向 npm registry 同步缺失的版本号...");

  const entries = await Promise.allSettled(
    keys.map((key) => fetchNpmPackageVersion(key, packageSources[key])),
  );

  const versions = {};

  for (const result of entries) {
    if (result.status === "fulfilled") {
      const [key, version] = result.value;
      versions[key] = version;
      continue;
    }

    console.warn(
      "[roll-dashboard] npm 版本号获取失败，保留现有兜底值:",
      formatError(result.reason),
    );
  }

  return versions;
}

async function resolveLatestVersions() {
  const versions = {
    ...defaultVersions(),
    ...readExistingVersionManifest(),
  };
  const localVersions = Object.fromEntries(
    Object.entries(packageSources)
      .map(([key, source]) => readLocalPackageVersion(key, source))
      .filter(Boolean),
  );

  Object.assign(versions, localVersions);

  const missingLocalKeys = Object.keys(packageSources).filter((key) => !localVersions[key]);
  const npmVersions = await fetchNpmVersionsForMissingKeys(missingLocalKeys);

  return {
    ...versions,
    ...npmVersions,
  };
}

async function writeVersionManifest() {
  const versions = await resolveLatestVersions();
  fs.writeFileSync(versionFileDest, `${JSON.stringify(versions, null, 2)}\n`, "utf8");
  console.log("[roll-dashboard] 成功导出静态版本号映射:", versions);
}

async function runPackager() {
  if (!fs.existsSync(localPath)) {
    console.log(
      "[roll-dashboard] 本地未检测到 nano-agent 开发环境。跳过自动热压缩，将直接加载 public 目录下已暂存的最新 Skill 模板包。",
    );
    return;
  }

  console.log(
    "[roll-dashboard] 检测到本地 nano-agent。正在通过 Node.js archiver 自动同步并压缩最新 Skill 模板...",
  );

  const archiverModule = await import("archiver");
  const archive = new archiverModule.ZipArchive({ zlib: { level: 9 } });
  const output = fs.createWriteStream(zipDest);

  const outputClosed = new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(output);
  archive.directory(localPath, false);

  await archive.finalize();
  await outputClosed;

  console.log(
    `[roll-dashboard] 同步成功：最新 Skill 模板已自动打包，体积：${(archive.pointer() / 1024).toFixed(2)} KB.`,
  );
}

async function main() {
  await writeVersionManifest();
  await runPackager();
}

main().catch((err) => {
  console.error("[roll-dashboard] 构建预准备脚本执行崩溃:", err);
  process.exit(1);
});
