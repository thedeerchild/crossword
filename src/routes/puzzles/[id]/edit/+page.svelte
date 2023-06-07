<script lang="ts">
	import Board from '$lib/components/Board.svelte';
	import Clues from '$lib/components/Clues.svelte';
	import { Grid } from '$lib/models/grid';
	import { gridStore } from '$lib/stores/grid';
	import type { PageData } from './$types';

	export let data: PageData;

	$: console.log({ data });
	$: data.grid && gridStore.set(Grid.fromJSON(data.grid));
</script>

<div class="flex flex-col sm:flex-row max-h-full p-4">
	<div class="flex-grow-0 w-full sm:max-w-sm sm:min-w-[50%] lg:min-w-[480px]">
		<Board grid={$gridStore} />
	</div>
	<div class="flex-grow sm:ml-4 max-h-full overflow-y-scroll flex flex-col lg:flex-row bg-white">
		<div class="flex-grow lg:max-w-[50%] p-4">
			<Clues direction="across" locations={$gridStore.words.across} />
		</div>
		<div class="flex-grow lg:max-w-[50%] p-4">
			<Clues direction="down" locations={$gridStore.words.down} />
		</div>
	</div>
</div>
