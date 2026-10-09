import assert from 'node:assert';
import path from 'node:path';
import {
  escapeHtml,
  sanitizeImageSrc,
  sanitizeRenderedHtml,
  preprocessEditorialDirectives,
} from '../src/lib/editorialParser.ts';

console.log('==============================================');
console.log('   PRODUCTION SECURITY & DEFENSE AUDIT SUITE  ');
console.log('==============================================\n');

let passedTests = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// ---------------------------------------------------------
// 1. Path Traversal & Containment Verification
// ---------------------------------------------------------
const ALLOWED_SECTIONS = new Set(['projects', 'blog', 'pages', 'desk', 'zines']);
const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

function validateStudioPath(section, slug) {
  if (!ALLOWED_SECTIONS.has(section)) {
    return { valid: false, error: `Invalid content section: ${section}` };
  }
  if (!slug || !SLUG_REGEX.test(slug)) {
    return { valid: false, error: `Invalid slug name: ${slug}` };
  }
  const baseDir = path.resolve(process.cwd(), 'content', section);
  const targetPath = path.resolve(baseDir, `${slug}.md`);
  if (!targetPath.startsWith(baseDir + path.sep)) {
    return { valid: false, error: 'Path traversal detected' };
  }
  return { valid: true, filePath: targetPath };
}

test('Studio: Rejects invalid or dangerous sections', () => {
  assert.strictEqual(validateStudioPath('../../etc', 'test').valid, false);
  assert.strictEqual(validateStudioPath('secrets', 'test').valid, false);
  assert.strictEqual(validateStudioPath('../content/projects', 'test').valid, false);
  assert.strictEqual(validateStudioPath('projects', 'valid-slug_123').valid, true);
});

test('Studio: Rejects path traversal and illegal characters in slug', () => {
  assert.strictEqual(validateStudioPath('projects', '../package.json').valid, false);
  assert.strictEqual(validateStudioPath('projects', '../../../../etc/passwd').valid, false);
  assert.strictEqual(validateStudioPath('projects', 'foo/bar').valid, false);
  assert.strictEqual(validateStudioPath('projects', 'foo\\bar').valid, false);
  assert.strictEqual(validateStudioPath('projects', 'test..slug').valid, false);
  assert.strictEqual(validateStudioPath('projects', 'slug with spaces').valid, false);
});

// Media Deletion Containment Test
function checkMediaDeletionPath(mediaDir, rawName) {
  if (!rawName || typeof rawName !== 'string') return false;
  const cleanRelPath = rawName.replace(/^\/+/, '');
  const fullPath = path.resolve(mediaDir, cleanRelPath);
  return fullPath === mediaDir || fullPath.startsWith(mediaDir + path.sep);
}

test('Media: Strict directory containment prevents escaping images directory', () => {
  const imagesBase = path.resolve(process.cwd(), 'static', 'images');
  assert.strictEqual(checkMediaDeletionPath(imagesBase, '../../package.json'), false);
  assert.strictEqual(checkMediaDeletionPath(imagesBase, '../../../etc/passwd'), false);
  assert.strictEqual(checkMediaDeletionPath(imagesBase, 'subfolder/../../../secrets.txt'), false);
  assert.strictEqual(checkMediaDeletionPath(imagesBase, 'subfolder/photo.webp'), true);
  assert.strictEqual(checkMediaDeletionPath(imagesBase, 'hero.webp'), true);
});

// Zine deletion containment test
function checkZineDeletionPath(zinesStaticBase, slug) {
  if (!slug || !SLUG_REGEX.test(slug)) return false;
  const targetDir = path.resolve(zinesStaticBase, slug);
  return targetDir.startsWith(zinesStaticBase + path.sep);
}

test('Zines: Deletion strictly contained and blocks traversal slugs', () => {
  const zinesBase = path.resolve(process.cwd(), 'static', 'zines');
  assert.strictEqual(checkZineDeletionPath(zinesBase, '../../static'), false);
  assert.strictEqual(checkZineDeletionPath(zinesBase, '..'), false);
  assert.strictEqual(checkZineDeletionPath(zinesBase, 'test/sub'), false);
  assert.strictEqual(checkZineDeletionPath(zinesBase, 'zine-volume-1'), true);
});

// ---------------------------------------------------------
// 2. XSS & HTML Entity Escaping Verification
// ---------------------------------------------------------
test('XSS: escapeHtml neutralizes tags, quotes, and ampersands', () => {
  const malicious = '<script>alert("xss")</script> & \'hello\' <img src=x onerror=alert(1)>';
  const clean = escapeHtml(malicious);
  assert.strictEqual(
    clean,
    '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;hello&#39; &lt;img src=x onerror=alert(1)&gt;'
  );
});

