import type { LinguisticCorpus, CorpusWord } from '$lib/types';

// Standard English stop words to filter out for focal vocabulary
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
  'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
  'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
  'most', 'us', 'is', 'are', 'was', 'were', 'been', 'being', 'has', 'had',
  'does', 'did', 'doing', 'shall', 'should', 'may', 'might', 'must'
]);

interface EssayInput {
  id: string;
  title: string;
  body?: string;
  description?: string;
}

/**
 * Clean markdown body: strip images, links, :::directives, headers, codeblocks
 */
export function cleanMarkdownText(markdown: string): string {
  return markdown
    .replace(/:::[\s\S]*?:::/g, '') // custom markdown directives (:::quote, :::figure, etc.)
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links -> label text
    .replace(/^#+\s+.*$/gm, '') // headers
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`.*?`/g, '') // inline code
    .replace(/[*_~`]/g, '') // formatting
    .replace(/>\s+/g, '') // blockquotes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract evocative quotes and key phrases
 */
function extractPhrases(markdown: string, essayId: string, essayTitle: string): Array<{ text: string; essayId: string; essayTitle: string }> {
  const phrases: Array<{ text: string; essayId: string; essayTitle: string }> = [];

  // Match :::quote[...] or blockquotes
  const quoteMatches = markdown.match(/:::quote\[[^\]]*\]([\s\S]*?):::/g);
  if (quoteMatches) {
    for (const match of quoteMatches) {
      const inner = match.replace(/:::quote\[[^\]]*\]/, '').replace(/:::/, '').trim();
      const firstSentence = inner.split(/[.?!]/)[0]?.trim();
      if (firstSentence && firstSentence.length > 20 && firstSentence.length < 120) {
        phrases.push({ text: firstSentence, essayId, essayTitle });
      }
    }
  }

  // Also extract strong sentences from text
  const clean = cleanMarkdownText(markdown);
  const sentences = clean.split(/(?<=[.?!])\s+/);
  for (const s of sentences) {
    const trimmed = s.trim();
    if (trimmed.length >= 35 && trimmed.length <= 110 && !trimmed.includes('http')) {
      // Pick occasional compelling sentences
      if (
        trimmed.toLowerCase().includes('canvas') ||
        trimmed.toLowerCase().includes('edge') ||
        trimmed.toLowerCase().includes('monsoon') ||
        trimmed.toLowerCase().includes('friction') ||
        trimmed.toLowerCase().includes('craft') ||
        trimmed.toLowerCase().includes('light') ||
        trimmed.toLowerCase().includes('practice')
      ) {
        phrases.push({ text: trimmed, essayId, essayTitle });
      }
    }
  }

  return phrases;
}

/**
 * Builds the LinguisticCorpus data structure from raw markdown essays
 */
export function buildLinguisticCorpus(essays: EssayInput[]): LinguisticCorpus {
  const wordFreqMap = new Map<string, { count: number; essayIds: Set<string>; samplePhrase?: string }>();
  const markovTransitions: Record<string, string[]> = {};
  const allPhrases: Array<{ text: string; essayId: string; essayTitle: string }> = [];

  let totalWordsCount = 0;

  for (const essay of essays) {
    const rawContent = (essay.description ? essay.description + '. ' : '') + (essay.body || '');
    const cleanText = cleanMarkdownText(rawContent);

    // Extract phrases
    if (essay.body) {
      const extracted = extractPhrases(essay.body, essay.id, essay.title);
      allPhrases.push(...extracted);
    }

    // Split into sentences for Markov transition building
    const sentences = cleanText.split(/(?<=[.?!])\s+/);

    for (const sentence of sentences) {
      // Tokenize words while preserving casing for generative natural syntax
      const rawTokens = sentence
        .replace(/[^a-zA-Z0-9\s'-]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 1 && !t.startsWith('-'));

      if (rawTokens.length < 3) continue;

      totalWordsCount += rawTokens.length;

      // 1. Vocabulary extraction (lowercase for indexing)
      for (let i = 0; i < rawTokens.length; i++) {
        const token = rawTokens[i];
        const lower = token.toLowerCase();

        // Keep significant words (> 3 chars, not in STOP_WORDS, pure alpha)
        if (lower.length >= 4 && !STOP_WORDS.has(lower) && /^[a-z]+$/.test(lower)) {
          if (!wordFreqMap.has(lower)) {
            // grab a 3-5 word context snippet
            const startCtx = Math.max(0, i - 2);
            const endCtx = Math.min(rawTokens.length, i + 3);
            const contextSnippet = rawTokens.slice(startCtx, endCtx).join(' ');

            wordFreqMap.set(lower, {
              count: 0,
              essayIds: new Set<string>(),
              samplePhrase: contextSnippet
            });
          }
          const item = wordFreqMap.get(lower)!;
          item.count++;
          item.essayIds.add(essay.id);
        }
      }

      // 2. Markov Chain transitions (2nd-order / bigram transition graph)
      for (let i = 0; i < rawTokens.length - 1; i++) {
        const current = rawTokens[i].toLowerCase();
        const next = rawTokens[i + 1].toLowerCase();

        if (!markovTransitions[current]) {
          markovTransitions[current] = [];
        }
        if (markovTransitions[current].length < 12 && !markovTransitions[current].includes(next)) {
          markovTransitions[current].push(next);
        }
      }
    }
  }

  // Sort vocabulary by frequency & richness
  const vocabulary: CorpusWord[] = Array.from(wordFreqMap.entries())
    .map(([word, data]) => ({
      word,
      count: data.count,
      essayIds: Array.from(data.essayIds),
      samplePhrase: data.samplePhrase
    }))
    .filter((w) => w.count >= 2 || w.word.length >= 6) // keep interesting words
    .sort((a, b) => b.count - a.count)
    .slice(0, 90); // keep top 90 focal words for the canvas

  // Deduplicate and cap phrases
  const uniquePhrases = allPhrases
    .filter((v, idx, arr) => arr.findIndex((t) => t.text === v.text) === idx)
    .slice(0, 16);

  return {
    stats: {
      totalWords: totalWordsCount,
      uniqueWords: wordFreqMap.size,
      essayCount: essays.length
    },
    vocabulary,
    markovTransitions,
    phrases: uniquePhrases
  };
}
