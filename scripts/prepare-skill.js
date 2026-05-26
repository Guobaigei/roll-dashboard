import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localPath = path.resolve(__dirname, "../../nano-agent/openclaw-roll-core-skill-template");
const publicDir = path.resolve(__dirname, "../public");
const zipDest = path.resolve(publicDir, "openclaw-roll-core-skill-latest.zip");

// Ensure public directory exists
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 核心解耦思想：
// 1. 如果本地存在 nano-agent，说明是开发负责人环境，直接利用纯 JS 跨平台 zip 模块更新公共目录下的压缩包。
// 2. 如果本地不存在，说明是他人 clone 开发或 Docker / 云端 CI 构建，不执行任何操作。直接复用已提交暂存的 zip。
// 3. 彻底解除对外部 GitHub 拉取、CURL、unzip CLI 以及大陆网络状况的依赖，实现 100% 离线、健壮的 Docker 独立构建。

if (fs.existsSync(localPath)) {
  console.log(
    "[roll-dashboard] 检测到本地 nano-agent。正在通过 Node.js archiver 自动同步并压缩最新 Skill 模板...",
  );

  // 动态导入纯 ESM 架构下的 archiver
  const archiverModule = await import("archiver");

  // 采用流式、零系统指令依赖的 JS zip 机制
  const output = fs.createWriteStream(zipDest);

  // 在 ESM 的 Archiver 8 中，我们直接 new 导出的 ZipArchive 类
  const archive = new archiverModule.ZipArchive({ zlib: { level: 9 } });

  output.on("close", () => {
    console.log(
      `[roll-dashboard] 同步成功：最新 Skill 模板已自动打包，体积：${(archive.pointer() / 1024).toFixed(2)} KB.`,
    );
  });

  archive.on("error", (err) => {
    console.error("[roll-dashboard] 压缩失败:", err);
  });

  archive.pipe(output);
  archive.directory(localPath, false);
  await archive.finalize();
} else {
  console.log(
    "[roll-dashboard] 本地未检测到 nano-agent 开发环境。跳过自动热压缩，将直接加载 public 目录下已暂存的最新 Skill 模板包。",
  );
}
