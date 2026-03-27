<script lang="ts">
	import { preferences, setStalenessWindow } from '$lib/stores/preferences';

	interface Props {
		onclose: () => void;
	}

	let { onclose }: Props = $props();

	const stalenessWindow = $derived($preferences.stalenessWindow);

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = Math.min(365, Math.max(7, parseInt(target.value, 10) || 7));
		setStalenessWindow(value);
	}
</script>

<div class="settings-backdrop" onclick={onclose} onkeydown={undefined} role="presentation"></div>

<div class="settings-panel" role="dialog" aria-label="Settings">
	<div class="settings-header">
		<h2 class="settings-title">Settings</h2>
		<button class="settings-close" onclick={onclose} aria-label="Close settings">&times;</button>
	</div>

	<div class="settings-body">
		<div class="setting-group">
			<label class="setting-label" for="staleness-slider">
				Staleness window
				<span class="setting-value">{stalenessWindow} days</span>
			</label>
			<input
				id="staleness-slider"
				type="range"
				min="7"
				max="365"
				step="1"
				value={stalenessWindow}
				oninput={handleInput}
				class="setting-range"
			/>
			<div class="setting-bounds">
				<span>7</span>
				<span>365</span>
			</div>
			<p class="setting-help">
				Number of days until a task reaches maximum staleness (z=10).
			</p>
		</div>
	</div>
</div>

<style>
	.settings-backdrop {
		position: fixed;
		inset: 0;
		z-index: 90;
	}

	.settings-panel {
		position: fixed;
		top: 48px;
		right: 16px;
		width: 300px;
		background-color: var(--axon-secondary);
		border: 1px solid var(--axon-muted);
		border-radius: 8px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		z-index: 100;
	}

	.settings-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border-bottom: 1px solid var(--axon-muted);
	}

	.settings-title {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--axon-foreground);
		margin: 0;
	}

	.settings-close {
		background: none;
		border: none;
		color: var(--axon-text-secondary);
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0 4px;
		line-height: 1;
	}

	.settings-close:hover {
		color: var(--axon-foreground);
	}

	.settings-body {
		padding: 16px;
	}

	.setting-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.setting-label {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--axon-text-subtle);
	}

	.setting-value {
		font-variant-numeric: tabular-nums;
		color: var(--axon-primary);
		font-weight: 600;
	}

	.setting-range {
		width: 100%;
		accent-color: var(--axon-primary);
		cursor: pointer;
	}

	.setting-bounds {
		display: flex;
		justify-content: space-between;
		font-size: 0.6875rem;
		color: var(--axon-text-tertiary);
	}

	.setting-help {
		font-size: 0.75rem;
		color: var(--axon-text-tertiary);
		line-height: 1.4;
		margin: 4px 0 0;
	}
</style>
