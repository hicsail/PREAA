/**
 * Follow-up suggestion generation for DeepChat proxies.
 *
 * When a proxy has `suggestionsEnabled`, the proxy tees the assistant's
 * answer and asks a small LiteLLM model (SUGGESTIONS_MODEL) for a handful of
 * likely follow-up questions. They ride back to the widget either as an extra
 * SSE event (`data: {"suggestions": [...]}`) emitted before `[DONE]`, or as a
 * `suggestions` field on the non-streaming JSON response.
 *
 * Everything here fails open: any error, timeout, or unparsable model output
 * results in no suggestions, never a broken chat response.
 */

interface ChatMessage {
  role: string;
  content: string;
}

const DEFAULT_COUNT = 3;
const MAX_SUGGESTION_LENGTH = 120;
const GENERATION_TIMEOUT_MS = 8000;
// Bound the prompt size; the widget already caps history at 6 messages.
const MAX_CONTEXT_MESSAGES = 8;
const MAX_MESSAGE_CHARS = 2000;

export function suggestionsModel(): string | null {
  return process.env.SUGGESTIONS_MODEL || null;
}

function suggestionsCount(): number {
  const parsed = parseInt(process.env.SUGGESTIONS_COUNT || '', 10);
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) {
    return parsed;
  }
  return DEFAULT_COUNT;
}

/**
 * Pull the first JSON array of strings out of model output, tolerating code
 * fences and surrounding prose.
 */
function parseSuggestionArray(raw: string, count: number): string[] {
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch (_error) {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/\s+/g, ' ').trim())
    .filter((item) => item.length > 0)
    .map((item) => (item.length > MAX_SUGGESTION_LENGTH ? `${item.slice(0, MAX_SUGGESTION_LENGTH - 1)}…` : item))
    .slice(0, count);
}

/**
 * Ask the configured suggestion model for follow-up questions based on the
 * conversation plus the assistant answer that was just produced.
 * Returns [] on any failure.
 */
export async function generateFollowUpSuggestions(conversation: ChatMessage[], answerText: string): Promise<string[]> {
  const model = suggestionsModel();
  if (!model) {
    return [];
  }

  const count = suggestionsCount();
  const litellmUrl = process.env.LITELLM_BASE_URL || 'http://localhost:4000';
  const litellmApiKey = process.env.LITELLM_API_KEY || '';

  const context = conversation
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.length > MAX_MESSAGE_CHARS ? message.content.slice(0, MAX_MESSAGE_CHARS) : message.content
    }));

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'You suggest follow-up questions for a university support chat widget. ' +
        `Given the conversation, propose ${count} short questions the user is most likely to ask next. ` +
        'Rules: respond with ONLY a JSON array of strings, no markdown or prose; ' +
        'each question is written from the user\'s perspective, self-contained, and under 80 characters; ' +
        'stay on the topics discussed; never invent facts.'
    },
    ...context,
    { role: 'assistant', content: answerText.length > MAX_MESSAGE_CHARS ? answerText.slice(0, MAX_MESSAGE_CHARS) : answerText },
    { role: 'user', content: `Now reply with the JSON array of ${count} follow-up questions.` }
  ];

  try {
    const response = await fetch(`${litellmUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${litellmApiKey}`,
        'x-litellm-api-key': litellmApiKey
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 300
      }),
      signal: AbortSignal.timeout(GENERATION_TIMEOUT_MS)
    });

    if (!response.ok) {
      console.error('[Suggestions] LiteLLM request failed:', response.status, await response.text());
      return [];
    }

    const completion = await response.json();
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      return [];
    }

    return parseSuggestionArray(content, count);
  } catch (error) {
    console.error('[Suggestions] Failed to generate follow-up suggestions:', error);
    return [];
  }
}

/**
 * Wrap an OpenAI-format SSE stream so that, once the upstream answer
 * finishes, a `data: {"suggestions": [...]}` event is appended before the
 * final `data: [DONE]`.
 *
 * The upstream `[DONE]` marker is withheld and re-emitted by this transform;
 * every other line passes through untouched. Assistant text is accumulated
 * from `choices[0].delta.content` as it flows by and handed to `generate`
 * at the end. Client aborts cancel straight through without generating.
 */
export function attachSuggestionsToSseStream(
  upstream: ReadableStream<Uint8Array>,
  generate: (answerText: string) => Promise<string[]>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let lineBuffer = '';
  let answerText = '';

  const handleLine = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('data: ')) {
      const payload = trimmed.slice(6).trim();

      // Withhold the upstream terminator; flush() re-emits it after the
      // suggestions event.
      if (payload === '[DONE]') {
        return;
      }

      try {
        const parsed = JSON.parse(payload);
        const content = parsed?.choices?.[0]?.delta?.content;
        if (typeof content === 'string') {
          answerText += content;
        }
      } catch (_error) {
        // Not JSON we understand — pass it through untouched.
      }
    }

    controller.enqueue(encoder.encode(`${line}\n`));
  };

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      lineBuffer += decoder.decode(chunk, { stream: true });

      const lines = lineBuffer.split('\n');
      lineBuffer = lines.pop() || '';

      for (const line of lines) {
        handleLine(line, controller);
      }
    },
    async flush(controller) {
      lineBuffer += decoder.decode();
      if (lineBuffer.length > 0) {
        handleLine(lineBuffer, controller);
        lineBuffer = '';
      }

      try {
        const suggestions = await generate(answerText);
        if (suggestions.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ suggestions })}\n\n`));
        }
      } catch (error) {
        // Fail open — the answer already streamed; never break the close.
        console.error('[Suggestions] Skipping suggestions event:', error);
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
    }
  });

  return upstream.pipeThrough(transform);
}
