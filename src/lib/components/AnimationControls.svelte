<script lang="ts">
	let isPlaying = $state(false);

	let {
		onPlay,
		onPause,
		onReset,
		onExport
	}: {
		onPlay?: () => void;
		onPause?: () => void;
		onReset?: () => void;
		onExport?: (inPNG: boolean) => Promise<void>;
	} = $props();

	function handlePlayPause() {
		isPlaying = !isPlaying;
		if (isPlaying) {
			onPlay?.();
		} else {
			onPause?.();
		}
	}

	function handleReset() {
		isPlaying = false;
		onReset?.();
	}

	function handleExportPNG() {
		onExport?.(true);
	}

	function handleExportSVG() {
		onExport?.(false);
	}
</script>

<div>
	<button onclick={handlePlayPause}>
		{isPlaying ? 'Pause' : 'Play'}
	</button>
	<button onclick={handleReset}>Reset</button>
	<button onclick={handleExportPNG}>Export PNG</button>
	<button onclick={handleExportSVG}>Export SVG</button>
</div>
