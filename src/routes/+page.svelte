<script lang="ts">
	import Board from './Board.svelte';
	import { Grid, GridSquare } from './grid';

	// prettier-ignore
	let grid = Grid.fromString(`
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
</script>

<Board {grid} />
<input />
