import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_PATH = path.join(__dirname, '..', 'content', 'library.json');

// Helper to convert standard Goodreads shelf URL to RSS URL if needed
function resolveGoodreadsRssUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') return '';
  const trimmed = inputUrl.trim();
  if (trimmed.includes('/review/list_rss/')) {
    return trimmed;
  }
  // Convert https://www.goodreads.com/review/list/USER_ID?shelf=SHELF to list_rss
  if (trimmed.includes('/review/list/')) {
    return trimmed.replace('/review/list/', '/review/list_rss/');
  }
  return trimmed;
}

// Read RSS URL from CLI arg, library.json, or fallback
let targetRssUrl = process.argv[2] ? resolveGoodreadsRssUrl(process.argv[2]) : '';
if (!targetRssUrl && fs.existsSync(OUTPUT_PATH)) {
  try {
    const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    if (existing.goodreadsUrl) {
      targetRssUrl = resolveGoodreadsRssUrl(existing.goodreadsUrl);
    }
  } catch {
    // ignore
  }
}

const RSS_URL = targetRssUrl || 'https://www.goodreads.com/review/list_rss/user?shelf=favourites';

// Palette of aesthetic editorial spine colors (stone, terracotta, sage, deep indigo, burgundy, olive, ocher, charcoal, warm cream)
const SPINE_PALETTES = [
  { bg: '#3B3632', text: '#F4F2ED', pattern: 'gold-leaf' }, // Dark charcoal stone
  { bg: '#8C4336', text: '#FAF9F5', pattern: 'classic' },   // Terracotta rust
  { bg: '#3E5446', text: '#EDE9E1', pattern: 'minimal' },   // Sage olive
  { bg: '#2B3245', text: '#F4F2ED', pattern: 'gold-leaf' }, // Deep indigo
  { bg: '#6B3138', text: '#FAF9F5', pattern: 'vintage' },   // Deep burgundy
  { bg: '#8C6C38', text: '#F4F2ED', pattern: 'classic' },   // Warm ocher
  { bg: '#232220', text: '#E8E6DF', pattern: 'minimal' },   // Obsidian
  { bg: '#706456', text: '#FAF9F5', pattern: 'vintage' },   // Warm taupe
  { bg: '#4A5B63', text: '#F4F2ED', pattern: 'classic' },   // Slate blue
  { bg: '#5C4433', text: '#EDE9E1', pattern: 'gold-leaf' }, // Warm mahogany
];

function extractTagContent(xmlStr, tagName) {
  const cdataRegex = new RegExp(`<${tagName}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tagName}>`, 'i');
  const cdataMatch = xmlStr.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const standardRegex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const standardMatch = xmlStr.match(standardRegex);
  if (standardMatch) return standardMatch[1].trim();

  return '';
}

function cleanText(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<[^>]*>/g, '')
    .trim();
}

