<script lang="ts">
	import { preferences, setLens } from '$lib/stores/preferences';
	import type { LensMode } from '$lib/types/preferences';

	const LENSES: { value: LensMode; label: string }[] = [
		{ value: 'staleness', label: 'Staleness' },
		{ value: 'fun', label: 'Fun' },
		{ value: 'friction', label: 'Friction' }
	];

	const activeLens = $derived($preferences.activeLens);
</script>

<div class="lens-selector" role="group" aria-label="Z-axis lens">
	{#each LENSES as lens}
		<button
			class="lens-btn"
			class:active={activeLens === lens.value}
			onclick={() => setLens(lens.value)}
			aria-pressed={activeLens === lens.value}
		>
			{lens.label}
		</button>
	{/each}
</div>

<style>
	.lens-selector {
		display: flex;
		gap: 2px;
		background-color: var(--axon-background);
		border-radius: 6px;
		padding: 2px;
	}

	.lens-btn {
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

	.lens-btn:hover:not(.active) {
		color: var(--axon-text-subtle);
		background-color: var(--axon-secondary);
	}

	.lens-btn.active {
		color: var(--axon-foreground);
		background-color: var(--axon-primary);
	}
</style>
