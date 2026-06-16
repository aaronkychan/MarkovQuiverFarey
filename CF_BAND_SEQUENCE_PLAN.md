# Continued-Fraction Band Sequence Tool

## Summary

Build a new top-level mode for entering an integer continued-fraction sequence, computing intermediate convergents `[a0]` through `[a0; ...; an]`, rendering their corresponding bands stacked top-to-bottom, aligning adjacent bands by maximal common overlap, and reporting band-to-band crossing counts as `(+m, -n)`.

## Key Changes

- Add a new app mode beside the current visualizer/comparison mode; existing behavior stays unchanged.
- Add a CF sequence input surface with both one text input accepting comma/space-separated integers and editable parsed integer chips/rows.
- Require at least one integer and compute all convergents from `[a0]` onward.
- Normalize every computed fraction so `q_k > 0`; only `p_k` may be negative.
- For each convergent, show only the fraction, truncated CF, and corresponding band diagram.
- Add direct helper APIs for CF parsing, convergent generation, band construction/lookup, stacked-band geometry, alignment, and band crossing counts.

## Band Alignment And Rendering

- Extract reusable band-diagram geometry from `StringViewer.svelte` so stacked rows share the same letter/turning layout logic without sidebar-only state.
- For adjacent bands, align by longest exact common contiguous block.
- Use substring containment when it holds, but rely on the general maximal-overlap search for pairs where it does not.
- If multiple maximal occurrences exist, use the first occurrence.
- If substring containment fails, fall back to a general maximal-overlap search and cover that in tests, without adding debug UI.

## Band Crossing Detection

- Implement pure-band crossing detection before wiring the UI result.
- Treat each band by its primitive period.
- For `(B1, B2)`, compare directed `B1` against directed `B2`, then directed `B1` against inverse `B2`.
- Because bands are cyclic, search overlaps using repeated primitive periods, extending the finite window as needed until full overlap neighborhoods can be classified.
- Count crossings modulo rotation and reflection. Guard single-vertex overlaps carefully because reflection duplicates can otherwise be overcounted.
- If bands are identical up to rotation/reflection, display `identical`.
- Otherwise display `(+m, -n)`, meaning `m` positive and `n` negative crossings from band one to band two.
- In the stacked sequence, show this count between each consecutive pair.
- Allow selecting any two band rows; show the same result for the selected pair.

## Tests

- Add unit tests for CF parsing and convergents, including `[0;1,1,1,2] -> 0, 1, 1/2, 2/3, 5/8`.
- Add band/alignment tests confirming maximal-overlap alignment for that fixture sequence.
- Add crossing tests using the fixture: from band `0` to band `1`, expect exactly one crossing; sign remains unspecified until confirmed.
- Add band-crossing tests for identical up to rotation/reflection, directed-vs-directed and directed-vs-inverse second-band comparisons, duplicate removal modulo rotation/reflection, and single-vertex overlap duplicate handling.
- Run `bun run check` and a browser smoke test of the new mode.

## Assumptions

- Invalid input handling uses a caught thrown error from the parser/computation layer, shows a concise inline UI error, and also `console.error`.
- The UI stays compact: no raw band words, offsets, or debug candidate lists in the main display.
- The first-row convergent `[a0]` is included, matching the provided fixture sequence starting with `0`.
