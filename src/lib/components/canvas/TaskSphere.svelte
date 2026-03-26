<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import type { Task } from '$lib/types/task';
	import type { DueDateStatus } from '$lib/utils/due-date';
	import { selectedTaskId } from '$lib/stores/tasks';
	import type { IntersectionEvent } from '@threlte/extras';

	interface Props {
		task: Task;
		targetPosition: [number, number, number];
		isSelected: boolean;
		dueDateStatus: DueDateStatus;
	}

	const { task, targetPosition, isSelected, dueDateStatus }: Props = $props();

	const PRIMARY_COLOR = 0x6d28d9;
	const SELECTED_COLOR = 0x8b5cf6;
	const WARNING_COLOR = 0xf59e0b;
	const OVERDUE_COLOR = 0xef4444;
	const LERP_SPEED = 6; // ~500ms to reach target (1 - e^(-6*0.5) ~ 0.95)

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

	// Overdue pulse animation
	useTask(
		(delta) => {
			pulseElapsed += delta;
		},
		{ running: () => dueDateStatus === 'overdue' }
	);

	// Position animation state
	let currentPos = $state({ x: targetPosition[0], y: targetPosition[1], z: targetPosition[2] });

	const SNAP_THRESHOLD = 0.001;

	let animating = $state(true);

	useTask(
		(delta) => {
			const t = 1 - Math.exp(-LERP_SPEED * delta);
			const dx = targetPosition[0] - currentPos.x;
			const dy = targetPosition[1] - currentPos.y;
			const dz = targetPosition[2] - currentPos.z;

			if (Math.abs(dx) < SNAP_THRESHOLD && Math.abs(dy) < SNAP_THRESHOLD && Math.abs(dz) < SNAP_THRESHOLD) {
				currentPos.x = targetPosition[0];
				currentPos.y = targetPosition[1];
				currentPos.z = targetPosition[2];
				animating = false;
				return;
			}

			currentPos.x += dx * t;
			currentPos.y += dy * t;
			currentPos.z += dz * t;
		},
		{ running: () => animating }
	);

	$effect(() => {
		// Re-trigger animation when target changes
		void targetPosition;
		animating = true;
	});

	function handleClick(e: IntersectionEvent<MouseEvent>) {
		e.stopPropagation();
		e.nativeEvent.stopPropagation();
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
	position.x={currentPos.x}
	position.y={currentPos.y}
	position.z={currentPos.z}
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
