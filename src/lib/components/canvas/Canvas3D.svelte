<script lang="ts">
	import { Canvas } from '@threlte/core';
	import GridRenderer from './GridRenderer.svelte';
	import AxisLabels from './AxisLabels.svelte';
	import Scene from './Scene.svelte';
	import TaskSpheres from './TaskSpheres.svelte';
	import GridPlane from './GridPlane.svelte';
	import { selectedTaskId } from '$lib/stores/tasks';

	function handleCanvasClick() {
		selectedTaskId.set(null);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class="canvas-wrapper" onclick={handleCanvasClick}>
	<Canvas>
		<Scene />
		<GridRenderer />
		<AxisLabels />
		<TaskSpheres />
		<GridPlane />
	</Canvas>
</div>

<style>
	.canvas-wrapper {
		width: 100%;
		height: 100%;
	}
</style>
