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
	<div class="flex-grow sm:ml-4 max-h-full overflow-y-scroll flex flex-col lg:flex-row bg-white">
		<div class="flex-grow lg:max-w-[50%] p-4">
			<Clues direction="across" locations={$gridStore.words.across} />
		</div>
		<div class="flex-grow lg:max-w-[50%] p-4">
			<Clues direction="down" locations={$gridStore.words.down} />
		</div>
	</div>
</div>
