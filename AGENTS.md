# AGENTS.md — SvelteKit Portfolio Guidelines

This document outlines the strict technical rules, design constraints, and architectural patterns for modifying this SvelteKit-powered minimalist editorial portfolio repository.

## 1. Tech Stack & Core Architecture
- **Framework**: SvelteKit 2 + Svelte 5 (Runes architecture: `$state`, `$derived`, `$props`, `$effect`).
- **Build Tool**: Vite 6 with `@tailwindcss/vite` and `@sveltejs/vite-plugin-svelte`.
- **Styling**: Tailwind CSS v4 (minimalist stone canvas `#F4F2ED`, foreground `#2C2B29`, border `#E8E6DF`).
- **Typography Engine**: Marked with custom editorial styling for prose and marginal notes (`src/lib/components/common/MarkdownRenderer.svelte`).
- **Data Pipeline**: Server-rendered data loaders (`+page.server.ts`, `+layout.server.ts`) parsing Markdown with `gray-matter` via `src/lib/server/content.ts`.
- **Studio CMS & Media Pipeline**: In-browser studio suite located at `/studio` (`src/routes/studio/`) backed by `src/lib/server/pipeline.ts` for media processing, AI-deterrence staging (T7 SSD), and content reconciliation.
- **Layout Archetypes**:
  - `product_design`: Software, prototypes, tech badges, and live URLs (`src/lib/components/layouts/ProductDesignLayout.svelte`).
  - `case_study`: Design systems, branding, and deliverables (`src/lib/components/layouts/CaseStudyLayout.svelte`).
  - `photo_album`: Prime-lens and documentary photography series with EXIF strips (`src/lib/components/layouts/PhotoAlbumLayout.svelte`).
  - `illustration`: Fine art, figure studies, and sketchbooks (`src/lib/components/layouts/IllustrationLayout.svelte`).

## 2. Strict Engineering Rules (DO NOT BREAK)
- **Pure SvelteKit Architecture**: All legacy Next.js files (`app/`, `components/`, `lib/`, `public/`, `middleware.ts`, `next.config.ts`, `tina/`) have been removed from `main`. Never re-introduce React components or Next.js configurations.
- **Static Assets in `static/images/`**: All images are served from SvelteKit's `static/` directory (accessible at `/images/...` in the browser). Never create or write to `public/images/`.
- **Svelte 5 Runes**: Always use Svelte 5 runes syntax (`let { prop } = $props()`, `$state()`, `$derived()`, `$effect()`). Avoid legacy Svelte 3/4 `export let` or `$: ` syntax.
- **Dynamic Content Only**: Load all project, blog, and library content dynamically via `src/lib/server/content.ts`.

## 3. Design System & Styling Constraints
- **Color Palette**: Stick strictly to `#F4F2ED` (background canvas) and `#2C2B29` (primary text), complemented by `stone-*` neutral shades and `#E8E6DF` for borders/dividers.
- **Typography Hierarchy**: Use clean sans-serif typography (`font-sans` Geist) for UI labels and titles, and refined editorial serif (`font-serif` Newsreader) for narrative prose and blockquotes.
- **Icons**: Use `@lucide/svelte` or `lucide-svelte` icons natively in Svelte components.

## 4. Content Structure Standards
Markdown files in `content/projects/` and `content/blog/` maintain YAML frontmatter:
```markdown
---
title: "Project Title"
year: "2026"
tags: "category / medium"
description: "Brief summary paragraph."
thumbnailSrc: "/images/example.webp"
archetype: "product_design"
gallery:
  - "/images/gallery-1.webp"
  - "/images/gallery-2.webp"
---
```

## 5. Media Pipeline & AI-Deterrence Guardrails
- **Automated Processing**: Run `node scripts/process-images.mjs` to convert raw assets into contextual high-DPI WebP format.
- **Configurable Hardware/Local Vault**: The pipeline vault path is configurable via `content/settings/pipeline.json` (or `/studio/protocol`), with automatic detection for external hardware vaults / SSDs and local fallback (`.pipeline-vault/`).
- **First-Time Setup**: Run `npm run pipeline:setup` (or use the Studio Protocol UI) on any new machine to scaffold all vault directories (`stage-in/`, `stage-out/`, `masters-archive/`, `zines/`).
- **Manifest Tracking**: AI protection statuses and metadata are tracked in `content/settings/media-manifest.json`.

## 6. Dual-Repository Architecture & Open-Source Backporting Protocol
This codebase is maintained in a strict dual-repository topology:

1. **Private Portfolio (`portfolio2026`)**:
   - **Repository**: `https://github.com/drawablex86/portfolio2026.git`
   - **Local Path**: `/Users/rahulrajeev/Downloads/portfolio`
   - **Contents**: Full personal portfolio, private essays, artwork, sketches, residency zines (*As We Are Humans*), photography, and personal metadata.

2. **Public Open-Source Template (`editorial-portfolio-template`)**:
   - **Repository**: `https://github.com/drawablex86/editorial-portfolio-template.git`
   - **Local Path**: `/Users/rahulrajeev/Downloads/editorial-portfolio-template`
   - **Contents**: Clean SvelteKit 2 + Svelte 5 engine, Studio CMS, generic storage vault options, and dummy content (Linus Torvalds persona). Zero personal history or assets.

### Strict Protocol for Upgrading the Open-Source Template
When developing new features (e.g. Studio CMS tools, layout archetypes, bug fixes, performance optimizations) in the private repository and ready to release them to the public template:

1. **Transfer Engine Code ONLY (Never Content or Static Images)**:
   - Sync only modified files from `src/`, `scripts/`, or root configuration files (`package.json`, `vite.config.ts`, `svelte.config.js`):
   ```bash
   # Example: syncing a newly developed component or API route
   rsync -av /Users/rahulrajeev/Downloads/portfolio/src/lib/components/studio/ \
             /Users/rahulrajeev/Downloads/editorial-portfolio-template/src/lib/components/studio/
   ```
   - **NEVER copy** `content/` (`content/blog/`, `content/projects/`, `content/zines/`, `content/pages/`) or `static/images/`, `static/zines/`. The template must always keep its de-identified Linus dummy content.

2. **Run Mandatory Pre-Flight Privacy Audit**:
   Before committing in `editorial-portfolio-template`, run a grep check to guarantee zero personal data has leaked into code or comments:
   ```bash
   cd /Users/rahulrajeev/Downloads/editorial-portfolio-template
   git grep -i -E "rahul|rajeev|mumbai|kerala|whole fragments|slowvv|as-we-are-humans" src/
   ```
   *Expected result: 0 occurrences.*

3. **Verify Typecheck & Build**:
   ```bash
   npm run check
   npm run build
   ```

4. **Commit & Push Upstream**:
   ```bash
   git add -A
   git commit -m "feat(engine): <describe new feature or optimization>"
   git push origin main
   ```

