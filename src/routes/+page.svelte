<script lang="ts">
	import Canvas3D from '$lib/components/canvas/Canvas3D.svelte';
</script>

<div class="app-layout">
	<header class="toolbar">
		<span class="toolbar-title">Axon</span>
	</header>

	<main class="viewport">
		<div class="canvas-area">
			<Canvas3D />
		</div>
		<aside class="inspector-panel"></aside>
	</main>
</div>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}

	.toolbar {
		height: 48px;
		display: flex;
		align-items: center;
		padding: 0 16px;
		background-color: #1e293b;
		border-bottom: 1px solid #334155;
		flex-shrink: 0;
	}

	.toolbar-title {
		font-family: 'Space Grotesk', sans-serif;
		font-size: 1.125rem;
		font-weight: 700;
		color: #f8fafc;
	}

	.viewport {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.canvas-area {
		flex: 3;
		min-width: 0;
	}

	.inspector-panel {
		width: 0;
		flex-shrink: 0;
		background-color: #1e293b;
		border-left: 1px solid #334155;
		transition: width 0.2s ease;
	}
</style>
