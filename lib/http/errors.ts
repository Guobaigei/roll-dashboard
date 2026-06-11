export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "请先登录") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "无权限访问该资源") {
    super(403, "FORBIDDEN", message);
  }
}

export class ConfigError extends AppError {
  constructor(message: string) {
    super(500, "CONFIG_ERROR", message);
  }
}

export class UpstreamHttpError extends AppError {
  readonly payload: unknown;

  constructor(status: number, message: string, payload: unknown) {
    super(status, "UPSTREAM_ERROR", message);
    this.payload = payload;
  }
}

export class UpstreamUnavailableError extends AppError {
  constructor(message = "租户服务不可用") {
    super(502, "BAD_GATEWAY", message);
  }
}
