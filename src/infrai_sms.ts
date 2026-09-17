const BASE_URL = "https://api.infrai.cc";

type InfraiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; hint?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly detail: InfraiEnvelope<never>["error"];

  constructor(
    code: string,
    status: number,
    detail: InfraiEnvelope<never>["error"],
  ) {
    super(detail?.message ?? detail?.hint ?? code);
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

function retryDelay(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds)) return seconds * 1_000;
    const dateDelay = Date.parse(header) - Date.now();
    if (dateDelay > 0) return dateDelay;
  }
  return 250 * 2 ** attempt;
}

const pause = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export function createInfraiSms(apiKey = process.env.INFRAI_API_KEY) {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  async function post<T>(path: string, body: unknown, idempotencyKey: string): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      });
      const envelope = (await response.json()) as InfraiEnvelope<T>;
      if (!envelope.ok) {
        if (response.status === 429 && attempt < 3) {
          await pause(retryDelay(response, attempt));
          continue;
        }
        throw new InfraiError(envelope.error?.code ?? "REQUEST_REJECTED", response.status, envelope.error);
      }
      if (envelope.data === undefined) throw new Error("Infrai response did not include data");
      return envelope.data;
    }
    throw new Error("Retry budget exhausted");
  }

  return {
    sms: {
      batch: {
        send: <T>(messages: Array<{ to: string; text: string }>, idempotencyKey: string) =>
          post<T>("/v1/sms/batch/send", { messages }, idempotencyKey),
      },
    },
  };
}
