import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type {
  ProjectItem,
  ProjectType,
  ProjectArchetype,
  NowPageData,
  AboutPageData,
  DeskPageData,
  DeskSheetItem,
  InspirationData,
  LibraryData,
} from '$lib/types';

export interface PortfolioOrderItem {
  id: string;
  aspectRatio?: string;
  cardSpan?: string;
  badgeLabel?: string;
}

export function parseProjectItem(
  filename: string,
  data: Record<string, unknown>,
  content: string
): ProjectItem {
  const id = filename.replace(/\.md$/, '');

  // Resolve projectType, defaulting to 'design' or mapping legacy archetype
  let projectType: ProjectType = 'design';
  if (typeof data.projectType === 'string') {
    projectType = data.projectType as ProjectType;
  } else if (typeof data.archetype === 'string') {
    if (data.archetype === 'case_study') projectType = 'design';
    else if (data.archetype === 'product_design') projectType = 'product_design';
    else if (data.archetype === 'photo_album') projectType = 'photography';
    else if (data.archetype === 'illustration') projectType = 'illustration';
    else if (data.archetype === 'sketchbook') projectType = 'sketchbook';
    else if (data.archetype === 'essay' || data.archetype === 'writing') projectType = 'writing';
    else projectType = 'experiment';
  }

  return {
    id,
    title: typeof data.title === 'string' ? data.title : id,
    year: data.year !== undefined && data.year !== null ? String(data.year) : '',
    tags: typeof data.tags === 'string' ? data.tags : '',
    projectType,
    archetype: (data.archetype as ProjectArchetype) || projectType,
    featured: typeof data.featured === 'boolean' ? data.featured : undefined,
    description: typeof data.description === 'string' ? data.description : '',
    seoDescription: typeof data.seoDescription === 'string' ? data.seoDescription : '',
    seoTitle: typeof data.seoTitle === 'string' ? data.seoTitle : undefined,
    noIndex: typeof data.noIndex === 'boolean' ? data.noIndex : undefined,
    thumbnailType: typeof data.thumbnailType === 'string' ? data.thumbnailType : 'image',
    thumbnailSrc: typeof data.thumbnailSrc === 'string' ? data.thumbnailSrc : '',
    ogImage: typeof data.ogImage === 'string' ? data.ogImage : '',
    gallery: Array.isArray(data.gallery)
      ? data.gallery.filter((item): item is string => typeof item === 'string')
      : [],
    client: typeof data.client === 'string' ? data.client : undefined,
    role: typeof data.role === 'string' ? data.role : undefined,
    deliverables: Array.isArray(data.deliverables)
      ? data.deliverables.filter((item): item is string => typeof item === 'string')
      : undefined,
    liveUrl: typeof data.liveUrl === 'string' ? data.liveUrl : undefined,
    prototypeUrl: typeof data.prototypeUrl === 'string' ? data.prototypeUrl : undefined,
    techStack: Array.isArray(data.techStack)
      ? data.techStack.filter((item): item is string => typeof item === 'string')
      : undefined,
    camera: typeof data.camera === 'string' ? data.camera : undefined,
    lens: typeof data.lens === 'string' ? data.lens : undefined,
    location: typeof data.location === 'string' ? data.location : undefined,
    medium: typeof data.medium === 'string' ? data.medium : undefined,
    dimensions: typeof data.dimensions === 'string' ? data.dimensions : undefined,
    publishDate: typeof data.publishDate === 'string' ? data.publishDate : undefined,
    readingTime: typeof data.readingTime === 'string' ? data.readingTime : undefined,
    aspectRatio: typeof data.aspectRatio === 'string' ? data.aspectRatio : undefined,
    cardSpan: typeof data.cardSpan === 'string' ? data.cardSpan : undefined,
    badgeLabel: typeof data.badgeLabel === 'string' ? data.badgeLabel : undefined,
    body: content,
  };
}

export function getAllProjects(): ProjectItem[] {
  const projectsDir = path.join(process.cwd(), 'content', 'projects');
  const itemsMap = new Map<string, ProjectItem>();

  // Primary: load from content/projects/
  if (fs.existsSync(projectsDir)) {
    const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.md'));
    for (const filename of files) {
      const filePath = path.join(projectsDir, filename);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      const item = parseProjectItem(filename, data, content);
      itemsMap.set(item.id, item);
    }
  }

  const items = Array.from(itemsMap.values());

  // Apply layout and ordering from portfolio-order.json if present
  const orderFilePath = path.join(process.cwd(), 'content', 'settings', 'portfolio-order.json');
  if (fs.existsSync(orderFilePath)) {
    try {
      const raw = fs.readFileSync(orderFilePath, 'utf-8');
      const orderData = JSON.parse(raw);
      const orderList: PortfolioOrderItem[] = [
        ...(orderData.projects || []),
        ...(orderData.work || []),
        ...(orderData.play || []),
      ];
      if (orderList.length > 0) {
        const orderMap = new Map(orderList.map((entry, idx) => [entry.id, { idx, ...entry }]));
        items.sort((a, b) => {
          const orderA = orderMap.get(a.id)?.idx ?? 999;
          const orderB = orderMap.get(b.id)?.idx ?? 999;
          return orderA - orderB;
        });
        for (const item of items) {
          const override = orderMap.get(item.id);
          if (override) {
            if (override.aspectRatio) item.aspectRatio = override.aspectRatio;
            if (override.cardSpan) item.cardSpan = override.cardSpan;
            if (override.badgeLabel) item.badgeLabel = override.badgeLabel;
          }
        }
      }
    } catch (e) {
      // ignore json parse error
    }
  }

  return items;
}

export const getAllWorks = getAllProjects;

const SLUG_REGEX = /^[a-zA-Z0-9_-]+$/;

