<script lang="ts">
	let selectedTriangle = $state('');

	let { onSelectTriangle }: { onSelectTriangle?: (id: string) => void } = $props();

	function handleSelect() {
		if (selectedTriangle) {
			onSelectTriangle?.(selectedTriangle);
		}
	}
</script>

<div>
	<select
		value={selectedTriangle}
		onchange={(e) => {
			selectedTriangle = (e.target as HTMLSelectElement).value;
		}}
	>
		<option value="">Select a triangle</option>
		<option value="1">Triangle 1</option>
		<option value="2">Triangle 2</option>
		<!-- Add more options dynamically -->
	</select>
	<button onclick={handleSelect}>Select</button>
</div>
