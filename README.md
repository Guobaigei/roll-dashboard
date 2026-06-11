# Roll Dashboard

Roll 官网与运营后台单体项目，使用 Next.js App Router。首页公开展示 Roll Agent
能力，登录/注册后进入 `/operator` 后台入口。

当前后台能力：

- 自建手机号/密码登录注册
- 多客户端令牌加密保存
- 按客户端令牌授权范围和 Boss 用户名绑定过滤租户
- 查看并编辑租户安全配置字段：显示名、Boss 绑定、品牌别名、城市、默认品牌

## 本地开发

```bash
pnpm install
pnpm db:generate
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm check
```

## 环境变量

复制 `.env.example` 为 `.env.local` 后填写：

```bash
DATABASE_URL=
DIRECT_URL=
AUTH_SESSION_SECRET=
TOKEN_ENCRYPTION_KEY=
REPLY_AUTHORITY_BASE_URL=
```

认证使用 `DATABASE_URL`、`DIRECT_URL`、`AUTH_SESSION_SECRET`。客户端令牌与租户配置功能使用
`TOKEN_ENCRYPTION_KEY` 和 `REPLY_AUTHORITY_BASE_URL`。

数据库通过 Prisma 管理：

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:studio
```

## 部署配置

本项目使用本地脚本构建 Docker 镜像包，并上传到部署服务器。部署服务器配置放在
`deploy.env.local`，该文件已被 `.gitignore` 忽略。

```bash
DEPLOY_SERVER_USER=<deploy-user>
DEPLOY_SERVER_HOST=<server-host-or-ip>
DEPLOY_SERVER_PORT=<ssh-port>
DEPLOY_REMOTE_DIR=<remote-app-dir>
DEPLOY_OUTPUT_DIR=./docker-images
ROLL_WEBSITE_REMOTE_DIR=<remote-app-dir>
ROLL_WEBSITE_OUTPUT_DIR=./docker-images
```

`release.sh` 和 `deploy.sh` 默认读取当前目录的 `deploy.env.local`。也可以通过
`DEPLOY_CONFIG_FILE=/path/to/deploy.env.local` 指定其他配置文件。

## 服务器 Compose 配置

服务器部署目录需要存在 `docker-compose.yaml`：

```yaml
services:
  app:
    image: roll-website:latest
    container_name: roll-website
    restart: always
    env_file:
      - .env.local
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - PORT=3000
      - HOSTNAME=0.0.0.0
    ports:
      - "<public-port>:3000"
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

服务器部署目录需要提供 `.env.local`，用于注入数据库连接和 session secret。

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
DEPLOY_SERVER_USER=<deploy-user>
DEPLOY_SERVER_HOST=<server-host-or-ip>
DEPLOY_SERVER_PORT=<ssh-port>
DEPLOY_SSH_PRIVATE_KEY=<用于登录服务器的 SSH 私钥>
DEPLOY_SSH_KNOWN_HOSTS=<服务器 SSH host key>
ROLL_WEBSITE_REMOTE_DIR=<remote-app-dir>
```

`DEPLOY_SSH_KNOWN_HOSTS` 可以在可信网络下通过以下命令生成：

```bash
ssh-keyscan -p <ssh-port> <server-host-or-ip>
```

自动部署和本地部署复用同一个入口：`pnpm deploy:server`。

本地构建镜像并上传到服务器：

```bash
cd /path/to/roll-dashboard
./release.sh
```

`release.sh` 会执行：

- 构建 `roll-website:YYYYMMDDHHMMSS` 和 `roll-website:latest`
- 导出 `./docker-images/roll-website-YYYYMMDDHHMMSS.tar.gz`
- 生成本地 `.md5`
- 上传镜像包到 `ROLL_WEBSITE_REMOTE_DIR`

部署服务器上最新上传的镜像：

```bash
cd /path/to/roll-dashboard
./deploy.sh
```

`deploy.sh` 会通过 SSH 在服务器执行：

```bash
cd "$ROLL_WEBSITE_REMOTE_DIR"
IMAGE_FILE=$(ls roll-website-*.tar.gz | sort | tail -n 1)
gunzip -c "$IMAGE_FILE" | docker load
docker compose -f docker-compose.yaml up -d --force-recreate
docker compose -f docker-compose.yaml ps
```

访问地址：

```text
http://<server-host-or-domain>:<public-port>
```
