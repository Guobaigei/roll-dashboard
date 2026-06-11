import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError, UpstreamHttpError } from "@/lib/http/errors";

type ErrorBody = {
  error: string;
  message: string;
};

export function jsonOk<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function jsonError(status: number, error: string, message: string) {
  return NextResponse.json<ErrorBody>({ error, message }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(400, "BAD_REQUEST", error.issues[0]?.message ?? "请求参数无效");
  }

  if (error instanceof UpstreamHttpError) {
    if (error.status >= 500) {
      return jsonError(502, "BAD_GATEWAY", "租户服务不可用");
    }

    const payload =
      typeof error.payload === "object" && error.payload !== null ? error.payload : null;
    const message =
      payload && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : error.message;
    const upstreamError =
      payload && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "UPSTREAM_ERROR";

    return jsonError(error.status, upstreamError, message);
  }

  if (error instanceof AppError) {
    return jsonError(error.status, error.code, error.message);
  }

  console.error(error);
  return jsonError(500, "INTERNAL_SERVER_ERROR", "服务暂时不可用");
}
