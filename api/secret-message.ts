import process from 'node:process';

const MAX_MESSAGE_LENGTH = 2000;
const REQUEST_TIMEOUT_MS = 10000;

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  on?: (event: string, listener: (chunk: Uint8Array | string) => void) => void;
}

interface ApiResponse {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => void;
  end?: () => void;
}

interface SendOutcome {
  ok: boolean;
  status: number;
  provider?: string;
  id?: string;
  code?: string;
  error?: string;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<globalThis.Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readJsonBody(req: ApiRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !(req.body instanceof Uint8Array)) {
    return req.body as Record<string, unknown>;
  }

  if (typeof req.body === 'string') {
    return (JSON.parse(req.body) as Record<string, unknown>) || {};
  }

  if (req.body instanceof Uint8Array) {
    const decoded = new TextDecoder().decode(req.body);
    return decoded.trim() ? ((JSON.parse(decoded) as Record<string, unknown>) || {}) : {};
  }

  if (!req.on) {
    return {};
  }

  const decoder = new TextDecoder();
  const raw = await new Promise<string>((resolve, reject) => {
    let text = '';
    req.on?.('data', (chunk) => {
      text += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
    });
    req.on?.('end', () => {
      text += decoder.decode();
      resolve(text);
    });
    req.on?.('error', (err) => reject(err));
  });

  if (!raw.trim()) {
    return {};
  }

  return (JSON.parse(raw) as Record<string, unknown>) || {};
}

async function sendViaTelegram(
  botToken: string,
  chatId: string,
  message: string,
): Promise<SendOutcome> {
  const normalizedToken = botToken.replace(/^bot(?=\d+:)/i, '');
  const response = await fetchWithTimeout(
    `https://api.telegram.org/bot${normalizedToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Secret message (For Hamidabonu)\n\n${message}`,
        disable_web_page_preview: true,
      }),
    },
    REQUEST_TIMEOUT_MS,
  );

  const data = (await response.json().catch(() => null)) as
    | { ok?: boolean; result?: { message_id?: number }; description?: string }
    | null;

  if (!response.ok || !data?.ok) {
    return {
      ok: false,
      status: response.status >= 400 ? response.status : 502,
      error: data?.description || 'Could not send message via Telegram.',
    };
  }

  return {
    ok: true,
    status: 200,
    provider: 'telegram',
    ...(data.result?.message_id !== undefined
      ? { id: String(data.result.message_id) }
      : {}),
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'OPTIONS') {
    res.status(204).end?.();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' });
    return;
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ ok: false, error: 'Invalid request body.' });
    return;
  }

  const rawMessage = typeof body.message === 'string' ? body.message : '';
  const trimmedMessage = rawMessage.trim();

  if (!trimmedMessage) {
    res.status(400).json({ ok: false, error: 'Please write a message before sending.' });
    return;
  }

  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({
      ok: false,
      error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`,
    });
    return;
  }

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!telegramBotToken || !telegramChatId) {
    res.status(503).json({
      ok: false,
      code: 'MISSING_TELEGRAM_CONFIG',
      error:
        'Telegram is not configured on the server. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your deployment Environment Variables and redeploy.',
    });
    return;
  }

  try {
    const outcome = await sendViaTelegram(telegramBotToken, telegramChatId, trimmedMessage);
    if (!outcome.ok) {
      res.status(outcome.status).json({
        ok: false,
        error: outcome.error || 'Could not send message via Telegram.',
      });
      return;
    }

    res.status(200).json({
      ok: true,
      provider: outcome.provider,
      ...(outcome.id ? { id: outcome.id } : {}),
    });
  } catch (error) {
    const detail =
      error instanceof Error && error.name === 'AbortError'
        ? 'Telegram request timed out. Please try again in a moment.'
        : 'Could not send right now. Please try again in a moment.';
    res.status(502).json({
      ok: false,
      error: detail,
    });
  }
}
