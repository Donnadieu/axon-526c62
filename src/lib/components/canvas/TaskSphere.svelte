<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import * as THREE from 'three';
	import type { Task } from '$lib/types/task';
	import type { DueDateStatus } from '$lib/utils/due-date';
	import { selectedTaskId, updateTask } from '$lib/stores/tasks';
	import { orbitControlsRef, cameraRef } from '$lib/stores/camera';
	import { clamp } from '$lib/utils/staleness';
	import { get } from 'svelte/store';
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
	const LERP_SPEED = 6;
	const DRAG_THRESHOLD = 3; // pixels — below this, treat as click

	let hovered = $state(false);
	let pulseElapsed = $state(0);

	// --- Drag state ---
	let dragging = $state(false);
	let didDrag = $state(false);
	let pointerDownScreen = { x: 0, y: 0 };
	let ghostPos = $state<{ x: number; y: number; z: number } | null>(null);

	let scale = $derived(hovered && !dragging ? 1.2 : 1);

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

	let opacity = $derived(dragging ? 0.5 : 1);

	// Overdue pulse animation
	useTask(
		(delta) => {
			pulseElapsed += delta;
		},
		{ running: () => dueDateStatus === 'overdue' }
	);

	// --- Position animation ---
	let currentPos = $state({ x: targetPosition[0], y: targetPosition[1], z: targetPosition[2] });

	const SNAP_THRESHOLD = 0.001;
	let animating = $state(true);

	useTask(
		(delta) => {
			const t = 1 - Math.exp(-LERP_SPEED * delta);
			const dx = targetPosition[0] - currentPos.x;
			const dy = targetPosition[1] - currentPos.y;
			const dz = targetPosition[2] - currentPos.z;

			if (
				Math.abs(dx) < SNAP_THRESHOLD &&
				Math.abs(dy) < SNAP_THRESHOLD &&
				Math.abs(dz) < SNAP_THRESHOLD
			) {
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
		{ running: () => animating && !dragging }
	);

	$effect(() => {
		void targetPosition;
		if (!dragging) {
			animating = true;
		}
	});

	// --- Raycasting helpers (reused across drags) ---
	const { renderer } = useThrelte();
	const dragPlane = new THREE.Plane();
	const raycaster = new THREE.Raycaster();
	const mouseNDC = new THREE.Vector2();
	const intersectPoint = new THREE.Vector3();
	const planeNormal = new THREE.Vector3(0, 0, 1);
	const planePoint = new THREE.Vector3();

	// --- Drag event handlers ---
	function handlePointerDown(e: IntersectionEvent<PointerEvent>) {
		e.stopPropagation();
		pointerDownScreen = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
		didDrag = false;

		window.addEventListener('pointermove', onWindowPointerMove);
		window.addEventListener('pointerup', onWindowPointerUp);
	}

	function onWindowPointerMove(e: PointerEvent) {
		const dx = e.clientX - pointerDownScreen.x;
		const dy = e.clientY - pointerDownScreen.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (!dragging && dist > DRAG_THRESHOLD) {
			dragging = true;
			didDrag = true;
			ghostPos = { x: currentPos.x, y: currentPos.y, z: currentPos.z };

			const controls = get(orbitControlsRef);
			if (controls) controls.enabled = false;

			document.body.style.cursor = 'grabbing';
		}

		if (!dragging) return;

		const camera = get(cameraRef);
		if (!camera) return;

		const canvas = renderer.domElement;
		const rect = canvas.getBoundingClientRect();
		mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
		mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

		planePoint.set(0, 0, targetPosition[2]);
		dragPlane.setFromNormalAndCoplanarPoint(planeNormal, planePoint);

		raycaster.setFromCamera(mouseNDC, camera);

		if (raycaster.ray.intersectPlane(dragPlane, intersectPoint)) {
			currentPos.x = clamp(intersectPoint.x, 1, 10);
			currentPos.y = clamp(intersectPoint.y, 1, 10);
		}
	}

	function onWindowPointerUp() {
		window.removeEventListener('pointermove', onWindowPointerMove);
		window.removeEventListener('pointerup', onWindowPointerUp);

		if (dragging) {
			const newImportance = clamp(Math.round(currentPos.x), 1, 10);
			const newUrgency = clamp(Math.round(currentPos.y), 1, 10);

			currentPos.x = newImportance;
			currentPos.y = newUrgency;

			updateTask({ ...task, importance: newImportance, urgency: newUrgency });

			const controls = get(orbitControlsRef);
			if (controls) controls.enabled = true;

			dragging = false;
			ghostPos = null;
			document.body.style.cursor = hovered ? 'pointer' : 'auto';
		}
	}

	function handleClick(e: IntersectionEvent<MouseEvent>) {
		e.stopPropagation();
		e.nativeEvent.stopPropagation();
		if (didDrag) {
			didDrag = false;
			return;
		}
		selectedTaskId.set(task.id);
	}

	function handlePointerEnter() {
		hovered = true;
		if (!dragging) {
			document.body.style.cursor = 'pointer';
		}
	}

	function handlePointerLeave() {
		hovered = false;
		if (!dragging) {
			document.body.style.cursor = 'auto';
		}
	}

	// Cleanup window listeners on component destroy
	$effect(() => {
		return () => {
			window.removeEventListener('pointermove', onWindowPointerMove);
			window.removeEventListener('pointerup', onWindowPointerUp);
			if (dragging) {
				const controls = get(orbitControlsRef);
				if (controls) controls.enabled = true;
				document.body.style.cursor = 'auto';
			}
		};
	});
</script>

{#if ghostPos}
	<T.Mesh position.x={ghostPos.x} position.y={ghostPos.y} position.z={ghostPos.z}>
		<T.SphereGeometry args={[0.25, 32, 32]} />
		<T.MeshStandardMaterial color={PRIMARY_COLOR} transparent opacity={0.2} />
	</T.Mesh>
{/if}

<T.Mesh
	position.x={currentPos.x}
	position.y={currentPos.y}
	position.z={currentPos.z}
	scale.x={scale}
	scale.y={scale}
	scale.z={scale}
	onclick={handleClick}
	onpointerdown={handlePointerDown}
	onpointerenter={handlePointerEnter}
	onpointerleave={handlePointerLeave}
>
	<T.SphereGeometry args={[0.25, 32, 32]} />
	<T.MeshStandardMaterial {color} {emissive} {emissiveIntensity} transparent {opacity} />
</T.Mesh>
