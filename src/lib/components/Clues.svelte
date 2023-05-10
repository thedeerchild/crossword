<script lang="ts" context="module">
	type WordId = `${string}-${string}`;
	function makeWordId(loc: GridWord): WordId {
		return `${loc.index}-${loc.length}`;
	}

	type Content = {
		id: string;
		index: number;
		label: number;
		value: string;
	};

	type ClueData = { [key: WordId]: Content };
</script>

<script lang="ts">
	import { puzzleCursorsStore, type Direction, type PuzzleCursors } from '$lib/stores/cursor';
	import { gridStore, type GridWord } from '$lib/stores/grid';

	export let direction: Direction;
	export let locations: GridWord[] = [];

	let clues: ClueData = {};
	let clueContent: Content[] = [];

	$: diffLocations(locations);
	function diffLocations(newLocations: GridWord[]) {
		if (
			newLocations.length === Object.keys(clues).length &&
			newLocations.every((x) => !!clues[makeWordId(x)])
		) {
			return;
		}

		let newClues: ClueData = {};
		for (let loc of newLocations) {
			const wordId = makeWordId(loc);

			if (clues[wordId]) {
				newClues[wordId] = { ...clues[wordId], label: loc.label };
			} else {
				newClues[wordId] = {
					id: crypto.randomUUID(),
					index: loc.index,
					label: loc.label,
					value: ''
				};
			}
		}

		clues = newClues;
		clueContent = Object.values(clues).sort((a, b) => a.label - b.label);
	}

	function isPrimary(puzzleCursors: PuzzleCursors, clue: Content) {
		return (
			puzzleCursors[direction]?.descriptor.label === clue.label &&
			puzzleCursors[direction]?.type === 'primary'
		);
	}

	function isSecondary(puzzleCursors: PuzzleCursors, clue: Content) {
		return (
			puzzleCursors[direction]?.descriptor.label === clue.label &&
			puzzleCursors[direction]?.type === 'secondary'
		);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.code === 'Enter') {
			const inputs = document.querySelectorAll<HTMLInputElement>('.clue-input');
			const curIdx = [...inputs].findIndex((x) => x === e.currentTarget);
			const nextIdx = (curIdx + 1) % inputs.length;
			inputs.item(nextIdx).focus();
		}
	}
</script>

<div class="clue-section">
	<h2>{direction.charAt(0).toUpperCase() + direction.slice(1)}</h2>
	<ul>
		{#each clueContent as clue (clue.id)}
			<li
				class="border-blue-300"
				class:bg-blue-300={isPrimary($puzzleCursorsStore, clue)}
				class:border-l-8={isSecondary($puzzleCursorsStore, clue)}
			>
				<label class="py-1">
					<input
						class="clue-input"
						bind:value={clue.value}
						on:focus={(e) => {
							puzzleCursorsStore.setPrimaryClueCursor($gridStore, { direction, index: clue.index });
						}}
						on:blur={(e) => {
							puzzleCursorsStore.setPrimaryClueCursor($gridStore, null);
						}}
						on:keydown={handleKeyDown}
					/>
					<span class="value">{clue.label}: {clue.value}</span>
				</label>
			</li>
		{/each}
	</ul>
</div>

<style lang="postcss">
	.clue-section {
		color: rgba(var(--theme-font-color-base));
	}

	.clue-input {
		@apply sr-only;
	}

	.value {
		@apply block py-1 px-2 text-base;
	}

	.clue-input:focus {
		@apply not-sr-only w-full py-1 px-2 text-base bg-white;
	}

	.clue-input:focus + .value {
		@apply hidden;
	}
</style>