async function syncGoodreads() {
  console.log(`Fetching Goodreads RSS feed from ${RSS_URL}...`);
  try {
    const res = await fetch(RSS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    const xmlText = await res.text();
    const itemsRaw = xmlText.split('<item>').slice(1);

    console.log(`Found ${itemsRaw.length} books in RSS feed.`);

    const books = itemsRaw.map((itemXml, index) => {
      const title = cleanText(extractTagContent(itemXml, 'title'));
      const author = cleanText(extractTagContent(itemXml, 'author_name'));
      const bookId = extractTagContent(itemXml, 'book_id');
      const userRating = parseInt(extractTagContent(itemXml, 'user_rating') || '0', 10);
      const userReview = cleanText(extractTagContent(itemXml, 'user_review'));
      const coverUrlRaw = extractTagContent(itemXml, 'book_large_image_url') || extractTagContent(itemXml, 'book_medium_image_url');
      const coverUrl = coverUrlRaw.replace(/\._S[A-Z0-9_]+_\./i, '.'); // High-res image transform
      const goodreadsLink = extractTagContent(itemXml, 'link');
      const pubYear = extractTagContent(itemXml, 'book_published') || extractTagContent(itemXml, 'publication_year');

      // Pick spine palette deterministically based on book title string hash
      const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const palette = SPINE_PALETTES[hash % SPINE_PALETTES.length];

      // Varied height: 180px to 250px
      const height = 180 + (hash % 71);
      // Varied thickness: 26px to 46px
      const thickness = 26 + ((hash * 7) % 21);

      // Orientation distribution: ~75% upright, ~15% leaning, ~10% horizontal
      let orientation = 'upright';
      let leanAngle = 0;

      const mod = index % 8;
      if (mod === 3) {
        orientation = 'leaning';
        leanAngle = (index % 2 === 0 ? -1 : 1) * (8 + (hash % 6)); // -8 to -13 or +8 to +13 deg
      } else if (mod === 6) {
        orientation = 'horizontal';
      }

      // Check if an actual blog post exists for this book in content/blog
      const notesSlugCandidate = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      const blogDir = path.join(__dirname, '..', 'content', 'blog');
      const blogExists = fs.existsSync(path.join(blogDir, `${notesSlugCandidate}.md`));

      return {
        id: `book-${bookId || index + 1}`,
        bookId,
        title,
        author,
        rating: userRating > 0 ? userRating : 5,
        userReview: userReview || undefined,
        coverUrl: coverUrl || '/images/inspiration_cosmology.jpg',
        goodreadsUrl: goodreadsLink || `https://www.goodreads.com/review/list/user?shelf=favourites`,
        notesSlug: blogExists ? notesSlugCandidate : undefined,
        publishYear: pubYear || undefined,
        spineColor: palette.bg,
        spineTextColor: palette.text,
        pattern: palette.pattern,
        height,
        thickness,
        orientation,
        leanAngle: orientation === 'leaning' ? leanAngle : undefined,
      };
    });

    // Read existing file to preserve custom reviews, quote snippets, and onTopOfMyMind
    let existingOnTopOfMyMind = ['book-42771901', 'book-187633'];
    const existingBooksMap = new Map();
    if (fs.existsSync(OUTPUT_PATH)) {
      try {
        const existingData = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
        if (Array.isArray(existingData.onTopOfMyMind)) {
          existingOnTopOfMyMind = existingData.onTopOfMyMind;
        }
        if (Array.isArray(existingData.books)) {
          for (const b of existingData.books) {
            existingBooksMap.set(b.id, b);
            if (b.bookId) existingBooksMap.set(b.bookId, b);
          }
        }
      } catch (e) {
        // Ignore read errors
      }
    }

    // Merge custom enhancements into newly synced books
    const mergedBooks = books.map((b) => {
      const existing = existingBooksMap.get(b.id) || (b.bookId ? existingBooksMap.get(b.bookId) : null);
      if (existing) {
        return {
          ...b,
          userReview: existing.userReview || b.userReview,
          quoteSnippet: existing.quoteSnippet || b.quoteSnippet,
          spineColor: existing.spineColor || b.spineColor,
          spineTextColor: existing.spineTextColor || b.spineTextColor,
          pattern: existing.pattern || b.pattern,
          height: existing.height || b.height,
          thickness: existing.thickness || b.thickness,
          orientation: existing.orientation || b.orientation,
          leanAngle: existing.leanAngle || b.leanAngle,
        };
      }
      return b;
    });

    // Also include any spotlight book that might not yet be in the RSS list
    if (existingBooksMap.has('book-42771901') && !mergedBooks.some(b => b.id === 'book-42771901')) {
      mergedBooks.unshift(existingBooksMap.get('book-42771901'));
    }

    const libraryData = {
      curator: existingLib.curator || "Curator",
      statement: existingLib.statement || "A curated collection of foundational treatises, essays, and visual monographs synced from Goodreads.",
      goodreadsUrl: targetRssUrl || existingLib.goodreadsUrl || "",
      lastSynced: new Date().toISOString().split('T')[0],
      onTopOfMyMind: existingOnTopOfMyMind,
      books: mergedBooks,
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(libraryData, null, 2), 'utf-8');
    console.log(`Successfully synced ${mergedBooks.length} books to ${OUTPUT_PATH}`);
  } catch (err) {
    console.error('Error syncing Goodreads RSS:', err);
    process.exit(1);
  }
}

syncGoodreads();
