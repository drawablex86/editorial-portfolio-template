<script lang="ts">
  import { marked } from 'marked';
  import { preprocessEditorialDirectives, sanitizeRenderedHtml } from '$lib/editorialParser';

  interface Props {
    content?: string;
    className?: string;
  }

  let { content = '', className = '' }: Props = $props();

  let processedText = $derived(preprocessEditorialDirectives(content));
  let parsedRaw = $derived(marked.parse(processedText) as string);
  let html = $derived(sanitizeRenderedHtml(parsedRaw));
</script>

<div class={className}>
  {@html html}
</div>
