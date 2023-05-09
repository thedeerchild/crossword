import { assert, describe, expect, it } from 'vitest';
import { Grid, GridSquare } from './grid';

import type { Direction } from './cursor';

/**
 * Returns an array of elements in a grid diagram, at an index corresponding to their grid index.
 *
 */
function parseGridDiagram(diagram: string) {
	return diagram
		.replaceAll('-', '')
		.replaceAll('|', '')
		.trim()
		.replaceAll(' ', '')
		.replaceAll('\n', '')
		.split('');
}

/**
 * Allows interpreting a capital letter (other than W, which is reserved for walls) as a numerical value for use in assertions about returned indexes.
 */
function base35Decode(char: string) {
	if (char === 'W') {
		throw new Error(
			'Attempted to decode "W" char...did you mean to add special case handling for this square?'
		);
	}
	return '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZ'.split('').indexOf(char);
}

describe('Grid', () => {
	describe('toString()', () => {
		it('represents walls with "W"', () => {
			const s = parseGridDiagram(new Grid([GridSquare.WALL, GridSquare.LETTER], 1).toString());

			expect(s).toHaveLength(2);
			expect(s[0]).toBe('W');
			expect(s[1]).not.toBe('W');
		});

		it('represents spaces with "."', () => {
			const s = parseGridDiagram(new Grid([GridSquare.WALL, GridSquare.LETTER], 1).toString());

			expect(s).toHaveLength(2);
			expect(s[0]).not.toBe('.');
			expect(s[1]).toBe('.');
		});
	});

	describe('fromString()', () => {
		it('parses "W" as walls', () => {
			const s = parseGridDiagram(Grid.fromString('WW\nWW').toString());

			expect(s).toHaveLength(4);
			expect(s).toEqual(['W', 'W', 'W', 'W']);
		});

		describe('handles all ASCII characters except "W" and spacers', () => {
			function forCharRange(start: string, end: string, fn: (char: string) => void) {
				for (let i = start.charCodeAt(0); i < end.charCodeAt(0); i++) {
					fn(String.fromCharCode(i));
				}
			}

			forCharRange('!', ',', (char) => {
				it(`parses "${char}" as a letter space`, () => {
					const s = parseGridDiagram(Grid.fromString(`${char}${char}\n${char}${char}`).toString());

					expect(s).toHaveLength(4);
					expect(s).toEqual(['.', '.', '.', '.']);
				});
			});

			// Skip '-'

			forCharRange('.', 'V', (char) => {
				it(`parses "${char}" as a letter space`, () => {
					const s = parseGridDiagram(Grid.fromString(`${char}${char}\n${char}${char}`).toString());

					expect(s).toHaveLength(4);
					expect(s).toEqual(['.', '.', '.', '.']);
				});
			});

			// Skip 'W'

			forCharRange('X', '{', (char) => {
				it(`parses "${char}" as a letter space`, () => {
					const s = parseGridDiagram(Grid.fromString(`${char}${char}\n${char}${char}`).toString());

					expect(s).toHaveLength(4);
					expect(s).toEqual(['.', '.', '.', '.']);
				});
			});

			// Skip '|'

			it('parses "}" as a letter space', () => {
				const char = '}';
				const s = parseGridDiagram(Grid.fromString(`${char}${char}\n${char}${char}`).toString());

				expect(s).toHaveLength(4);
				expect(s).toEqual(['.', '.', '.', '.']);
			});
		});

		describe('handles spacer chars', () => {
			it('ignores "|" characters', () => {
				const s = parseGridDiagram(Grid.fromString('|||.|W|||||||\nW.|').toString());

				expect(s).toHaveLength(4);
				expect(s).toEqual(['.', 'W', 'W', '.']);
			});

			it('ignores "-" characters', () => {
				const s = parseGridDiagram(Grid.fromString('---.-W-------\nW.-').toString());

				expect(s).toHaveLength(4);
				expect(s).toEqual(['.', 'W', 'W', '.']);
			});

			it('ignores whitespace characters', () => {
				const s = parseGridDiagram(Grid.fromString('   . W       \nW. ').toString());

				expect(s).toHaveLength(4);
				expect(s).toEqual(['.', 'W', 'W', '.']);
			});
		});

		describe('infers grid width', () => {
			describe('uses the length of the first line, if there are newlines', () => {
				[1, 3, 10].forEach((len) => {
					it(`handles line length ${len}`, () => {
						const g = Grid.fromString('.'.repeat(len) + '\n' + '.'.repeat(len * 2) + '\n');

						expect(g.width).toBe(len);
					});
				});
			});

			describe('uses the width for a square, if possible', () => {
				[
					{ size: 1, expect: 1 },
					{ size: 4, expect: 2 },
					{ size: 25, expect: 5 },
					{ size: 100, expect: 10 }
				].forEach((tc) => {
					it(`handles grid size ${tc.size}`, () => {
						const g = Grid.fromString('.'.repeat(tc.size));
						expect(g.width).toBe(tc.expect);
					});
				});
			});

			describe('falls back to ', () => {
				[1, 3, 10].forEach((len) => {
					it(`handles line length ${len}`, () => {
						const g = Grid.fromString('.'.repeat(len));
						expect(g.width).toBe(1);
					});
				});
			});
		});
	});

	describe('getCurrentWordStart()', () => {
		const cases: {
			description: string;
			direction: Direction;
			diagram: string;
		}[] = [
			{
				description: 'starts words on left edge',
				direction: 'across',
				diagram: `
          0000
          4444
          8888
          CCCC
        `
			},
			{
				description: 'starts words on top edge',
				direction: 'down',
				diagram: `
          0123
          0123
          0123
          0123
        `
			},
			{
				description: 'starts words on left walls',
				direction: 'across',
				diagram: `
          W111
          W555
          W999
          WDDD
        `
			},
			{
				description: 'starts words on top walls',
				direction: 'down',
				diagram: `
          WWWW
          4567
          4567
          4567
        `
			},
			{
				description: 'handles slash walls across',
				direction: 'across',
				diagram: `
          0000W
          555W.
          AAWDD
          .WHHH
          WLLLL
        `
			},
			{
				description: 'handles slash walls down',
				direction: 'down',
				diagram: `
          012.W
          012W9
          01WD9
          0WHD9
          W.HD9
        `
			},
			{
				description: 'handles backslash walls across',
				direction: 'across',
				diagram: `
          W1111
          .W777
          AAWDD
          FFFW.
          KKKKW
        `
			},
			{
				description: 'handles backslash walls down',
				direction: 'down',
				diagram: `
          W.234
          5W234
          5BW34
          5BHW4
          5BH.W
        `
			}
		];

		cases.forEach((tc) => {
			it(tc.description, () => {
				const g = Grid.fromString(tc.diagram);
				const expectations = parseGridDiagram(tc.diagram);
				expectations.forEach((expectedIndex, i) => {
					const ws = g.getCurrentWordStart(i);

					if (expectedIndex === 'W' || expectedIndex === '.') {
						// Walls and one-letter runs return their own index as the word start.
						assert.isNull(ws[tc.direction], `should not have received cursor for grid index ${i}`);
					} else {
						assert.equal(
							ws[tc.direction]?.index,
							base35Decode(expectedIndex),
							`incorrect word start index at grid index ${i}`
						);
					}
				});
			});
		});
	});

	describe('getWordLabelForSquare()', () => {
		const cases: {
			description: string;
			diagram: string;
		}[] = [
			{
				description: 'starts words on edges',
				diagram: `
          123456789A
          B.........
          C.........
          D.........
          E.........
          F.........
          G.........
          H.........
          I.........
          J.........
        `
			},
			{
				description: 'starts words on walls',
				diagram: `
          WWWWWWWWWWW
          W123456789A
          WB.........
          WC.........
          WD.........
          WE.........
          WF.........
          WG.........
          WH.........
          WI.........
          WJ.........
        `
			},
			{
				description: 'does not label horizontal, single-letter runs',
				diagram: `
			    1W2
          .W.
          .W.
			  `
			},
			{
				description: 'does not label vertical, single-letter runs',
				diagram: `
			    1..
          WWW
          2..
			  `
			}
		];

		cases.forEach((tc) => {
			it(tc.description, () => {
				const g = Grid.fromString(tc.diagram);
				const expectations = parseGridDiagram(tc.diagram);
				expectations.forEach((expectedLabel, i) => {
					const actual = g.getWordLabelForSquare(i);

					if (expectedLabel === 'W' || expectedLabel === '.') {
						// No label expected, since it's not the start of a word.
						assert.equal(
							actual,
							null,
							`received unexpected word label for square at grid index ${i}`
						);
					} else {
						assert.equal(
							actual && +actual,
							base35Decode(expectedLabel),
							`received incorrect word label for square at grid index ${i}`
						);
					}
				});
			});
		});
	});

	describe('getNextWordStart()', () => {
		const cases: {
			description: string;
			direction: Direction;
			expectedDirection: Direction;
			diagram: string;
		}[] = [
			{
				description: 'across cursor jumps to next row',
				direction: 'across',
				expectedDirection: 'across',
				diagram: `
			    55555
          AAAAA
          FFFFF
          KKKKK
          .....
			  `
			},
			{
				description: 'across cursor wraps to down cursor',
				direction: 'across',
				expectedDirection: 'down',
				diagram: `
          .....
          .....
          .....
          .....
          00000
			  `
			},
			{
				description: 'down cursor jumps to next col',
				direction: 'down',
				expectedDirection: 'down',
				diagram: `
			    1234.
          1234.
          1234.
          1234.
          1234.
			  `
			},
			{
				description: 'down cursor wraps to across cursor',
				direction: 'down',
				expectedDirection: 'across',
				diagram: `
          ....0
          ....0
          ....0
          ....0
          ....0
			  `
			},
			{
				description: 'down cursor jumps over, then down',
				direction: 'down',
				expectedDirection: 'down',
				diagram: `
          13W47
          13.47
          13.47
          13.47
          13.47
			  `
			},
			{
				description: 'lowest down cursor wraps',
				direction: 'down',
				expectedDirection: 'across',
				diagram: `
          ..W..
          ..0..
          ..0..
          ..0..
          ..0..
			  `
			},
			{
				description: 'non-run across squares jump to next valid word start in same direction',
				direction: 'across',
				expectedDirection: 'across',
				diagram: `
          6W6
          W6W
          ...
			  `
			},
			{
				description: 'non-run down squares jump to next valid word start in same direction',
				direction: 'down',
				expectedDirection: 'down',
				diagram: `
          4W4
          W.W
          ...
			  `
			},
			{
				description: 'non-run across squares wrap to next valid word start in other direction',
				direction: 'across',
				expectedDirection: 'down',
				diagram: `
          ...
          0W0
          W0W
			  `
			},
			{
				description: 'non-run down squares wrap to next valid word start in other direction',
				direction: 'down',
				expectedDirection: 'across',
				diagram: `
          .W.
          W.W
          6.6
			  `
			}
		];

		cases.forEach((tc) => {
			it(tc.description, () => {
				const g = Grid.fromString(tc.diagram);
				const expectations = parseGridDiagram(tc.diagram);
				expectations.forEach((expectedIndex, i) => {
					const actual = g.getNextWordStart({ index: i, direction: tc.direction });

					// Ignore "W" and "." for testing purposes.
					if (expectedIndex === '.') {
						return;
					}

					if (expectedIndex === 'W') {
						assert.equal(
							actual.index,
							(i + 1) % expectations.length,
							`received incorrect word start index for square at grid index ${i}`
						);
						return;
					}

					assert.equal(
						actual.index,
						base35Decode(expectedIndex),
						`received incorrect word start index for square at grid index ${i}`
					);

					assert.equal(
						actual.direction,
						tc.expectedDirection,
						`received incorrect word start direction for square at grid index ${i}`
					);
				});
			});
		});
	});

	describe('getPrevWordStart()', () => {
		const cases: {
			description: string;
			direction: Direction;
			expectedDirection: Direction;
			diagram: string;
		}[] = [
			{
				description: 'across cursor jumps to previous row',
				direction: 'across',
				expectedDirection: 'across',
				diagram: `
          .....
          00000
          55555
          AAAAA
          FFFFF
			  `
			},
			{
				description: 'across cursor wraps to down cursor',
				direction: 'across',
				expectedDirection: 'down',
				diagram: `
          44444
          .....
          .....
          .....
          .....
			  `
			},
			{
				description: 'down cursor jumps to previous col',
				direction: 'down',
				expectedDirection: 'down',
				diagram: `
          .0123
          .0123
          .0123
          .0123
          .0123
			  `
			},
			{
				description: 'down cursor wraps to across cursor',
				direction: 'down',
				expectedDirection: 'across',
				diagram: `
          K....
          K....
          K....
          K....
          K....
			  `
			},
			{
				description: 'down cursor jumps over, then up',
				direction: 'down',
				expectedDirection: 'down',
				diagram: `
          .WWW0
          .W4W0
          .74B0
          .74B0
          .74B0
			  `
			},
			{
				description: 'non-run across squares jump to previous valid word start in same direction',
				direction: 'across',
				expectedDirection: 'across',
				diagram: `
          ...
          0W0
          W0W
			  `
			},
			{
				description: 'non-run down squares jump to previous valid word start in same direction',
				direction: 'down',
				expectedDirection: 'down',
				diagram: `
          .W.
          W.W
          4.4
			  `
			},
			{
				description: 'non-run across squares wrap to last valid word start in other direction',
				direction: 'across',
				expectedDirection: 'down',
				diagram: `
          4W4
          W4W
          ...
			  `
			},
			{
				description: 'non-run down squares wrap to last valid word start in other direction',
				direction: 'down',
				expectedDirection: 'across',
				diagram: `
          6W6
          W.W
          ...
			  `
			}
		];

		cases.forEach((tc) => {
			it(tc.description, () => {
				const g = Grid.fromString(tc.diagram);
				const expectations = parseGridDiagram(tc.diagram);
				expectations.forEach((expectedIndex, i) => {
					const actual = g.getPrevWordStart({ index: i, direction: tc.direction });

					// Ignore "W" and "." for testing purposes.
					if (expectedIndex === '.') {
						return;
					}

					if (expectedIndex === 'W') {
						assert.equal(
							actual.index,
							(i + expectations.length - 1) % expectations.length,
							`received incorrect word start index for square at grid index ${i}`
						);
						return;
					}

					assert.equal(
						actual.index,
						base35Decode(expectedIndex),
						`received incorrect word start index for square at grid index ${i}`
					);

					assert.equal(
						actual.direction,
						tc.expectedDirection,
						`received incorrect word start direction for square at grid index ${i}`
					);
				});
			});
		});
	});
});
