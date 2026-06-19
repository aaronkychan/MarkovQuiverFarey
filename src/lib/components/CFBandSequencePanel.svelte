<script lang="ts">
	import { untrack } from 'svelte';
	import BandSequenceCanvas from './BandSequenceCanvas.svelte';
	import {
		buildCfBandRows,
		countBandCrossings,
		parseIntegerSequence,
		type CfBandRow
	} from '$lib/math/cf-band-sequence';
	import type { Fraction } from '$lib/math/types';

	let {
		onSequenceChange
	}: {
		onSequenceChange?: (fractions: Fraction[]) => void;
	} = $props();

	let inputText = $state('0, 1, 1, 1, 2');
	let entries = $state<number[]>([0, 1, 1, 1, 2]);
	let error = $state<string | null>(null);
	let selectedRows = $state<number[]>([]);
	let activeSelectedRow = $state<number | null>(null);
	let showPairwiseTable = $state(false);

	const rowResult = $derived.by<{ rows: CfBandRow[]; error: string | null }>(() => {
		try {
			return { rows: buildCfBandRows(entries), error: null };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Could not build band sequence.';
			console.error(err);
			return { rows: [], error: message };
		}
	});
	const rows = $derived(rowResult.rows);
	const buildError = $derived(rowResult.error);

	$effect(() => {
		const fractions = rows.map((row) => row.fraction);
		untrack(() => onSequenceChange?.(fractions));
	});

	const selectedPairCount = $derived.by(() => {
		if (selectedRows.length !== 2) return null;
		const [first, second] = selectedRows.map((index) => rows[index]);
		if (!first || !second) return null;
		return countBandCrossings(first.fraction, second.fraction, first.band, second.band);
	});

	function syncEntriesFromText() {
		try {
			entries = parseIntegerSequence(inputText);
			error = null;
			selectedRows = [];
			activeSelectedRow = null;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Invalid continued fraction.';
			error = message;
			console.error(err);
		}
	}

	function updateEntry(index: number, value: string) {
		const parsed = Number(value);
		if (!Number.isSafeInteger(parsed)) {
			error = 'All entries must be safe integers.';
			console.error(error);
			return;
		}
		entries[index] = parsed;
		inputText = entries.join(', ');
		selectedRows = [];
		activeSelectedRow = null;
	}

	function addEntry() {
		entries = [...entries, 1];
		inputText = entries.join(', ');
		selectedRows = [];
		activeSelectedRow = null;
	}

	function removeEntry(index: number) {
		if (entries.length === 1) return;
		entries = entries.filter((_, i) => i !== index);
		inputText = entries.join(', ');
		selectedRows = [];
		activeSelectedRow = null;
	}

	function toggleRow(index: number) {
		if (selectedRows.includes(index)) {
			selectedRows = selectedRows.filter((i) => i !== index);
			activeSelectedRow = selectedRows[0] ?? null;
		} else if (selectedRows.length < 2) {
			selectedRows = [...selectedRows, index].sort((a, b) => a - b);
			activeSelectedRow = index;
		} else {
			const rowToReplace = activeSelectedRow ?? selectedRows[1];
			selectedRows = selectedRows.map((row) => (row === rowToReplace ? index : row)).sort((a, b) => a - b);
			activeSelectedRow = index;
		}
	}

	function compactCrossingCount(count: BandCrossingCount): string {
		return `(+${count.positive},-${count.negative})`;
	}
</script>

