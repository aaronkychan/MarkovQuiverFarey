# Project Orientation

This is a SvelteKit/Svelte 5 app for visualizing the Farey tessellation, associating Farey vertices to Markov/quiver strings, and comparing selected strings for crossings. The old planning prompt at `.github/prompts/planning.prompt.md` is historical only; use the source files below as the current truth.

## Quick Start

- Install/run tooling with Bun; the lockfile is `bun.lock`.
- `bun run dev` starts the Vite dev server.
- `bun run check` runs `svelte-kit sync` and `svelte-check`.
- `bun run lint` runs Prettier check and ESLint.

The generated SvelteKit files are in the usual places:

- `src/routes/+page.svelte` is the app shell.
- `src/lib/components/` contains the UI.
- `src/lib/math/` contains the math/string logic.
- `src/lib/context/keys.svelte.ts` contains shared UI state.

## Current User Flow

The app starts in comparison mode because `DataState.inComparison` defaults to `true`.

1. `src/routes/+page.svelte` creates `new DataState(depth)` for the selected tessellation depth.
2. `DataState` calls `generateFareyTriangles(depth)` in `src/lib/math/farey.ts`.
3. `HyperbolicCanvas.svelte` renders the Poincare disk, Farey geodesics, dual graph, and clickable vertex labels.
4. Clicking vertices updates `dataState.selected[0]` and `dataState.selected[1]`.
5. In comparison mode, `ComparisonPanel.svelte` turns each selected vertex into `PointData` with `FareyPointToCFData(...)`.
6. The comparison panel lets the user choose a string type for each selected fraction and then, when allowed, runs `findCrossings(...)`.
7. If a crossing is found, `CrossingDiagram.svelte` renders the aligned overlap diagram.

## Important Files

### App shell and state

- `src/routes/+page.svelte`
  - Defines depth selection, compare-mode toggle, animation controls, selected triangle state, and vertex-selection handling.
  - Swaps the sidebar between `ComparisonPanel` and `ContinuedFractionPanel`.

- `src/lib/context/keys.svelte.ts`
  - Defines `DataState`.
  - Holds generated `points`, generated `triangles`, comparison mode, current selection slot, and selected vertex IDs.
  - `selected` stores fraction strings such as `0/1`, `1/2`, `1/0`.
  - `getPoint(id)` maps those IDs back to `FareyPoint` objects.

### Farey and geometry

- `src/lib/math/farey.ts`
  - Generates Farey points, layers, sequences, and triangles.
  - Computes regular and negative continued fractions.
  - Assigns each `FareyPoint` a `band` string by concatenating parent bands through the Farey construction.
  - Provides `geomIntersectionNumber(a, b) = |p_a q_b - q_a p_b|`.

- `src/lib/math/hyperbolic.ts`
  - Projects Farey points to the Poincare disk.
  - Computes hyperbolic geodesic SVG arcs.
  - Contains the Mobius-transform animation helpers used when a triangle is selected.

- `src/lib/components/HyperbolicCanvas.svelte`
  - Converts generated triangles and points into SVG paths.
  - Handles clickable triangle regions and clickable vertex labels.
  - Draws the dual graph in red and Farey geodesics in blue.

### Markov/quiver strings and comparison

- `src/lib/math/types.ts`
  - Shared data contracts.
  - Key types: `FareyPoint`, `FareyTriangle`, `InfString`, `NamedInfString`, `PointData`, `Crossing`.
  - `EndType` distinguishes confined strings, pure bands, and strings with band ends.

- `src/lib/math/markov.ts`
  - Main active string implementation.
  - Defines arrow metadata for `a,b,c,x,y,z`, inversion helpers, color helpers, hooks, band-to-string conversion, and crossing detection.
  - `rationalBandToStringCollec(band)` builds the available string collection for a rational band.
  - `FareyPointToCFData(point)` creates sidebar-ready fraction/continued-fraction/string data.
  - `getSequence(infstr, leftRepeat, rightRepeat)` expands an `InfString` into a finite sequence and inserts turning markers.
  - `findCrossings(str1, str2, repeat1?, repeat2?)` currently compares confined strings only.
  - `maximalCommonSubsequence(...)`, `nbhdOfCommonSubsequence(...)`, and `crossingType(...)` are the crossing classifier pipeline.

- `src/lib/math/markov_class.ts`
  - An older/class-based `MarkovString` implementation.
  - It is not currently imported by the main UI. Treat it as experimental or legacy until usage is clarified.

### UI for string data

- `src/lib/components/ComparisonPanel.svelte`
  - The active comparison UI.
  - Only exposes `band`, `ffPlus`, and `ffMinus` in the dropdowns.
  - Enables "Find Crossings" only when both selected strings are `EndType.confined`.
  - Displays geometric intersection number after crossing data is present.

- `src/lib/components/StringViewer.svelte`
  - Renders an `InfString` as left/core/right text and an SVG string diagram.
  - Lets the user add extra visual band copies for band-ended or pure-band strings.
  - This is display-only; extra copies do not feed back into `findCrossings`.

- `src/lib/components/CrossingDiagram.svelte`
  - Renders the two finite crossing sequences returned by `findCrossings`.
  - Aligns the start of the common subsequence and highlights the overlap.

- `src/lib/components/ContinuedFractionPanel.svelte`
  - Single-selection sidebar used outside comparison mode.
  - Lets the user inspect all strings in `pointData.stringCollec`.

## Comparison Data Flow

The current comparison path is:

```text
Farey vertex click
  -> DataState.selected
  -> DataState.getPoint(...)
  -> FareyPointToCFData(...)
  -> rationalBandToStringCollec(point.band)
  -> ComparisonPanel selectedInfString dropdowns
  -> findCrossings(str1, str2)
  -> CrossingDiagram
```

`findCrossings(...)` checks both orientations of the first string:

- `str1`
- `invertInfString(str1)`

It compares each against `str2`, finds maximal matching subsequences, looks at the neighboring letters around each match, and classifies the candidate as `POSITIVE`, `NEGATIVE`, or `NC`.

## Current Limitations And Cautions

- Crossing detection is explicitly limited to `EndType.confined` vs `EndType.confined`. Other end types are represented in the data model but not implemented in `findCrossings`.
- The comparison panel only offers `band`, `ffPlus`, and `ffMinus`, but the "Find Crossings" button appears only when both choices are confined, so `band` cannot be searched directly.
- `continued-fractions.ts` contains simple placeholder utilities and is not the active continued-fraction implementation used by the app; use `farey.ts` first.
- `markov_class.ts` is not part of the active UI path.
- There are several source TODOs around repeatance for non-confined strings, exact string conventions, and export behavior.
- No test suite is present beyond Svelte/TypeScript checking and linting.

## Where To Change Things

- Add or rename selectable comparison string types in `ComparisonPanel.svelte`.
- Change how rational bands produce named strings in `rationalBandToStringCollec(...)` in `markov.ts`.
- Extend crossing support for band-ended strings in `findCrossings(...)`, `getSequence(...)`, and related repeatance logic in `markov.ts`.
- Change rendered string diagrams in `StringViewer.svelte`.
- Change crossing visualization in `CrossingDiagram.svelte`.
- Change Farey generation, CF generation, or geometric intersection numbers in `farey.ts`.
- Change Poincare disk placement, arcs, or animation in `hyperbolic.ts` and `HyperbolicCanvas.svelte`.

