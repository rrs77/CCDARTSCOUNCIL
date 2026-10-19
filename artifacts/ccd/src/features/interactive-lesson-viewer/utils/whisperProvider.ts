import type { LyricLine } from '../types';
import { createId } from '../types';

export type TranscriptionProvider = 'openai-whisper' | 'none';

export interface TranscriptionResult {
  provider: TranscriptionProvider;
  lines: LyricLine[];
  message?: string;
}

/**
 * Pluggable speech-to-text. Calls the server proxy when OPENAI_API_KEY is configured.
 * Never sends keys from the client — the API route holds the secret.
 */
export async function transcribeAudioForLyrics(
  audioUrl: string,
  authToken?: string | null,
): Promise<TranscriptionResult> {
  try {
    const res = await fetch('/api/interactive-lessons/transcribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ audioUrl, provider: 'openai-whisper' }),
    });

    if (res.status === 501 || res.status === 503) {
      const body = await res.json().catch(() => ({}));
      return {
        provider: 'none',
        lines: [],
        message:
          body.message ||
          'No speech-to-text provider key is configured. Set OPENAI_API_KEY on the server, or use Tap to sync / paste lyrics.',
      };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        provider: 'none',
        lines: [],
        message: body.message || `Transcription failed (${res.status}). Use Tap to sync instead.`,
      };
    }

    const data = (await res.json()) as {
      lines?: { text: string; startMs: number; endMs: number }[];
      provider?: TranscriptionProvider;
    };

    const lines: LyricLine[] = (data.lines || []).map((l) => ({
      id: createId('ly'),
      text: l.text,
      startMs: l.startMs,
      endMs: l.endMs,
    }));

    return {
      provider: data.provider || 'openai-whisper',
      lines,
    };
  } catch {
    return {
      provider: 'none',
      lines: [],
      message:
        'Could not reach the transcription service. Use Tap to sync or paste lyrics with auto-align.',
    };
  }
}

/** Probe endpoint to show UI status without uploading. */
export async function getTranscriptionProviderStatus(): Promise<{
  available: boolean;
  provider: TranscriptionProvider;
  message: string;
}> {
  try {
    const res = await fetch('/api/interactive-lessons/transcribe', { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    return {
      available: Boolean(data.available),
      provider: data.provider || 'none',
      message:
        data.message ||
        (data.available
          ? 'OpenAI Whisper is available for auto-timing.'
          : 'No OPENAI_API_KEY set — Tap to sync is always available.'),
    };
  } catch {
    return {
      available: false,
      provider: 'none',
      message: 'Transcription status unknown — Tap to sync is always available.',
    };
  }
}
