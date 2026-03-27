<script lang="ts">
	import LensSelector from './LensSelector.svelte';
	import SettingsPanel from './SettingsPanel.svelte';
	import CameraPresets from './CameraPresets.svelte';
	import FlattenToggle from './FlattenToggle.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	let settingsOpen = $state(false);
</script>

<header class="toolbar">
	<div class="toolbar-left">
		<span class="toolbar-title">Axon</span>
		{#if children}
			{@render children()}
		{/if}
	</div>

	<div class="toolbar-center">
		<LensSelector />
	</div>

	<div class="toolbar-right">
		<FlattenToggle />
		<CameraPresets />
		<button
			class="btn btn-sm variant-ghost-surface settings-btn"
			onclick={() => (settingsOpen = !settingsOpen)}
			aria-label="Settings"
			aria-expanded={settingsOpen}
		>
			&#9881;
		</button>
		{#if settingsOpen}
			<SettingsPanel onclose={() => (settingsOpen = false)} />
		{/if}
	</div>
</header>

<style>
	.toolbar {
		height: 48px;
		display: flex;
		align-items: center;
		padding: 0 16px;
		background-color: #1e293b;
		border-bottom: 1px solid #334155;
		flex-shrink: 0;
		position: relative;
		z-index: 10;
	}

	.toolbar-left {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
		overflow: visible;
	}

	.toolbar-title {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.125rem;
		font-weight: 700;
		color: #f8fafc;
	}

	.toolbar-center {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toolbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		justify-content: flex-end;
	}

	.settings-btn {
		background: none;
		border: none;
		color: #94a3b8;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		transition: color 0.15s ease, background-color 0.15s ease;
	}

	.settings-btn:hover {
		color: #f8fafc;
		background-color: #334155;
	}
</style>
