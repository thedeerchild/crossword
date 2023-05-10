<script lang="ts">
	import Board from './Board.svelte';
	import Clues from './Clues.svelte';
	import { Grid, gridStore } from './grid';

	gridStore.set(
		Grid.fromString(`
      ----------
      |..........|
      |..........|
      |..........|
      |..........|
      |..........|
      |..........|
      |..........|
      |..........|
      |..........|
      |..........|
      ----------
	  `)
	);
</script>

<div class="flex flex-col sm:flex-row max-h-full p-4">
	<div class="flex-grow-0 w-full sm:max-w-sm sm:min-w-[50%] lg:min-w-[480px]">
		<Board grid={$gridStore} />
	</div>
</div>
