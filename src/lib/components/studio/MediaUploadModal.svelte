<script lang="ts">
  import {
    Upload,
    X,
    FileImage,
    Shield,
    Camera,
    Layout,
    Layers,
    FolderPlus,
    Check,
    AlertCircle,
    RefreshCw,
    Tag
  } from '@lucide/svelte';

  interface Props {
    isOpen: boolean;
    onclose: () => void;
    onsuccess: () => void;
  }

  let { isOpen = false, onclose, onsuccess }: Props = $props();

  interface StagedFile {
    id: string;
    file: File;
    previewUrl: string;
    originalName: string;
    customName: string;
    classification: 'art' | 'photography' | 'product_ui' | 'standard';
    subfolder: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
  }

  let stagedFiles = $state<StagedFile[]>([]);
  let isDragging = $state(false);
  let isSubmitting = $state(false);
  let overallError = $state<string | null>(null);

  function resetModal() {
    for (const f of stagedFiles) {
      URL.revokeObjectURL(f.previewUrl);
    }
    stagedFiles = [];
    isDragging = false;
    isSubmitting = false;
    overallError = null;
  }

  function handleClose() {
    if (isSubmitting) return;
    resetModal();
    onclose();
  }

  function stageFileObjects(files: FileList | File[]) {
    const next: StagedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const rawExt = file.name.substring(file.name.lastIndexOf('.'));
      const rawBase = file.name.substring(0, file.name.lastIndexOf('.'));
      const cleanBase = rawBase.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

      // Guess classification initially from name keywords
      let initialClass: 'art' | 'photography' | 'product_ui' | 'standard' = 'standard';
      const lower = file.name.toLowerCase();
      if (lower.includes('sketch') || lower.includes('draw') || lower.includes('art') || lower.includes('figure')) {
        initialClass = 'art';
      } else if (lower.includes('photo') || lower.includes('monsoon') || lower.includes('street') || lower.includes('leica')) {
        initialClass = 'photography';
      } else if (lower.includes('ui') || lower.includes('unchoice') || lower.includes('matrix')) {
        initialClass = 'product_ui';
      }

      next.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        originalName: file.name,
        customName: cleanBase,
        classification: initialClass,
        subfolder: '',
        status: 'pending',
      });
    }

    stagedFiles = [...stagedFiles, ...next];
  }

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      stageFileObjects(input.files);
    }
    input.value = '';
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer && e.dataTransfer.files) {
      stageFileObjects(e.dataTransfer.files);
    }
  }

  function removeStagedFile(id: string) {
    const target = stagedFiles.find((f) => f.id === id);
    if (target) {
      URL.revokeObjectURL(target.previewUrl);
    }
    stagedFiles = stagedFiles.filter((f) => f.id !== id);
  }

  function appendTag(id: string, tag: 'art' | 'photo') {
    const item = stagedFiles.find((f) => f.id === id);
    if (!item) return;

    const suffix = tag === 'art' ? '-art' : '-photo';
    if (!item.customName.endsWith(suffix)) {
      item.customName = `${item.customName}${suffix}`;
    }
    if (tag === 'art') item.classification = 'art';
    if (tag === 'photo') item.classification = 'photography';
  }

  async function uploadAll() {
    if (stagedFiles.length === 0) return;
    isSubmitting = true;
    overallError = null;

    let hasErrors = false;

    for (const item of stagedFiles) {
      item.status = 'uploading';
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('customName', item.customName);
      formData.append('classification', item.classification);
      formData.append('subfolder', item.subfolder);

      try {
        const res = await fetch('/api/studio/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          item.status = 'error';
          item.error = data.error || 'Upload failed';
          hasErrors = true;
        } else {
          item.status = 'done';
        }
      } catch (err: any) {
        item.status = 'error';
        item.error = err.message || 'Network error';
        hasErrors = true;
      }
    }

    isSubmitting = false;

    if (!hasErrors) {
      onsuccess();
      resetModal();
      onclose();
    } else {
      overallError = 'Some files failed to upload. Inspect errors above.';
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    role="dialog"
    aria-modal="true"
    aria-labelledby="upload-modal-title"
  >
    <div
      class="max-w-3xl w-full bg-[#FAF8F5] rounded-xl border border-[#DCD7CB] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#2C2B29]"
    >
      <!-- Header -->
      <div class="px-6 py-4 bg-[#EAE6DE] border-b border-[#DDD9CE] flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-lg bg-[#2C2B29] text-[#F4F2ED]">
            <Upload size={16} />
          </div>
          <div>
            <h2 id="upload-modal-title" class="text-base font-serif font-medium text-stone-900">
              Upload &amp; Classify Media Assets
            </h2>
            <p class="text-xs font-mono text-stone-500">
              Configure filenames, target subdirectories, and AI/Photography compression intent
            </p>
          </div>
        </div>

        <button
          type="button"
          onclick={handleClose}
          disabled={isSubmitting}
          class="p-1.5 rounded text-stone-400 hover:text-stone-700 hover:bg-[#DDD9CE] transition-colors disabled:opacity-30 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto space-y-6 [scrollbar-width:thin] flex-1">
        <!-- Drag-and-drop Dropzone -->
        <div
          role="button"
          tabindex="0"
          onkeydown={(e) => e.key === 'Enter' && (document.getElementById('modal-file-upload') as HTMLElement)?.click()}
          ondragover={(e) => {
            e.preventDefault();
            isDragging = true;
          }}
          ondragleave={() => (isDragging = false)}
          ondrop={handleDrop}
          class="border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 {isDragging
            ? 'border-amber-600 bg-amber-500/10'
            : 'border-[#DDD9CE] hover:border-stone-400 bg-white'}"
        >
          <input
            id="modal-file-upload"
            type="file"
            accept="image/*"
            multiple
            onchange={handleFileInput}
            class="hidden"
          />
          <div class="w-10 h-10 rounded-full bg-[#EFECE6] text-stone-700 flex items-center justify-center">
            <Upload size={18} />
          </div>
          <div class="text-xs font-mono text-stone-800">
            <label for="modal-file-upload" class="text-amber-800 font-bold hover:underline cursor-pointer">
              Choose files
            </label>
            <span class="text-stone-500"> or drag and drop images here</span>
          </div>
          <p class="text-[11px] font-serif text-stone-400">
            Supports PNG, JPEG, RAW conversions. Set explicit photography and art classifications below.
          </p>
        </div>

        <!-- Overall Error Banner -->
        {#if overallError}
          <div class="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-mono flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{overallError}</span>
          </div>
        {/if}

        <!-- Staged Files List -->
        {#if stagedFiles.length > 0}
          <div class="space-y-3">
            <div class="flex items-center justify-between text-xs font-mono text-stone-600">
              <span class="font-medium">Staged Assets ({stagedFiles.length})</span>
              <span class="text-[11px] text-stone-400">Review &amp; rename before repository commit</span>
            </div>

            <div class="space-y-3">
              {#each stagedFiles as item (item.id)}
                <div class="p-4 bg-white border border-[#DDD9CE] rounded-xl flex flex-col md:flex-row gap-4 transition-all">
                  <!-- Thumbnail preview -->
                  <div class="w-20 h-20 bg-stone-100 rounded-lg overflow-hidden border border-[#EAE6DE] shrink-0 self-start">
                    <img src={item.previewUrl} alt={item.originalName} class="w-full h-full object-cover" />
                  </div>

                  <!-- Details & Controls -->
                  <div class="flex-1 space-y-3 min-w-0">
                    <!-- Filename & Quick Tag Buttons -->
                    <div class="space-y-1">
                      <div class="flex items-center justify-between text-[11px] font-mono text-stone-500">
                        <span>Original: {item.originalName}</span>
                        <button
                          type="button"
                          onclick={() => removeStagedFile(item.id)}
                          disabled={isSubmitting}
                          class="text-red-600 hover:text-red-800 cursor-pointer text-[11px]"
                        >
                          Remove
                        </button>
                      </div>

                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          bind:value={item.customName}
                          disabled={isSubmitting}
                          placeholder="filename-without-extension"
                          class="flex-1 bg-[#FCFBF9] border border-[#DDD9CE] rounded px-2.5 py-1.5 text-xs font-mono text-stone-900 focus:outline-none focus:border-stone-500"
                        />
                        <!-- Quick Append Tags -->
                        <button
                          type="button"
                          onclick={() => appendTag(item.id, 'art')}
                          title="Append -art suffix and set Art intent"
                          class="px-2 py-1 rounded bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 border border-[#DDD9CE] text-[10px] font-mono cursor-pointer transition-colors"
                        >
                          +art
                        </button>
                        <button
                          type="button"
                          onclick={() => appendTag(item.id, 'photo')}
                          title="Append -photo suffix and set Photo intent"
                          class="px-2 py-1 rounded bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 border border-[#DDD9CE] text-[10px] font-mono cursor-pointer transition-colors"
                        >
                          +photo
                        </button>
                      </div>
                    </div>

                    <!-- Target Subfolder & Classification -->
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      <!-- Subfolder selector -->
                      <div class="space-y-1">
                        <label class="text-[10px] text-stone-500 uppercase tracking-wider block">Target Folder</label>
                        <select
                          bind:value={item.subfolder}
                          disabled={isSubmitting}
                          class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500"
                        >
                          <option value="">/static/images/ (Root)</option>
                          <option value="projects">/static/images/projects/</option>
                          <option value="blog">/static/images/blog/</option>
                        </select>
                      </div>

                      <!-- Intent Classification selector -->
                      <div class="space-y-1">
                        <label class="text-[10px] text-stone-500 uppercase tracking-wider block">Asset Intent</label>
                        <select
                          bind:value={item.classification}
                          disabled={isSubmitting}
                          class="w-full bg-[#FCFBF9] border border-[#DDD9CE] rounded px-2 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-500"
                        >
                          <option value="art">🛡️ Fine Art (AI-Protected / Q90)</option>
                          <option value="photography">📷 Documentary Photo (4K / Q89)</option>
                          <option value="product_ui">💻 UI / Case Study (Crisp 1px / Q86)</option>
                          <option value="standard">📦 Standard Editorial (Q84)</option>
                        </select>
                      </div>
                    </div>

                    <!-- Upload State -->
                    {#if item.status === 'uploading'}
                      <div class="text-[11px] font-mono text-amber-700 flex items-center gap-1.5">
                        <RefreshCw size={11} class="animate-spin" />
                        <span>Uploading &amp; recording manifest...</span>
                      </div>
                    {:else if item.status === 'done'}
                      <div class="text-[11px] font-mono text-emerald-700 flex items-center gap-1.5">
                        <Check size={12} />
                        <span>Committed to repository</span>
                      </div>
                    {:else if item.status === 'error'}
                      <div class="text-[11px] font-mono text-red-700 flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        <span>{item.error || 'Failed'}</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer Action Bar -->
      <div class="px-6 py-4 bg-[#EAE6DE] border-t border-[#DDD9CE] flex items-center justify-between shrink-0">
        <button
          type="button"
          onclick={handleClose}
          disabled={isSubmitting}
          class="px-4 py-2 rounded text-xs font-mono text-stone-600 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-40"
        >
          Cancel
        </button>

        <button
          type="button"
          onclick={uploadAll}
          disabled={stagedFiles.length === 0 || isSubmitting}
          class="px-4.5 py-2 rounded bg-[#2C2B29] hover:bg-stone-800 text-[#F4F2ED] text-xs font-mono font-medium shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
          {#if isSubmitting}
            <RefreshCw size={13} class="animate-spin" />
            <span>Uploading ({stagedFiles.length})...</span>
          {:else}
            <Upload size={13} />
            <span>Upload {stagedFiles.length > 0 ? `(${stagedFiles.length}) Assets` : ''}</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
