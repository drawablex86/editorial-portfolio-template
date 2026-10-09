<script lang="ts">
  import LibraryShelfView from '$lib/components/library/LibraryShelfView.svelte';

  import SEOHead from '$lib/components/common/SEOHead.svelte';

  let { data } = $props();
</script>

<SEOHead
  title="Library / The Bookshelf"
  description="Curated personal bookshelf synced from Goodreads — theory, aesthetics, and systems."
/>

<LibraryShelfView libraryData={data.libraryData} />
