<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import type { Task } from '$lib/types/task';
	import type { DueDateStatus } from '$lib/utils/due-date';
	import { selectedTaskId } from '$lib/stores/tasks';
	import type { IntersectionEvent } from '@threlte/extras';

	interface Props {
		task: Task;
		position: [number, number, number];
		isSelected: boolean;
		dueDateStatus: DueDateStatus;
	}

	const { task, position, isSelected, dueDateStatus }: Props = $props();

	const PRIMARY_COLOR = 0x6d28d9;
	const SELECTED_COLOR = 0x8b5cf6;
	const WARNING_COLOR = 0xf59e0b;
	const OVERDUE_COLOR = 0xef4444;

	let hovered = $state(false);
	let pulseElapsed = $state(0);

	let scale = $derived(hovered ? 1.2 : 1);

	let baseColor = $derived.by(() => {
		if (dueDateStatus === 'overdue') return OVERDUE_COLOR;
		if (dueDateStatus === 'warning') return WARNING_COLOR;
		if (isSelected) return SELECTED_COLOR;
		return PRIMARY_COLOR;
	});

	let color = $derived(isSelected && dueDateStatus === 'normal' ? SELECTED_COLOR : baseColor);

	let emissive = $derived.by(() => {
		if (dueDateStatus === 'overdue') return OVERDUE_COLOR;
		if (dueDateStatus === 'warning') return WARNING_COLOR;
		if (hovered || isSelected) return PRIMARY_COLOR;
		return 0x000000;
	});

	let emissiveIntensity = $derived.by(() => {
		if (dueDateStatus === 'overdue') {
			return 0.2 + 0.4 * ((Math.sin(pulseElapsed * 4) + 1) / 2);
		}
		if (dueDateStatus === 'warning') return 0.3;
		if (isSelected) return 0.6;
		if (hovered) return 0.3;
		return 0;
	});

	useTask(
		(delta) => {
			pulseElapsed += delta;
		},
		{ running: () => dueDateStatus === 'overdue' }
	);

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
