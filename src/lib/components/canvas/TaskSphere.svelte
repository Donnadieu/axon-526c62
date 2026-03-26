<script lang="ts">
	import { T } from '@threlte/core';
	import type { Task } from '$lib/types/task';
	import { selectedTaskId } from '$lib/stores/tasks';
	import type { IntersectionEvent } from '@threlte/extras';

	interface Props {
		task: Task;
		position: [number, number, number];
		isSelected: boolean;
	}

	const { task, position, isSelected }: Props = $props();

	const PRIMARY_COLOR = 0x6d28d9;
	const SELECTED_COLOR = 0x8b5cf6;
	const HOVER_EMISSIVE = 0x6d28d9;

	let hovered = $state(false);
	let scale = $derived(hovered ? 1.2 : 1);
	let color = $derived(isSelected ? SELECTED_COLOR : PRIMARY_COLOR);
	let emissive = $derived(hovered || isSelected ? HOVER_EMISSIVE : 0x000000);
	let emissiveIntensity = $derived(isSelected ? 0.6 : hovered ? 0.3 : 0);

	function handleClick(e: IntersectionEvent<MouseEvent>) {
		e.stopPropagation();
		selectedTaskId.set(task.id);
	}

	function handlePointerEnter() {
		hovered = true;
		document.body.style.cursor = 'pointer';
	}

	function handlePointerLeave() {
		hovered = false;
		document.body.style.cursor = 'auto';
	}
</script>

<T.Mesh
	position.x={position[0]}
	position.y={position[1]}
	position.z={position[2]}
	scale.x={scale}
	scale.y={scale}
	scale.z={scale}
	onclick={handleClick}
	onpointerenter={handlePointerEnter}
	onpointerleave={handlePointerLeave}
>
	<T.SphereGeometry args={[0.25, 32, 32]} />
	<T.MeshStandardMaterial {color} {emissive} {emissiveIntensity} />
</T.Mesh>
