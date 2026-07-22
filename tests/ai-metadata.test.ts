import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateMetadata } from '../src/lib/ai/metadata';

const GEMINI_HOST = 'generativelanguage.googleapis.com';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function geminiResponse(json: object) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] }),
  } as unknown as Response;
}

function openRouterResponse(json: object) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ choices: [{ message: { content: JSON.stringify(json) } }] }),
  } as unknown as Response;
}

describe('generateMetadata', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-gemini';
    process.env.OPENROUTER_API_KEY = 'test-openrouter';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses Gemini for vision and DeepSeek (OpenRouter) for text refinement', async () => {
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      calls.push(url);
      if (url.includes(GEMINI_HOST)) {
        return geminiResponse({ caption: 'a cat', keywords: ['cat', 'animal', 'Cat', 'pet'] });
      }
      if (url === OPENROUTER_URL) {
        return openRouterResponse({ title: 'A cat', description: 'A cat sitting.', keywords: ['cat', 'pet', 'cat'] });
      }
      throw new Error(`unexpected url ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateMetadata(Buffer.from('img'), 'image/jpeg');

    expect(calls.some((url) => url.includes(GEMINI_HOST))).toBe(true);
    expect(calls).toContain(OPENROUTER_URL);
    expect(result.title).toBe('A cat');
    // deduped
    expect(result.keywords).toEqual(['cat', 'pet']);
  });

  it('applies keyword cap and dedup on the refined output', async () => {
    const keywords = [...Array.from({ length: 70 }, (_, index) => `kw${index}`), 'kw0', 'KW1'];
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes(GEMINI_HOST)) {
        return geminiResponse({ caption: 'scene', keywords: ['scene'] });
      }
      return openRouterResponse({ title: 'scene', description: 'a scene', keywords });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateMetadata(Buffer.from('img'), 'image/jpeg');

    expect(result.keywords).toHaveLength(50);
    expect(result.keywords[0]).toBe('kw0');
    // duplicates (kw0, KW1 lowercased) removed
    expect(result.keywords.filter((keyword) => keyword === 'kw0')).toHaveLength(1);
    expect(result.title).toBe('scene');
  });

  it('falls back to raw Gemini vision output when text refinement fails', async () => {
    let openRouterCalled = false;
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      const body = String(init.body ?? '');
      // Gemini vision call carries the image inline_data; let it succeed.
      if (url.includes(GEMINI_HOST) && body.includes('inline_data')) {
        return geminiResponse({ caption: 'a dog running', keywords: ['dog', 'run'] });
      }
      // Gemini text-refinement fallback fails too.
      if (url.includes(GEMINI_HOST)) {
        throw new Error('gemini text down');
      }
      openRouterCalled = true;
      throw new Error('network down');
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generateMetadata(Buffer.from('img'), 'image/jpeg');

    expect(openRouterCalled).toBe(true);
    expect(result.description).toBe('a dog running');
    expect(result.keywords).toEqual(['dog', 'run']);
  });
});