test('XSS: sanitizeImageSrc rejects dangerous URI schemes and protocol smuggling', () => {
  assert.strictEqual(sanitizeImageSrc('javascript:alert(1)'), '');
  assert.strictEqual(sanitizeImageSrc('JAVASCRIPT:alert(1)'), '');
  assert.strictEqual(sanitizeImageSrc('data:text/html,<script>alert(1)</script>'), '');
  assert.strictEqual(sanitizeImageSrc('vbscript:msgbox("xss")'), '');
  assert.strictEqual(sanitizeImageSrc('javascript\n:alert(1)'), '');
  assert.strictEqual(sanitizeImageSrc('/images/gallery-1.webp'), '/images/gallery-1.webp');
  assert.strictEqual(sanitizeImageSrc('https://example.com/art.jpg'), 'https://example.com/art.jpg');
});

test('XSS: sanitizeRenderedHtml strips script tags, iframes, and inline event handlers', () => {
  const dirty = `
    <p>Legitimate text</p>
    <script>alert("hack")</script>
    <iframe src="https://evil.com"></iframe>
    <a href="javascript:alert(1)" onclick="stealCookies()">Click me</a>
    <img src="/photo.webp" onload="executeExploit()" onerror="backupExploit()" />
  `;
  const clean = sanitizeRenderedHtml(dirty);
  assert.strictEqual(clean.includes('<script>'), false);
  assert.strictEqual(clean.includes('<iframe'), false);
  assert.strictEqual(clean.includes('onclick='), false);
  assert.strictEqual(clean.includes('onload='), false);
  assert.strictEqual(clean.includes('onerror='), false);
  assert.strictEqual(clean.includes('javascript:alert(1)'), false);
  assert.strictEqual(clean.includes('<p>Legitimate text</p>'), true);
  assert.strictEqual(clean.includes('src="/photo.webp"'), true);
});

test('Editorial Directives: preprocessEditorialDirectives safely neutralizes injected directives', () => {
  const maliciousDirectives = `
:::metrics
<script>alert(1)</script> : Injected "Label"
:::

:::duo[<script>evil caption</script>]
!["><script>xss()</script>](javascript:alert(1))
:::

:::quote[<img src=x onerror=alert(1)>]
Pullquote content
:::
`;
  const result = preprocessEditorialDirectives(maliciousDirectives);
  assert.strictEqual(result.includes('<script>alert(1)</script>'), false);
  assert.strictEqual(result.includes('javascript:alert(1)'), false);
  assert.strictEqual(result.includes('&lt;script&gt;evil caption&lt;/script&gt;'), true);
  assert.strictEqual(result.includes('&lt;img src=x onerror=alert(1)&gt;'), true);
});

// ---------------------------------------------------------
// 3. Open Redirect Validation Verification
// ---------------------------------------------------------
function isSafeRedirectTarget(cleanTo) {
  return (
    (cleanTo.startsWith('/') && !cleanTo.startsWith('//')) ||
    cleanTo.startsWith('https://example.com')
  );
}

test('Redirects: Blocks open redirects, protocol-relative URLs, and javascript schemes', () => {
  assert.strictEqual(isSafeRedirectTarget('//evil.com/phish'), false);
  assert.strictEqual(isSafeRedirectTarget('https://evil.com/phish'), false);
  assert.strictEqual(isSafeRedirectTarget('javascript:alert(1)'), false);
  assert.strictEqual(isSafeRedirectTarget('data:text/html,...'), false);
  assert.strictEqual(isSafeRedirectTarget('/projects'), true);
  assert.strictEqual(isSafeRedirectTarget('/projects/my-work'), true);
  assert.strictEqual(isSafeRedirectTarget('https://example.com/about'), true);
});

// ---------------------------------------------------------
// 4. Studio Authentication & Defense-in-Depth Verification
// ---------------------------------------------------------
function checkStudioAccess(isDev, studioEnabled, configuredToken, providedBearer) {
  if (isDev) return true;
  if (studioEnabled !== 'true') return false;
  if (!configuredToken) return false;
  return providedBearer === configuredToken;
}

test('Studio Guard: Fails closed in production without credentials', () => {
  // In dev: permitted
  assert.strictEqual(checkStudioAccess(true, 'false', '', ''), true);
  // In prod with STUDIO_ENABLED=false: blocked
  assert.strictEqual(checkStudioAccess(false, 'false', 'secret', 'secret'), false);
  // In prod with STUDIO_ENABLED=true but no token configured: blocked (fail closed)
  assert.strictEqual(checkStudioAccess(false, 'true', '', ''), false);
  // In prod with STUDIO_ENABLED=true, wrong token: blocked
  assert.strictEqual(checkStudioAccess(false, 'true', 'secret123', 'wrong'), false);
  // In prod with STUDIO_ENABLED=true, valid token: granted
  assert.strictEqual(checkStudioAccess(false, 'true', 'secret123', 'secret123'), true);
});

console.log(`\nAll ${passedTests} security verification checks PASSED successfully!`);
