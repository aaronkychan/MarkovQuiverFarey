<script lang="ts">
	let {
		onCenter,
		onReset
		// onExport
	}: {
		onCenter?: () => void;
		onReset?: () => void;
		// onExport?: (inPNG: boolean) => Promise<void>;
	} = $props();

	function handleReset() {
		onReset?.();
	}

	// function handleExportPNG() {
	// 	onExport?.(true);
	// }

	// function handleExportSVG() {
	// 	onExport?.(false);
	// }
</script>

<div>
	<button onclick={() => onCenter?.()}>Center triangle</button>
	<button onclick={handleReset}>Reset</button>
	<!-- <button onclick={handleExportPNG}>Export PNG</button>
	<button onclick={handleExportSVG}>Export SVG</button> -->
</div>

<style>
	div {
		display: flex;
		justify-content: flex-end;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}

	button {
		padding: 0.45rem 0.7rem;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		background: white;
		cursor: pointer;
	}
</style>
