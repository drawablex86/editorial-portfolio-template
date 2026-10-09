import type { PageServerLoad, Actions } from './$types';
import { getAllZines, getZineBySlug, saveZineManifest, deleteZine } from '$lib/server/zines';
import { processImageFolderZine, processPdfFile } from '$lib/server/zinePipeline';
import { fail } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export const load: PageServerLoad = async () => {
  const zines = getAllZines();
  return {
    zines,
  };
};

export const actions: Actions = {
  saveMetadata: async ({ request }) => {
    const data = await request.formData();
    const id = data.get('id') as string;
    const title = data.get('title') as string;
    const subtitle = data.get('subtitle') as string;
    const year = data.get('year') as string;
    const edition = data.get('edition') as string;
    const printSpecs = data.get('printSpecs') as string;
    const description = data.get('description') as string;
    const texture = data.get('texture') as any;
    const binding = data.get('binding') as any;

    if (!id || !title) {
      return fail(400, { error: 'ID and Title are required.' });
    }

    const existing = getZineBySlug(id);
    if (!existing) {
      return fail(404, { error: 'Zine not found.' });
    }

    const updated = {
      ...existing,
      title,
      subtitle: subtitle || undefined,
      year: year || undefined,
      edition: edition || undefined,
      printSpecs: printSpecs || undefined,
      description: description || undefined,
      texture: texture || existing.texture,
      binding: binding || existing.binding,
    };

    saveZineManifest(updated);
    return { success: true, message: 'Metadata updated successfully.' };
  },

  deleteZine: async ({ request }) => {
    const data = await request.formData();
    const id = (data.get('id') as string)?.trim();

    if (!id) {
      return fail(400, { error: 'Publication ID is required for deletion.' });
    }

    const success = deleteZine(id);
    if (!success) {
      return fail(500, { error: `Failed to delete publication "${id}".` });
    }

    return { success: true, message: `Publication "${id}" and all extracted spreads were permanently deleted.` };
  },

  importPdf: async ({ request }) => {
    const data = await request.formData();
    const slug = (data.get('slug') as string)?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const title = (data.get('title') as string)?.trim();
    const printSpecs = (data.get('printSpecs') as string)?.trim();
    const pdfFile = data.get('pdf') as File;

    if (!slug || !title) {
      return fail(400, { error: 'Slug and Title are required.' });
    }

    if (!pdfFile || pdfFile.size === 0) {
      return fail(400, { error: 'A valid PDF file is required.' });
    }

    try {
      const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

      // One-click local stripping and WebP generation
      const processed = await processPdfFile(pdfBuffer, slug, { title });

      const newZine = {
        id: slug,
        title,
        subtitle: 'Tactile print publication',
        year: String(new Date().getFullYear()),
        edition: 'First Edition',
        printSpecs: printSpecs || 'Risograph & Textured Newsprint',
        description: `Visual publication extracted and compiled into a tactile flip-book.`,
        coverSrc: processed.pages[0]?.src || '',
        pageCount: processed.pageCount,
        aspectRatio: processed.aspectRatio,
        texture: 'risograph-matte' as const,
        binding: 'saddle-stitch' as const,
        pages: processed.pages,
        downloadPdfUrl: processed.downloadPdfUrl,
        aiProtected: true,
      };

      saveZineManifest(newZine);

      return {
        success: true,
        message: `Successfully stripped PDF into ${processed.pageCount} spreads with aspect ratio ${processed.aspectRatio.toFixed(3)}! Archived to storage vault.`
      };
    } catch (err: any) {
      console.error('[studio-zine-pdf] Ingest error:', err);
      return fail(500, { error: err.message || 'PDF processing failed.' });
    }
  },

  importImages: async ({ request }) => {
    const data = await request.formData();
    const slug = (data.get('slug') as string)?.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const title = (data.get('title') as string)?.trim();
    const printSpecs = (data.get('printSpecs') as string)?.trim();
    const files = data.getAll('images') as File[];

    if (!slug || !title) {
      return fail(400, { error: 'Slug and Title are required.' });
    }

    if (!files || files.length === 0) {
      return fail(400, { error: 'At least one image is required.' });
    }

    try {
      const tempDir = path.join(process.cwd(), 'scratch', 'uploads', slug);
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const tempPaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size === 0) continue;
        const buf = Buffer.from(await file.arrayBuffer());
        const tempPath = path.join(tempDir, `${String(i + 1).padStart(3, '0')}-${file.name}`);
        fs.writeFileSync(tempPath, buf);
        tempPaths.push(tempPath);
      }

      if (tempPaths.length === 0) {
        return fail(400, { error: 'No valid image data uploaded.' });
      }

      // Run pipeline
      const processed = await processImageFolderZine(tempPaths, slug, { title });

      const newZine = {
        id: slug,
        title,
        subtitle: 'Tactile print publication',
        year: String(new Date().getFullYear()),
        edition: 'First Edition',
        printSpecs: printSpecs || 'Risograph & Textured Newsprint',
        description: `Visual exploration compiled into a tactile flip-book.`,
        coverSrc: processed.pages[0]?.src || '',
        pageCount: processed.pageCount,
        aspectRatio: processed.aspectRatio,
        texture: 'risograph-matte' as const,
        binding: 'saddle-stitch' as const,
        pages: processed.pages,
        aiProtected: true,
      };

      saveZineManifest(newZine);

      // Clean up scratch temp files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}

      return { success: true, message: `Successfully created zine with ${processed.pageCount} pages!` };
    } catch (err: any) {
      console.error('[studio-zine] Import error:', err);
      return fail(500, { error: err.message || 'Processing failed.' });
    }
  }
};
