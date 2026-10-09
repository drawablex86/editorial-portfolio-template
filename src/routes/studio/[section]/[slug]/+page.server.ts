import { error, redirect, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getStudioFile, saveStudioFile, deleteStudioFile, getLibraryFile, updateBookNotesLink } from '$lib/server/studio';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  if (!dev && !process.env.STUDIO_ENABLED) {
    throw error(404, 'Studio is only accessible in development mode');
  }

  const { section, slug } = params;
  const libraryData = getLibraryFile();
  const libraryBooks = Array.isArray(libraryData?.books) ? libraryData.books : [];

  if (slug === 'new') {
    // Blank template according to section
    const defaultData: Record<string, any> = {
      title: '',
      year: new Date().getFullYear().toString(),
      tags: '',
      description: '',
      thumbnailSrc: '',
    };

    if (section === 'work') {
      defaultData.archetype = 'product_design';
      defaultData.client = '';
      defaultData.role = '';
      defaultData.techStack = [];
      defaultData.liveUrl = '';
      defaultData.prototypeUrl = '';
      defaultData.gallery = [];
    } else if (section === 'play') {
      defaultData.gallery = [];
    } else if (section === 'blog') {
      defaultData.date = new Date().toISOString().split('T')[0];
      defaultData.readTime = '5 min read';
    }

    return {
      section,
      slug: 'new',
      isNew: true,
      data: defaultData,
      content: 'Start writing your markdown content here...\n',
      libraryBooks,
    };
  }

  const file = getStudioFile(section, slug);
  if (!file) {
    throw error(404, `File not found: ${section}/${slug}.md`);
  }

  return {
    section,
    slug,
    isNew: false,
    data: file.data,
    content: file.content,
    libraryBooks,
  };
};

export const actions: Actions = {
  save: async ({ request, params }) => {
    if (!dev && !process.env.STUDIO_ENABLED) {
      throw error(403, 'Forbidden');
    }

    const formData = await request.formData();
    const rawJson = formData.get('payload') as string;
    const targetSlug = (formData.get('targetSlug') as string)?.trim() || params.slug;

    if (!rawJson) {
      return fail(400, { message: 'Missing editor payload' });
    }

    if (!targetSlug || targetSlug === 'new') {
      return fail(400, { message: 'Please provide a valid slug (e.g. project-name)' });
    }

    // Slug sanitize: lowercase, alphanumeric and hyphens
    const cleanSlug = targetSlug
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-');

    try {
      const payload = JSON.parse(rawJson);
      const { frontmatter, body } = payload;

      const result = saveStudioFile(params.section, cleanSlug, frontmatter, body);
      if (!result.success) {
        return fail(500, { message: result.error || 'Failed to save file' });
      }

      // Sync linked book in content/library.json if saving a blog post or project
      if (params.section === 'blog' || params.section === 'projects') {
        if (typeof frontmatter.linkedBookId === 'string' && frontmatter.linkedBookId.trim()) {
          updateBookNotesLink(frontmatter.linkedBookId.trim(), cleanSlug);
        } else {
          // If no linkedBookId in frontmatter, verify if any book had this cleanSlug and detach
          updateBookNotesLink('', cleanSlug);
        }
      }

      // If it was newly created or slug changed, redirect to the new slug's editor
      if (params.slug === 'new' || params.slug !== cleanSlug) {
        throw redirect(303, `/studio/${params.section}/${cleanSlug}?saved=true`);
      }

      return { success: true, savedAt: Date.now() };
    } catch (err: any) {
      if (err.status && err.location) throw err; // rethrow sveltekit redirect
      return fail(500, { message: err.message || 'Serialization error' });
    }
  },

  delete: async ({ params }) => {
    if (!dev && !process.env.STUDIO_ENABLED) {
      throw error(403, 'Forbidden');
    }

    if (params.slug === 'new') {
      throw redirect(303, `/studio`);
    }

    const success = deleteStudioFile(params.section, params.slug);
    if (!success) {
      return fail(500, { message: 'Failed to delete file' });
    }

    throw redirect(303, `/studio`);
  },
};
