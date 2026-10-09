<script lang="ts">
  import InspirationCosmology from '$lib/components/inspiration/InspirationCosmology.svelte';

  import SEOHead from '$lib/components/common/SEOHead.svelte';

  let { data } = $props();
</script>

<SEOHead
  title="Inspiration / Influence Constellation"
  description="Spatial constellation of systems architects, foundational thinkers, and optical concepts guiding Linus Torvalds' practice."
/>

<InspirationCosmology data={data.inspirationData} />
