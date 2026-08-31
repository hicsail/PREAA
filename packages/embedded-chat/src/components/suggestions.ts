/**
 * Rendering helpers for follow-up suggestion chips.
 *
 * The backend proxy can attach follow-up questions to a response — as a
 * `data: {"suggestions": [...]}` SSE event right before `[DONE]` when
 * streaming, or as a `suggestions` array on the JSON body otherwise. They are
 * rendered as a temporary DeepChat HTML message: `deep-chat-suggestion-button`
 * submits the button text as a new user message on click, and
 * `deep-chat-temporary-message` keeps the chips out of history and removes
 * them as soon as the next message appears.
 */

const MAX_SUGGESTIONS = 5;

export function sanitizeSuggestions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, MAX_SUGGESTIONS);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSuggestionsHtml(suggestions: string[], primaryColor: string): string {
  const buttonStyle = [
    'display: block',
    'width: fit-content',
    'max-width: 100%',
    'background-color: #ffffff',
    `border: 1px solid ${primaryColor}`,
    `color: ${primaryColor}`,
    'border-radius: 16px',
    'padding: 7px 14px',
    'font-size: 13.5px',
    'font-family: inherit',
    'line-height: 1.35',
    'text-align: left',
    'cursor: pointer'
  ].join('; ');

  const buttons = suggestions
    .map(
      (suggestion) =>
        `<button class="deep-chat-button deep-chat-suggestion-button" style="${buttonStyle}">${escapeHtml(suggestion)}</button>`
    )
    .join('');

  return `<div class="deep-chat-temporary-message" style="display: flex; flex-direction: column; gap: 6px;">${buttons}</div>`;
}

/**
 * Append the chips as a temporary assistant HTML message. Slightly deferred
 * so DeepChat has finished finalizing the answer message first.
 */
export function appendSuggestionsMessage(chatRef: React.RefObject<any>, suggestions: string[], primaryColor: string): void {
  if (suggestions.length === 0) return;

  const html = buildSuggestionsHtml(suggestions, primaryColor);
  setTimeout(() => {
    try {
      chatRef.current?.addMessage({ html, role: 'ai' }, false);
      chatRef.current?.scrollToBottom?.();
    } catch (e) {
      console.error('[DeepChat] Failed to render follow-up suggestions:', e);
    }
  }, 60);
}
