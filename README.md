# 🏛️ Minimalist Editorial Portfolio & Spatial Studio Engine (v1.0 Release)

An artisanal, high-performance portfolio, digital garden, and spatial studio suite engineered with **SvelteKit 2**, **Svelte 5 (Runes)**, **Vite 6**, and **Tailwind CSS v4**.

Designed around a warm stone editorial aesthetic (`#F4F2ED`), tactile physics, 3D spatial workstations, in-browser CMS authoring, and an automated adversarial AI-deterrence media pipeline.

---

## 📑 Table of Contents

1. [Overview & Highlights](#1-overview--highlights)
2. [Quick Start & Prerequisites](#2-quick-start--prerequisites)
3. [The 10-Minute Personalization Checklist](#3-the-10-minute-personalization-checklist)
4. [Public Portals & Spatial Experiences](#4-public-portals--spatial-experiences)
5. [The Studio CMS Suite (`/studio`)](#5-the-studio-cms-suite-studio)
6. [Content Archetypes & Frontmatter Guide](#6-content-archetypes--frontmatter-guide)
7. [Adversarial AI Defense & TDM Governance](#7-adversarial-ai-defense--tdm-governance)
8. [CLI Automation & Helper Scripts](#8-cli-automation--helper-scripts)
9. [Repository Structure](#9-repository-structure)
10. [Deployment & Production Build](#10-deployment--production-build)
11. [License & Rights Notice](#11-license--rights-notice)

---

## 1. Overview & Highlights

This template bridges high-craft visual aesthetics with serious systems-level engineering:

- **Svelte 5 Runes Architecture**: Zero legacy Svelte 3/4 syntax (`export let`, `$: `). Fully powered by `$state`, `$derived`, `$props`, and `$effect`.
- **Editorial Typography Engine**: Pairing **Geist Sans** (for navigational clarity and technical badges) with **Newsreader Serif** (for long-form reading, philosophical essays, and marginalia).
- **Spatial & Interactive Physics**:
  - **Hero Water Voyage**: Dynamic 2D canvas water surface with interactive ripple reflections and drifting origami physics.
  - **3D Studio Desk**: Interactive tactile drafting plate viewer with realistic drag-and-drop mechanics.
  - **Inspiration Cosmology**: 2D spatial coordinate constellation with interactive torchlight spotlight exploration.
  - **Tactile Zine Flipbook**: Realistic page-turning reader for editorial folios, photo zines, and manuals.
  - **Virtual Book Shelf**: 3D book spines with custom foil stamping (gold, silver, copper).
- **In-Browser Studio CMS (`/studio`)**: A complete CMS workbench built directly into your application. Edit Markdown split-screens, organize media, review diagnostic pipelines, and manage SEO/TDM policies without third-party SaaS fees or head-ends.
- **Sovereign Local Vault & Adversarial AI Protection**: Integrated hooks to protect your original visual assets via Glaze/Nightshade adversarial perturbations and enforce EU Directive 2019/790 Article 4(3) machine-readable opt-outs.

---

## 2. Quick Start & Prerequisites

### Prerequisites
- **Node.js**: `v18.18.0` or higher (`Node 20+ LTS` or `Node 22` recommended)
- **npm**: `v9` or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/portfolio.git
cd portfolio

# 2. Install dependencies
npm install

# 3. Setup local pipeline vault
npm run pipeline:setup

# 4. Launch development server
npm run dev
```

Visit the application in your browser:
- **Public Site**: [http://localhost:5173](http://localhost:5173)
- **Studio CMS Workbench**: [http://localhost:5173/studio](http://localhost:5173/studio)
- **Protocol & Security Center**: [http://localhost:5173/studio/protocol](http://localhost:5173/studio/protocol)

### Quality Checks & Build

```bash
npm run check          # SvelteKit sync & TypeScript typecheck
npm run build          # Builds production bundle
npm run preview        # Preview production build locally
node scripts/verify-security.mjs # Run security & defensive audit suite
```

---

## 3. The 10-Minute Personalization Checklist

Follow this checklist to transform the starter template into your personal portfolio:

### Step 1: Site Identity & SEO (`content/settings/seo.json`)
- [ ] Open `content/settings/seo.json`.
- [ ] Update `siteTitle`, `titleTemplate`, and `defaultDescription`.
- [ ] Update `siteUrl` to your production domain (e.g. `https://yourname.com`).
- [ ] Update `author` details (`name`, `jobTitle`, `location`, `bio`, `url`, `sameAs` social links).
- [ ] Update `twitterHandle`.

### Step 2: Replace Avatar & OG Image (`static/images/avatar.webp`)
- [ ] Place your square profile portrait or avatar into `static/images/avatar.webp`.
- [ ] Ensure image resolution is at least 600×600 pixels.

### Step 3: Bio & Current Focus (`content/pages/`)
- [ ] **About Page** (`content/pages/about.md`):
  - [ ] Edit the long-form narrative bio.
  - [ ] Update your working `principles` and `disciplines`.
  - [ ] Update social links (`socialLinks`).
- [ ] **Now Page** (`content/pages/now.md`):
  - [ ] Edit what you are currently building, reading, and exploring.
  - [ ] Update your current quote.

### Step 4: Add Your Works & Projects (`content/projects/`)
- [ ] Browse the sample projects in `content/projects/`:
  - `git-content-tracker.md` (Product Design archetype)
  - `linux-vfs-subsystem.md` (Case Study archetype)
  - `nordic-hardware-optics.md` (Photography Album archetype)
  - `microprocessor-schematics.md` (Illustration archetype)
  - `micro-bench-engine.md` (Experiment archetype)
- [ ] Add your project Markdown files with appropriate frontmatter (`title`, `year`, `tags`, `projectType`, `thumbnailSrc`, `gallery`).
- [ ] Update display order in `content/settings/portfolio-order.json`.

### Step 5: Add Your Writing & Essays (`content/blog/`)
- [ ] Add your essays into `content/blog/*.md`.
- [ ] Include frontmatter: `title`, `year`, `tags`, `description`, `thumbnailSrc`.
- [ ] Use custom editorial directives (`:::quote[...]`, `:::figure[...]`, `:::metrics`, `:::note[...]`).

### Step 6: Customize 3D Desk & Inspiration Moodboard
- [ ] **3D Desk Plates** (`content/desk/desk.md`): Add titles, captions, and images for plates placed on your workshop mat.
- [ ] **Inspiration Constellation** (`content/inspiration.md`): Add 8–12 thinkers, mentors, or concepts with `(x, y)` percentages (0–100) to plot them spatially on the darkroom canvas.

### Step 7: Curate Your Library (`content/library.json`)
- [ ] Update `currentlyReading` and `books` in `content/library.json`.
- [ ] Set custom foil accents (`gold`, `silver`, `copper`) and hex spine colors.
- [ ] *(Optional)* Sync from Goodreads RSS via `npm run sync:goodreads`.

### Step 8: Zines & Reading Room (`content/zines/`)
- [ ] Define zine metadata in `content/zines/*.json`.
- [ ] Add high-resolution page WebPs to `static/zines/<zine-slug>/page-01.webp`, etc.

### Step 9: AI Deterrence & TDM Rights Notice
- [ ] Review `content/settings/tdm-policy.md` and set your licensing email.
- [ ] Check `content/settings/pipeline.json` to configure an optional external SSD vault path or keep local `.pipeline-vault`.

### Step 10: Verify & Deploy
- [ ] Run `npm run check && npm run build` to confirm zero errors.
- [ ] Deploy to your host of choice (see [Section 10](#10-deployment--production-build)).

---

## 4. Public Portals & Spatial Experiences

| Route | Feature | Description |
| :--- | :--- | :--- |
| `/` | **Hero Water Voyage** | Interactive 2D fluid simulation with responsive ripple physics and drifting origami vessel. |
| `/` | **3D Studio Desk** | Tactile drafting surface with draggable sheets, inspection loupe, and grid rulers. |
| `/works` | **Archival Folio Index** | Filterable archive supporting Product Design, Case Studies, Photo Albums, and Technical Drafts. |
| `/blog` | **Editorial Journal** | Long-form reading room with Markov Marginalia, reading-time tracker, and citation generator. |
| `/inspiration`| **Inspiration Cosmology**| Spatial darkroom plate revealed with interactive torchlight cursor spotlight. |
| `/library` | **Virtual Shelf** | Curated 3D book spine shelf with foil stamping and reading status inspection. |
| `/zines` | **Tactile Flipbook Stand**| Saddle-stitched print reader with authentic page-turning physics and PDF downloads. |
| `/about` | **About & Practice** | Monograph layout presenting core working principles, disciplines, and bio. |
| `/now` | **Now Page** | Inspired by Derek Sivers' `/now` movement, sharing current projects and focus. |
| `/rights` | **Machine-Readable TDM** | EU Directive 2019/790 Article 4(3) opt-out declaration and crawler policy. |

---

## 5. The Studio CMS Suite (`/studio`)

The portfolio includes an in-browser studio authoring environment accessible in development mode at `/studio`:

- **Live Split-Editor** (`/studio/writing`, `/studio/works`): Side-by-side Markdown editing with instant syntax highlighting and live prose preview.
- **Media Library & Pipeline** (`/studio/media`): Drag-and-drop asset management with automatic WebP conversion and AI-protection tagging.
- **3D Desk & Spatial Editors** (`/studio/desk`, `/studio/inspiration`): Visual coordinates repositioning and plate organization.
- **Protocol & AI Governance** (`/studio/protocol`): External SSD vault detection, hardware status, and machine-readable rights auditing.
- **SEO & Identity Studio** (`/studio/protocol/seo`): In-browser editing of meta tags, social preview graphs, and 301 redirect rules.

---

## 6. Content Archetypes & Frontmatter Guide

### 1. Product Design (`archetype: product_design`)
Ideal for software architectures, tools, and digital systems.
```yaml
---
title: "System Architecture Name"
year: "2026"
tags: "systems / algorithms"
description: "Brief summary of the architecture."
thumbnailSrc: "/images/projects/system-hero.webp"
archetype: "product_design"
metadata:
  role: "System Architect"
  techStack: ["C", "Assembly", "POSIX"]
  liveUrl: "https://example.com"
  deliverables: ["CLI Utility", "Memory Allocator"]
gallery:
  - "/images/projects/system-hero.webp"
  - "/images/projects/system-detail.webp"
---
```

### 2. Case Study (`archetype: case_study`)
Ideal for deep technical teardowns and engineering research.
```yaml
---
title: "Subsystem Case Study"
year: "2025"
tags: "kernel / concurrency"
description: "Analysis of lockless concurrency and cacheline contention."
thumbnailSrc: "/images/projects/case-hero.webp"
archetype: "case_study"
metadata:
  role: "Lead Researcher"
  deliverables: ["Concurrency Benchmark", "Architecture Spec"]
gallery:
  - "/images/projects/case-hero.webp"
---
```

### 3. Photo Album (`archetype: photo_album`)
Ideal for documentary photography and optical studies.
```yaml
---
title: "Hardware & Optics Series"
year: "2025"
tags: "photography / optics"
description: "Documentary prime lens series on hardware interconnects."
thumbnailSrc: "/images/projects/optics-hero.webp"
archetype: "photo_album"
metadata:
  camera: "Manual Prime 50mm"
  lens: "50mm f/1.4"
  location: "Pacific Northwest"
gallery:
  - "/images/projects/optics-1.webp"
  - "/images/projects/optics-2.webp"
---
```

### 4. Technical Illustration & Drafting (`archetype: illustration`)
Ideal for schematics, architectural sketches, and visual designs.
```yaml
---
title: "Microprocessor Schematics"
year: "2024"
tags: "schematics / drafting"
description: "Vector drafting studies detailing instruction pipelines."
thumbnailSrc: "/images/projects/schematics-hero.webp"
archetype: "illustration"
metadata:
  medium: "Vector Drafting on Vellum"
  dimensions: "A2 Format"
gallery:
  - "/images/projects/schematics-hero.webp"
---
```

---

## 7. Adversarial AI Defense & TDM Governance

The portfolio includes proactive defenses for visual artists and authors concerned about generative AI scraping:

1. **Hardware / Local Vault Staging**:
   - High-resolution raw masters are placed in `.pipeline-vault/stage-in/` (or on an external secure drive).
   - Assets are run through adversarial perturbation tools (e.g., [University of Chicago Glaze/Nightshade](https://glaze.cs.uchicago.edu/)) to cloak artistic features against style extraction.
   - Perturbed images are moved to `stage-out/` and converted to production WebP formats via `npm run pipeline:process`.
2. **EU DSM Directive Art. 4(3) Machine-Readable Reservation**:
   - HTTP response headers emit `X-TDM-Reservation: 1`.
   - `robots.txt` actively disallows known training crawlers (`GPTBot`, `CCBot`, `ClaudeBot`, `Google-Extended`, etc.).
   - HTML meta tags embed `<meta name="tdm-reservation" content="1">`.

---

## 8. CLI Automation & Helper Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launches local Vite development server with HMR. |
| `npm run build` | Compiles optimized production bundle using SvelteKit adapter. |
| `npm run check` | Runs SvelteKit synchronization and TypeScript typechecking. |
| `npm run pipeline:setup` | Scaffolds vault directories (`stage-in`, `stage-out`, `masters-archive`, `zines`). |
| `npm run pipeline:process` | Converts staged raw images into contextual high-DPI WebP assets. |
| `npm run sync:goodreads` | Fetches and syncs Goodreads RSS favorites into `content/library.json`. |
| `npm run test:security` | Executes the 10-point production security and defensive audit suite. |

---

## 9. Repository Structure

```
├── content/
│   ├── blog/                  # Long-form Markdown essays
│   ├── desk/                  # 3D studio desk plates and captions
│   ├── inspiration.md         # Spatial cosmology nodes and coordinates
│   ├── library.json           # Curated book shelf collection
│   ├── pages/                 # Monograph pages (about.md, now.md)
│   ├── projects/              # Project Markdown entries
│   ├── settings/              # Site configuration (seo.json, pipeline.json, tdm-policy.md)
│   └── zines/                 # Zine manifests and page definitions
├── scripts/                   # Processing, setup, and verification utilities
├── src/
│   ├── hooks.server.ts        # Defensive CSP, redirect engine & studio guards
│   ├── lib/
│   │   ├── components/        # Svelte 5 components (Home, Works, Blog, Common)
│   │   ├── server/            # Content loaders, SEO helpers & pipeline server
│   │   └── types.ts           # Unified TypeScript interfaces
│   └── routes/                # SvelteKit routing hierarchy & /studio workbench
└── static/
    ├── images/                # Static image assets and avatars
    └── zines/                 # Zine high-resolution page WebPs
```

---

## 10. Deployment & Production Build

The template uses `@sveltejs/adapter-auto`, allowing zero-configuration deployments on most modern web platforms:

### Vercel
Push your repository to GitHub and import it on [Vercel](https://vercel.com). SvelteKit is auto-detected.

### Cloudflare Pages
Install `@sveltejs/adapter-cloudflare`, update `svelte.config.js`, and connect your repository to Cloudflare Pages.

### Node.js Server / Docker
Install `@sveltejs/adapter-node`, update `svelte.config.js`, run `npm run build`, and launch with `node build/index.js`.

### Securing Studio in Production
Studio CMS (`/studio`) is disabled in production by default. To enable secure authenticated access in production, set the following environment variables:
```bash
STUDIO_ENABLED=true
STUDIO_AUTH_TOKEN="your-secure-random-token"
```

---

## 11. License & Rights Notice

- **Software Codebase**: Open-source and released under the **MIT License**.
- **Editorial Prose & Technical Plates**: Copyright © Linus Torvalds / Site Owner.
- **Machine-Readable Rights**: Expressly reserved against Text & Data Mining (TDM) and AI training under EU Directive 2019/790 Article 4(3).