export function getProjectBySlug(slug: string): ProjectItem | null {
  if (!slug || typeof slug !== 'string') return null;
  const decodedSlug = decodeURIComponent(slug);
  if (!SLUG_REGEX.test(decodedSlug)) return null;

  const baseDir = path.resolve(process.cwd(), 'content', 'projects');
  const filePath = path.resolve(baseDir, `${decodedSlug}.md`);
  if (!filePath.startsWith(baseDir + path.sep)) return null;

  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    return parseProjectItem(`${decodedSlug}.md`, data, content);
  }

  return null;
}

export const getWorkBySlug = getProjectBySlug;

// Backward compatibility helper for existing code
export function getMarkdownItems(subDirectory: 'work' | 'works' | 'play' | 'blog' | 'projects'): ProjectItem[] {
  if (subDirectory === 'projects' || subDirectory === 'works') return getAllProjects();
  if (subDirectory === 'work') return getAllProjects().filter((p) => p.featured || p.projectType === 'design' || p.projectType === 'product_design');
  if (subDirectory === 'play') return getAllProjects().filter((p) => p.projectType === 'experiment' || p.projectType === 'illustration');

  const fullPath = path.resolve(process.cwd(), 'content', subDirectory);
  if (!fs.existsSync(fullPath)) return [];

  const files = fs.readdirSync(fullPath);
  return files
    .filter((file) => file.endsWith('.md'))
    .map((filename) => {
      const filePath = path.join(fullPath, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);
      return parseProjectItem(filename, data, content);
    });
}

export function getMarkdownItemBySlug(
  subDirectory: 'work' | 'works' | 'play' | 'blog' | 'projects',
  slug: string
): ProjectItem | null {
  if (subDirectory === 'projects' || subDirectory === 'works' || subDirectory === 'work' || subDirectory === 'play') {
    return getProjectBySlug(slug);
  }

  if (!slug || typeof slug !== 'string') return null;
  const decodedSlug = decodeURIComponent(slug);
  if (!SLUG_REGEX.test(decodedSlug)) return null;

  const fullPath = path.resolve(process.cwd(), 'content', subDirectory);
  if (!fs.existsSync(fullPath)) return null;

  const filePath = path.resolve(fullPath, `${decodedSlug}.md`);
  if (!filePath.startsWith(fullPath + path.sep)) return null;

  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return parseProjectItem(`${decodedSlug}.md`, data, content);
}

export function getNowPageData(): NowPageData | null {
  const filePath = path.join(process.cwd(), 'content', 'pages', 'now.md');
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    title: typeof data.title === 'string' ? data.title : 'Now',
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : undefined,
    quote: typeof data.quote === 'string' ? data.quote : undefined,
    body: content,
  };
}

export function getAboutPageData(): AboutPageData | null {
  const filePath = path.join(process.cwd(), 'content', 'pages', 'about.md');
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    title: typeof data.title === 'string' ? data.title : 'About',
    portraitImage: typeof data.portraitImage === 'string' ? data.portraitImage : undefined,
    socialLinks: Array.isArray(data.socialLinks)
      ? data.socialLinks.map((item: { platform?: unknown; url?: unknown }) => ({
          platform: String(item.platform || ''),
          url: String(item.url || ''),
        }))
      : undefined,
    principles: Array.isArray(data.principles)
      ? data.principles.map((item: { title?: unknown; description?: unknown }) => ({
          title: String(item.title || ''),
          description: String(item.description || ''),
        }))
      : undefined,
    disciplines: Array.isArray(data.disciplines)
      ? data.disciplines.map((item: { area?: unknown; details?: unknown }) => ({
          area: String(item.area || ''),
          details: String(item.details || ''),
        }))
      : undefined,
    body: content,
  };
}

export function getDeskData(): DeskPageData | null {
  const filePath = path.join(process.cwd(), 'content', 'desk', 'desk.md');
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(fileContent);

  const sheets: DeskSheetItem[] = Array.isArray(data.sheets)
    ? data.sheets.map((item: Record<string, unknown>, idx: number) => ({
        id: item.id ? String(item.id) : idx + 1,
        title: typeof item.title === 'string' ? item.title : `Sketch Study ${idx + 1}`,
        caption: typeof item.caption === 'string' ? item.caption : undefined,
        src: typeof item.src === 'string' ? item.src : `/images/sketch-${(idx % 23) + 1}.webp`,
        initialX: typeof item.initialX === 'number' ? item.initialX : undefined,
        initialY: typeof item.initialY === 'number' ? item.initialY : undefined,
        initialRotation: typeof item.initialRotation === 'number' ? item.initialRotation : undefined,
        aspectRatio: typeof item.aspectRatio === 'number' ? item.aspectRatio : undefined,
      }))
    : [];

  return {
    title: typeof data.title === 'string' ? data.title : '3D Studio Desk',
    sheets,
  };
}

export function getInspirationData(): InspirationData | null {
  const filePath = path.join(process.cwd(), 'content', 'inspiration.md');
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(fileContent);

  return {
    title: typeof data.title === 'string' ? data.title : 'Inspiration',
    description: typeof data.description === 'string' ? data.description : undefined,
    nodes: Array.isArray(data.nodes)
      ? data.nodes.map((n: Record<string, unknown>) => ({
          id: String(n.id ?? ''),
          title: String(n.title ?? ''),
          category: String(n.category ?? ''),
          quote: typeof n.quote === 'string' ? n.quote : undefined,
          x: typeof n.x === 'number' ? n.x : 0,
          y: typeof n.y === 'number' ? n.y : 0,
        }))
      : [],
    body: content,
  };
}

export function getLibraryData(): LibraryData | null {
  const filePath = path.join(process.cwd(), 'content', 'library.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error reading library.json:', err);
    }
    return null;
  }
}
