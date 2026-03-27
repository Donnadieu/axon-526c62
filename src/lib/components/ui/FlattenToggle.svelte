<script lang="ts">
	import { cameraState, toggleFlatten } from '$lib/stores/camera';

	const is2D = $derived($cameraState.is2D);
</script>

<button
	class="flatten-btn"
	class:active={is2D}
	onclick={toggleFlatten}
	aria-pressed={is2D}
	title={is2D ? 'Switch to 3D view' : 'Switch to 2D view'}
>
	{is2D ? '3D' : '2D'}
</button>

<style>
	.flatten-btn {
		padding: 4px 14px;
		font-size: 0.8125rem;
		font-weight: 500;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			color 0.15s ease;
		color: var(--axon-text-secondary);
		background-color: transparent;
	}

	.flatten-btn:hover:not(.active) {
		color: var(--axon-text-subtle);
		background-color: var(--axon-secondary);
	}

	.flatten-btn.active {
		color: var(--axon-foreground);
		background-color: var(--axon-primary);
	}
</style>
