import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'node:path';

function resolvePort(): number {
  const portFlagIdx = process.argv.indexOf('--port');
  if (portFlagIdx !== -1 && process.argv[portFlagIdx + 1]) {
    const parsed = Number(process.argv[portFlagIdx + 1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  const envPort = Number(process.env.PORT);
  return Number.isFinite(envPort) && envPort > 0 ? envPort : 3000;
}

const PORT = resolvePort();
const MAX_MESSAGE_LENGTH = 2000;
const REQUEST_TIMEOUT_MS = 10000;

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

async function dispatchSecretMessage(message: string): Promise<SendOutcome> {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!telegramBotToken || !telegramChatId) {
    return {
      ok: false,
      status: 503,
      code: 'MISSING_TELEGRAM_CONFIG',
      error:
        'Telegram is not configured on the server. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your deployment Environment Variables and redeploy.',
    };
  }

  return sendViaTelegram(telegramBotToken, telegramChatId, message);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '32kb' }));

  app.post('/api/secret-message', async (req: Request, res: Response) => {
    const rawMessage = typeof req.body?.message === 'string' ? req.body.message : '';
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

    try {
      const outcome = await dispatchSecretMessage(trimmedMessage);
      if (!outcome.ok) {
        res.status(outcome.status).json({
          ok: false,
          ...(outcome.code ? { code: outcome.code } : {}),
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
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
