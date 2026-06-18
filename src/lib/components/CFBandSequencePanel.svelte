<script lang="ts">
	import BandSequenceCanvas from './BandSequenceCanvas.svelte';
	import {
		buildCfBandRows,
		countBandCrossings,
		formatBandCrossingCount,
		parseIntegerSequence,
		type CfBandRow
	} from '$lib/math/cf-band-sequence';

	let inputText = $state('0, 1, 1, 1, 2');
	let entries = $state<number[]>([0, 1, 1, 1, 2]);
	let error = $state<string | null>(null);
	let selectedRows = $state<number[]>([]);

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
	}

	function addEntry() {
		entries = [...entries, 1];
		inputText = entries.join(', ');
		selectedRows = [];
	}

	function removeEntry(index: number) {
		if (entries.length === 1) return;
		entries = entries.filter((_, i) => i !== index);
		inputText = entries.join(', ');
		selectedRows = [];
	}

	function toggleRow(index: number) {
		if (selectedRows.includes(index)) {
			selectedRows = selectedRows.filter((i) => i !== index);
		} else {
			selectedRows = [...selectedRows.slice(-1), index].sort((a, b) => a - b);
		}
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
					<span>a{index}</span>
					<input
						type="number"
						value={entry}
						onchange={(event) => updateEntry(index, (event.target as HTMLInputElement).value)}
					/>
					<button aria-label="Remove a{index}" onclick={() => removeEntry(index)}>x</button>
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
			{#if selectedRows.length === 2 && selectedPairCount}
				Selected {rows[selectedRows[0]].fractionLabel} to {rows[selectedRows[1]].fractionLabel}:
				<strong>{formatBandCrossingCount(selectedPairCount)}</strong>
			{:else}
				Select two bands to compare.
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
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.35rem;
		background: white;
		border: 1px solid #e2e8f0;
		border-radius: 6px;
	}

	.entry-chip span {
		font-size: 0.85rem;
		font-weight: 700;
		color: #475569;
	}

	.entry-chip input {
		width: 4.5rem;
	}

	.entry-chip button {
		width: 1.5rem;
		height: 1.5rem;
		line-height: 1;
	}

	.error {
		color: #b91c1c;
		font-weight: 700;
	}

	.selected-pair {
		padding: 0.75rem 1rem;
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		border-radius: 6px;
		color: #064e3b;
	}
</style>
