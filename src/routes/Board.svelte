<script lang="ts">
	import { flipDirection, type Cursor } from './cursor';
	import { Grid, GridSquare } from './grid';

	export let grid: Grid = new Grid(new Array(10 * 10).fill(GridSquare.LETTER));

	let content: (string | null)[] = new Array(grid.squares.length).fill(null);
	let refs = new Array(grid.squares.length).fill(null);
	let cursor: Cursor | null = null;
	let cursorRun: number[] = [];
	let freshFocusShift = false;

	$: cursor && refs[cursor.index]?.focus();
	$: cursorRun = cursor ? grid.getCurrentWordRun(cursor) : [];

	function getCursor(): Cursor {
		if (cursor) {
			return cursor;
		}

		return {
			index: grid.squares.findIndex((x) => x === GridSquare.LETTER),
			direction: 'across'
		};
	}

	function cursorToNextWord() {
		cursor = grid.getNextWordStart(getCursor());
	}

	function incrementCursor(onlyLetters?: boolean) {
		if (!cursor) {
			cursor = getCursor();
			return;
		}

		if (onlyLetters) {
			cursorToNextWord();
		}

		if (cursor.direction === 'across') {
			cursor = { ...cursor, index: (cursor.index + 1) % grid.squares.length };
		} else {
			let next = cursor.index + grid.width;
			if (cursor.index >= grid.squares.length - 1) {
				next = 0;
			}
			if (next >= grid.squares.length) {
				next = (next % grid.squares.length) + 1;
			}
			cursor = { ...cursor, index: next };
		}
	}

	function cursorToPrevWord() {
		cursor = grid.getPrevWordStart(getCursor());
	}

	function decrementCursor(onlyLetters?: boolean) {
		if (!cursor) {
			cursor = {
				index: grid.squares.findLastIndex((x) => x === GridSquare.LETTER),
				direction: 'down'
			};
			return;
		}

		if (onlyLetters) {
			cursorToPrevWord();
		}

		if (cursor.direction === 'across') {
			let next = cursor.index - 1;
			if (next < 0) {
				next = next + grid.squares.length;
			}
			cursor = { ...cursor, index: next };
		} else {
			let next = cursor.index - grid.width;
			if (next < 0) {
				next = next + grid.squares.length;
			}
			cursor = { ...cursor, index: next };
		}
	}

	function handleKeyDown(i: number) {
		return (e: KeyboardEvent) => {
			freshFocusShift = false;

			// Toggle square type.
			if (e.code === 'Space') {
				if (grid.toggleSquare(i)) {
					content[i] = null;
					content[grid.squares.length - 1 - i] = null;
				}

				grid = grid;
			}

			// Toggle cursor direction.
			if (e.code === 'Enter') {
				if (!cursor) {
					return;
				}
				cursor = { ...cursor, direction: flipDirection(cursor?.direction) };
			}

			if (e.code === 'Tab') {
				e.preventDefault();
				if (e.shiftKey) {
					cursorToPrevWord();
				} else {
					cursorToNextWord();
				}
			}

			// Move cursor.
			if (e.code.startsWith('Arrow')) {
				if (!cursor) {
					cursor = getCursor();
					return;
				}

				// Set the cursor in the correct direction automatically when on a wall square.
				if (grid.squares[i] === GridSquare.WALL) {
					if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
						cursor = { ...cursor, direction: 'down' };
					} else {
						cursor = { ...cursor, direction: 'across' };
					}
				}

				// Only move for letter grid.squares if the cursor direction matches
				if (
					(e.code === 'ArrowUp' && cursor.direction === 'down') ||
					(e.code === 'ArrowLeft' && cursor.direction === 'across')
				) {
					decrementCursor();
				} else if (
					(e.code === 'ArrowDown' && cursor.direction === 'down') ||
					(e.code === 'ArrowRight' && cursor.direction === 'across')
				) {
					incrementCursor();
				}

				// Set the cursor direction (no-op if it already matched and we moved).
				if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
					cursor = { ...cursor, direction: 'down' };
				} else {
					cursor = { ...cursor, direction: 'across' };
				}
			}

			// Set letter and advance.
			if (
				(e.code.startsWith('Key') || e.code.startsWith('Digit')) &&
				grid.squares[i] === GridSquare.LETTER
			) {
				content[i] = e.key.toLocaleUpperCase();
				incrementCursor(true);
			}

			// Clear letter or move backwards.
			if (e.code === 'Backspace') {
				if (content[i]) {
					content[i] = null;
				} else {
					decrementCursor(true);
				}
			}
		};
	}

	function handleFocus(i: number) {
		return (e: FocusEvent) => {
			if (!cursor || cursor.index !== i) {
				freshFocusShift = true;
				cursor = { ...getCursor(), index: i };
			}
		};
	}

	function handleBlur(e: FocusEvent) {
		if (!e.relatedTarget || !(e.relatedTarget as HTMLElement).classList.contains('square')) {
			cursor = null;
		}
	}

	function handleClick(i: number) {
		return () => {
			if (!cursor || freshFocusShift) {
				freshFocusShift = false;
				return;
			}

			console.log('click and flip');
			cursor = { ...getCursor(), direction: flipDirection(cursor.direction) };
		};
	}
</script>

<div
	class="grid auto-rows-fr bg-black border gap-px border-black max-w-lg mx-auto"
	style="grid-template-columns: repeat({grid.width}, 1fr);"
>
	{#each grid.squares as square, i (i)}
		{@const label = grid.getWordLabelForSquare(i)}
		<div
			class="square"
			role="textbox"
			class:type-letter={square === GridSquare.LETTER}
			class:type-wall={square === GridSquare.WALL}
			class:type-run={cursorRun.includes(i)}
			tabindex="0"
			on:click={handleClick(i)}
			on:focus={handleFocus(i)}
			on:blur={handleBlur}
			on:keydown={handleKeyDown(i)}
			bind:this={refs[i]}
		>
			{#if label !== null}<span class="cell-label">{label}</span>{/if}
			<span class="cell-content">{content[i] || ''}</span>
		</div>
	{/each}
</div>

<style lang="postcss">
	.square {
		@apply flex items-center justify-center relative;
		aspect-ratio: 1 / 1;
		color: rgba(var(--theme-font-color-base));
	}

	.square:focus,
	.square:focus-visible {
		@apply outline-none;
	}

	.type-letter {
		@apply bg-white;
	}

	.type-run {
		@apply bg-blue-300;
	}

	.type-run:focus {
		@apply bg-yellow-500;
	}

	.type-wall:focus {
		@apply border-4 border-yellow-500 z-10;
	}

	.cell-label {
		@apply absolute top-1 left-1 leading-none;
	}

	.cell-content {
		@apply text-5xl;
	}
</style>
