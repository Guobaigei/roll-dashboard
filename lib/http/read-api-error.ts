type ApiErrorBody = {
  message?: string;
};

export async function readApiError(response: Response, fallback = "请求失败") {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}
