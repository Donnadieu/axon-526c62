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
		background-color: #0f172a;
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
		color: #94a3b8;
		background-color: transparent;
	}

	.lens-btn:hover:not(.active) {
		color: #cbd5e1;
		background-color: #1e293b;
	}

	.lens-btn.active {
		color: #f8fafc;
		background-color: #6d28d9;
	}
</style>
