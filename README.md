# Roll Site

Roll 官网页面，使用 Next.js App Router 和静态 AI 助手展示数据。

## 本地开发

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm check
```

## 部署配置

本项目使用本地脚本构建 Docker 镜像包，并上传到部署服务器。部署服务器配置放在
`deploy.env.local`，该文件已被 `.gitignore` 忽略。

```bash
DEPLOY_SERVER_USER=haimian-deploy
DEPLOY_SERVER_HOST=8.136.14.2
DEPLOY_SERVER_PORT=63452
DEPLOY_REMOTE_DIR=/data/roll-website
DEPLOY_OUTPUT_DIR=./docker-images
ROLL_WEBSITE_REMOTE_DIR=/data/roll-website
ROLL_WEBSITE_OUTPUT_DIR=./docker-images
```

`release.sh` 和 `deploy.sh` 默认优先读取当前目录的 `deploy.env.local`；如果不存在，会回退读取
`/Users/gt/yc/HM2.0/deploy.env.local`。

## 服务器 Compose 配置

服务器目录为 `/data/roll-website`。该目录需要存在 `docker-compose.yaml`：

```yaml
services:
  app:
    image: roll-website:latest
    container_name: roll-website
    restart: always
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - PORT=3000
      - HOSTNAME=0.0.0.0
    ports:
      - "3004:3000"
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

该站点不区分测试/生产环境，不需要 `env_file`，也不需要 `.env.staging` 或 `.env.production`。

## 发布流程

一键构建、上传并部署到服务器：

```bash
pnpm deploy:server
```

`pnpm deploy:server` 会按顺序执行：

1. `release.sh`：构建 Docker 镜像、导出压缩包并上传到服务器。
2. `deploy.sh`：在服务器加载最新镜像并重启 `docker compose` 服务。

也可以单独执行两个阶段。

## CI/CD 自动部署

`.github/workflows/deploy.yml` 会在 `main` 分支收到新提交时自动执行部署。也就是说，PR merge 到
`main` 后会触发：

```text
push main
  -> GitHub Actions
  -> pnpm deploy:server
  -> release.sh
  -> deploy.sh
```

GitHub Actions 需要配置以下 Repository Secrets：

```bash
DEPLOY_SERVER_USER=haimian-deploy
DEPLOY_SERVER_HOST=8.136.14.2
DEPLOY_SERVER_PORT=63452
DEPLOY_SSH_PRIVATE_KEY=<用于登录服务器的 SSH 私钥>
DEPLOY_SSH_KNOWN_HOSTS=<服务器 SSH host key>
ROLL_WEBSITE_REMOTE_DIR=/data/roll-website
```

`DEPLOY_SSH_KNOWN_HOSTS` 可以在可信网络下通过以下命令生成：

```bash
ssh-keyscan -p 63452 8.136.14.2
```

自动部署和本地部署复用同一个入口：`pnpm deploy:server`。

本地构建镜像并上传到服务器：

```bash
cd /Users/gt/baigei/dashboard
./release.sh
```

`release.sh` 会执行：

- 构建 `roll-website:YYYYMMDDHHMMSS` 和 `roll-website:latest`
- 导出 `./docker-images/roll-website-YYYYMMDDHHMMSS.tar.gz`
- 生成本地 `.md5`
- 上传镜像包到 `/data/roll-website`

部署服务器上最新上传的镜像：

```bash
cd /Users/gt/baigei/dashboard
./deploy.sh
```

`deploy.sh` 会通过 SSH 在服务器执行：

```bash
cd /data/roll-website
IMAGE_FILE=$(ls roll-website-*.tar.gz | sort | tail -n 1)
gunzip -c "$IMAGE_FILE" | docker load
docker compose -f docker-compose.yaml up -d --force-recreate
docker compose -f docker-compose.yaml ps
```

访问地址：

```text
http://服务器IP:3004
```
