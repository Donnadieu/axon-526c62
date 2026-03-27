<script lang="ts">
	import { cameraState, setPreset, clearPreset, animateCameraTo } from '$lib/stores/camera';
	import { setLens } from '$lib/stores/preferences';
	import { CAMERA_PRESETS } from '$lib/utils/camera-presets';

	const activePreset = $derived($cameraState.activePreset);

	function handlePresetClick(preset: (typeof CAMERA_PRESETS)[number]) {
		if (activePreset === preset.name) {
			clearPreset();
			return;
		}

		setPreset(preset.name);
		animateCameraTo(preset.position, preset.target);

		if (preset.lens) {
			setLens(preset.lens);
		}
	}
</script>

<div class="preset-group" role="group" aria-label="Camera presets">
	{#each CAMERA_PRESETS as preset}
		<button
			class="preset-btn"
			class:active={activePreset === preset.name}
			onclick={() => handlePresetClick(preset)}
			aria-pressed={activePreset === preset.name}
		>
			{preset.label}
		</button>
	{/each}
</div>

<style>
	.preset-group {
		display: flex;
		gap: 2px;
		background-color: var(--axon-background);
		border-radius: 6px;
		padding: 2px;
	}

	.preset-btn {
		padding: 4px 10px;
		font-size: 0.8125rem;
		font-weight: 500;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
		color: var(--axon-text-secondary);
		background-color: transparent;
	}

	.preset-btn:hover:not(.active) {
		color: var(--axon-text-subtle);
		background-color: var(--axon-secondary);
	}

	.preset-btn.active {
		color: var(--axon-foreground);
		background-color: var(--axon-primary);
	}
</style>
