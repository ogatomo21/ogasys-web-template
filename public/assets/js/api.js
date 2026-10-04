export class ApiError extends Error {
  constructor(message, { status = 0, code = "NETWORK_ERROR", fields = {} } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export async function requestJSON(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  try {
    const response = await fetch(url, { ...options, headers, signal: controller.signal });
    let body;
    try {
      body = await response.json();
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new ApiError("サーバーの応答を読み取れませんでした。", { status: response.status, code: "INVALID_RESPONSE" });
    }
    if (!response.ok) {
      throw new ApiError(body?.error?.message ?? "リクエストに失敗しました。", {
        status: response.status, code: body?.error?.code ?? "HTTP_ERROR", fields: body?.error?.fields ?? {}
      });
    }
    return body;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.name === "AbortError" ? "通信がタイムアウトしました。再試行してください。" : "通信に失敗しました。接続を確認して再試行してください。");
  } finally {
    clearTimeout(timer);
  }
}
