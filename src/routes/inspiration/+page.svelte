<script lang="ts">
  import InspirationCosmology from '$lib/components/inspiration/InspirationCosmology.svelte';

  import SEOHead from '$lib/components/common/SEOHead.svelte';

  let { data } = $props();
</script>

<SEOHead
  title="Inspiration / Influence Constellation"
  description="Spatial constellation of intellectual influences, artistic references, and visual thinkers guiding Linus Torvalds's practice."
/>

<InspirationCosmology data={data.inspirationData} />
