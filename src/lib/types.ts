export type WorkType =
  | 'design'
  | 'product_design'
  | 'photography'
  | 'illustration'
  | 'sketchbook'
  | 'writing'
  | 'experiment';

export type ProjectType = WorkType;

// Backward compatibility alias for existing code
export type ProjectArchetype = WorkType | 'case_study' | 'photo_album' | 'essay';
export type WorkArchetype = ProjectArchetype;

export interface ZinePage {
  src: string;
  alt: string;
  pageNumber: number;
  title?: string;
}

export interface ZineItem {
  id: string; // slug identifier
  title: string;
  subtitle?: string;
  year?: string;
  edition?: string;
  printSpecs?: string;
  description?: string;
  coverSrc: string;
  pageCount: number;
  aspectRatio: number; // width / height (e.g. 0.707 for A5 portrait, 1.0 for square)
  texture?: 'matte' | 'risograph-matte' | 'glossy' | 'kraft';
  binding?: 'saddle-stitch' | 'perfect-bound' | 'spiral';
  pages: ZinePage[];
  downloadPdfUrl?: string;
  aiProtected?: boolean;
}

export interface ProjectMetadata {
  client?: string;
  role?: string;
  deliverables?: string[];
  liveUrl?: string;
  prototypeUrl?: string;
  techStack?: string[];
  camera?: string;
  lens?: string;
  location?: string;
  medium?: string;
  dimensions?: string;
  publishDate?: string;
  readingTime?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  year?: string;
  tags?: string;
  projectType: ProjectType;
  archetype?: ProjectArchetype;
  featured?: boolean;
  description?: string;
  seoDescription?: string;
  seoTitle?: string;
  noIndex?: boolean;
  thumbnailType?: string;
  thumbnailSrc?: string;
  ogImage?: string;
  gallery?: string[];
  body?: string;
  searchableContent?: string;
  // Specific Archetype / Type Metadata
  client?: string;
  role?: string;
  deliverables?: string[];
  liveUrl?: string;
  prototypeUrl?: string;
  techStack?: string[];
  camera?: string;
  lens?: string;
  location?: string;
  medium?: string;
  dimensions?: string;
  publishDate?: string;
  readingTime?: string;
  // Presentation & Layout Controls
  aspectRatio?: string;
  cardSpan?: string;
  badgeLabel?: string;
}

export type WorkMetadata = ProjectMetadata;
export type WorkItem = ProjectItem;

export interface SketchItem {
  id: number;
  title: string;
  src: string;
  x: number;
  y: number;
  width: number;
}

export interface NowPageData {
  title?: string;
  subtitle?: string;
  quote?: string;
  body?: string;
}

export interface AboutSocialLink {
  platform: string;
  url: string;
}

export interface AboutPrinciple {
  title: string;
  description: string;
}

export interface AboutDiscipline {
  area: string;
  details: string;
}

export interface AboutPageData {
  title?: string;
  portraitImage?: string;
  socialLinks?: AboutSocialLink[];
  principles?: AboutPrinciple[];
  disciplines?: AboutDiscipline[];
  body?: string;
}

export interface DeskSheetItem {
  id: string | number;
  title: string;
  caption?: string;
  src: string;
  initialX?: number;
  initialY?: number;
  initialRotation?: number;
  aspectRatio?: number;
}

export interface DeskPageData {
  title?: string;
  sheets: DeskSheetItem[];
}

export interface InspirationNode {
  id: string | number;
  title: string;
  category?: string;
  quote?: string;
  x: number;
  y: number;
}

export interface InspirationData {
  title?: string;
  description?: string;
  nodes: InspirationNode[];
  body?: string;
}

export interface BookItem {
  id: string;
  bookId?: string;
  title: string;
  author: string;
  rating?: number;
  userReview?: string;
  quoteSnippet?: string;
  coverUrl: string;
  goodreadsUrl: string;
  notesSlug?: string;
  publishYear?: string;
  spineColor?: string;
  spineTextColor?: string;
  pattern?: 'gold-leaf' | 'classic' | 'minimal' | 'vintage';
  height?: number;
  thickness?: number;
  orientation?: 'upright' | 'leaning' | 'horizontal';
  leanAngle?: number;
}

export interface LibraryData {
  title?: string;
  description?: string;
  lastSynced?: string;
  goodreadsUrl?: string;
  onTopOfMyMind?: string[];
  books: BookItem[];
}

export interface AuthorProfile {
  name: string;
  jobTitle: string;
  location: string;
  bio: string;
  avatar: string;
  url: string;
  sameAs: string[];
}

export interface AiDeterrenceConfig {
  reserveRights: boolean;
  blockTrainingCrawlers: boolean;
  allowSearchIndexers: boolean;
  tdmPolicyUrl: string;
  customRobotsRules?: string;
  tdmPolicyContent?: string;
  effectiveDate?: string;
}

export interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302;
}

export interface SeoSettings {
  siteTitle: string;
  titleTemplate: string;
  defaultDescription: string;
  siteUrl: string;
  defaultOgImage: string;
  twitterHandle: string;
  author: AuthorProfile;
  redirects: RedirectRule[];
}

export interface CorpusWord {
  word: string;
  count: number;
  essayIds: string[];
  samplePhrase?: string;
}

export interface LinguisticCorpus {
  stats: {
    totalWords: number;
    uniqueWords: number;
    essayCount: number;
  };
  vocabulary: CorpusWord[];
  markovTransitions: Record<string, string[]>;
  phrases: Array<{ text: string; essayId: string; essayTitle: string }>;
}