<section class="cf-band-panel">
	<div class="input-strip">
		<label for="cf-sequence">Continued fraction</label>
		<div class="text-entry">
			<input
				id="cf-sequence"
				bind:value={inputText}
				onkeydown={(event) => {
					if (event.key === 'Enter') syncEntriesFromText();
				}}
			/>
			<button onclick={syncEntriesFromText}>Apply</button>
		</div>
		<div class="entry-list">
			{#each entries as entry, index (index)}
				<div class="entry-chip">
					<div class="entry-chip-header">
						<span>a{index}</span>
						<button aria-label="Remove a{index}" onclick={() => removeEntry(index)}>x</button>
					</div>
					<input
						type="number"
						value={entry}
						onchange={(event) => updateEntry(index, (event.target as HTMLInputElement).value)}
					/>
				</div>
			{/each}
			<button class="add-entry" onclick={addEntry}>+ a</button>
		</div>
		{#if error || buildError}
			<div class="error">{error ?? buildError}</div>
		{/if}
	</div>

	{#if rows.length > 0}
		<div class="selected-pair">
			<div class="selected-pair-summary">
				{#if selectedRows.length > 0}
					<div class="selection-buttons">
						{#each selectedRows as rowIndex (rowIndex)}
							<button
								class:active={activeSelectedRow === rowIndex}
								aria-pressed={activeSelectedRow === rowIndex}
								onclick={() => (activeSelectedRow = rowIndex)}
							>
								{rows[rowIndex].fractionLabel}
							</button>
						{/each}
					</div>
				{/if}
				<div class="selection-result">
					{#if selectedRows.length === 2 && selectedPairCount}
						<strong>{compactCrossingCount(selectedPairCount)}</strong> crossings from
						{rows[selectedRows[0]].fractionLabel} to {rows[selectedRows[1]].fractionLabel}
					{:else}
						Select two bands to compare.
					{/if}
				</div>
				<button
					class="pairwise-toggle"
					aria-expanded={showPairwiseTable}
					onclick={() => (showPairwiseTable = !showPairwiseTable)}
				>
					{showPairwiseTable ? 'Hide pairwise crossings' : 'All pairwise crossings'}
				</button>
			</div>

			{#if showPairwiseTable}
				<div class="pairwise-table-wrapper">
					<table>
						<thead>
							<tr>
								<th scope="col">from \ to</th>
								{#each rows as target (target.index)}
									<th scope="col">{target.fractionLabel}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each rows as source (source.index)}
								<tr>
									<th scope="row">{source.fractionLabel}</th>
									{#each rows as target (target.index)}
										{@const pairCount = countBandCrossings(
											source.fraction,
											target.fraction,
											source.band,
											target.band
										)}
										<td>
											(<span class="positive-count">+{pairCount.positive}</span>,<span
												class="negative-count">-{pairCount.negative}</span
											>)
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>

		<BandSequenceCanvas {rows} {selectedRows} onToggleRow={toggleRow} />
	{/if}
</section>

<style>
	.cf-band-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		font-family: Arial, Helvetica, sans-serif;
	}

	.input-strip {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		background: #f8fafc;
		border: 1px solid #dbe3ef;
		border-radius: 8px;
	}

	label {
		font-weight: 700;
		color: #1f2937;
	}

	.text-entry {
		display: flex;
		gap: 0.5rem;
	}

	.text-entry input {
		flex: 1;
		min-width: 14rem;
	}

	input {
		padding: 0.45rem 0.55rem;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		background: white;
	}

	button {
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		background: white;
		cursor: pointer;
	}

	.text-entry button,
	.add-entry {
		padding: 0.45rem 0.75rem;
		font-weight: 700;
	}

	.entry-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.entry-chip {
		display: grid;
		gap: 0.25rem;
		padding: 0.35rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
	}

	.entry-chip-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.entry-chip span {
		font-size: 0.85rem;
		font-weight: 700;
		color: #475569;
	}

	.entry-chip input {
		width: 4.5rem;
	}

	.entry-chip-header button {
		width: 1.5rem;
		height: 1.5rem;
		line-height: 1;
	}

	.error {
		color: #b91c1c;
		font-weight: 700;
	}

	.selected-pair {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		border-radius: 6px;
		color: #064e3b;
	}

	.selected-pair-summary {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		flex-wrap: wrap;
	}

	.selection-result {
		min-width: 12rem;
	}

	.selection-buttons {
		display: flex;
		gap: 0.35rem;
	}

	.selection-buttons button {
		min-width: 3rem;
		padding: 0.35rem 0.6rem;
		font-weight: 700;
		color: #166534;
	}

	.selection-buttons button.active {
		border-color: #166534;
		background: #166534;
		color: white;
	}

	.pairwise-toggle {
		margin-left: auto;
		padding: 0.4rem 0.7rem;
		font-weight: 700;
		color: #166534;
	}

	.pairwise-table-wrapper {
		width: 100%;
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		font-size: 0.85rem;
	}

	th,
	td {
		padding: 0.45rem 0.6rem;
		border: 1px solid #bbf7d0;
		text-align: center;
		white-space: nowrap;
	}

	th {
		background: #f0fdf4;
		font-weight: 700;
	}

	.positive-count {
		color: #15803d;
		font-weight: 700;
	}

	.negative-count {
		color: #b91c1c;
		font-weight: 700;
	}
</style>
