<script lang="ts">
	let isPlaying = $state(false);

	let {
		onPlay,
		onPause,
		onReset
	}: { onPlay?: () => void; onPause?: () => void; onReset?: () => void } = $props();

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
</script>

<div>
	<button onclick={handlePlayPause}>
		{isPlaying ? 'Pause' : 'Play'}
	</button>
	<button onclick={handleReset}>Reset</button>
</div>
