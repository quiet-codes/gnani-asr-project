export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function assertApiConfigured(): void {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) {
    throw new ApiError("The API URL is not configured. Set NEXT_PUBLIC_API_BASE_URL and restart the app.");
  }
}

function backendMessage(body: unknown): string | null {
  if (typeof body !== "object" || body === null || !("detail" in body)) return null;
  const detail = body.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail.flatMap((item: unknown) => {
      if (typeof item === "object" && item !== null && "msg" in item && typeof item.msg === "string") {
        return [item.msg];
      }
      return [];
    });
    return messages.length ? messages.join(" · ") : null;
  }
  return null;
}

export async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  assertApiConfigured();

  let response: Response;
  try {
    // Keep the browser request same-origin. Next.js rewrites /api/v1/* to the configured backend.
    response = await fetch(path, init);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError("Unable to connect to the server. Please check your connection.");
  }

  const responseText = await response.text();
  let body: unknown = null;
  if (responseText) {
    try {
      body = JSON.parse(responseText) as unknown;
    } catch {
      if (response.ok) throw new ApiError("The server returned an unreadable response.", response.status);
    }
  }

  if (!response.ok) {
    const message = backendMessage(body) ?? `The request failed (${response.status}). Please try again.`;
    throw new ApiError(message, response.status);
  }

  return body as T;
}
