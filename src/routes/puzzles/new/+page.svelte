<script lang="ts">
	import { enhance } from '$app/forms';

	const sizes = [
		{ name: 'NY Times Mini (5x5)', width: 5 },
		{ name: 'NY Times Saturday Mini (7x7)', width: 7 },
		{ name: 'NY Times Midi (9x9)', width: 9 },
		{ name: 'NY Times Daily (15x15)', width: 15 },
		{ name: 'NY Times Sunday (21x21)', width: 22 }
	];
</script>

<div class="flex">
	<form method="POST" use:enhance>
		<label for="name">Name</label>
		<input class="input" name="name" type="text" />
		<label for="width">Width</label>
		<select name="width" class="select">
			{#each sizes as size}
				<option value={size.width}>{size.name}</option>
			{/each}
		</select>
		<button type="submit" class="btn variant-filled-primary">New Puzzle</button>
	</form>
</div>
