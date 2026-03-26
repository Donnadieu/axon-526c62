<script lang="ts">
	import { Canvas } from '@threlte/core';
	import GridRenderer from './GridRenderer.svelte';
	import AxisLabels from './AxisLabels.svelte';
	import Scene from './Scene.svelte';
</script>

<div class="canvas-wrapper">
	<Canvas>
		<Scene />
		<GridRenderer />
		<AxisLabels />
	</Canvas>
</div>

<style>
	.canvas-wrapper {
		width: 100%;
		height: 100%;
	}
</style>
