<script lang="ts">
	import LensSelector from './LensSelector.svelte';

	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
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
		<!-- Placeholders for FlattenToggle and CameraPresets -->
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
	}

	.toolbar-left {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
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
</style>
