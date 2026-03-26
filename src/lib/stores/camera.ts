import { writable, get } from 'svelte/store';
import { Vector3 } from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PerspectiveCamera } from 'three';

export interface CameraState {
	is2D: boolean;
	activePreset: string | null;
}

export const cameraState = writable<CameraState>({
	is2D: false,
	activePreset: null
});

/** Reference to the active OrbitControls instance for programmatic animation. */
export const orbitControlsRef = writable<OrbitControls | undefined>(undefined);

/** Reference to the active PerspectiveCamera instance. */
export const cameraRef = writable<PerspectiveCamera | undefined>(undefined);

export function toggleFlatten(): void {
	cameraState.update((s) => ({ ...s, is2D: !s.is2D }));
}

export function setPreset(presetName: string): void {
	cameraState.update((s) => ({ ...s, activePreset: presetName }));
}

export function clearPreset(): void {
	cameraState.update((s) => ({ ...s, activePreset: null }));
}

let animationFrameId: number | null = null;

/** Smoothly animate camera position and OrbitControls target over the given duration. */
export function animateCameraTo(
	position: [number, number, number],
	target: [number, number, number],
	duration = 800
): void {
	const maybeCam = get(cameraRef);
	const maybeCtl = get(orbitControlsRef);
	if (!maybeCam || !maybeCtl) return;
	const cam: PerspectiveCamera = maybeCam;
	const ctl: OrbitControls = maybeCtl;

	// Cancel any in-flight animation
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}

	const startPos = cam.position.clone();
	const startTarget = ctl.target.clone();
	const endPos = new Vector3(...position);
	const endTarget = new Vector3(...target);
	const startTime = performance.now();

	function easeInOutCubic(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function tick(): void {
		const elapsed = performance.now() - startTime;
		const raw = Math.min(elapsed / duration, 1);
		const t = easeInOutCubic(raw);

		cam.position.lerpVectors(startPos, endPos, t);
		ctl.target.lerpVectors(startTarget, endTarget, t);
		ctl.update();

		if (raw < 1) {
			animationFrameId = requestAnimationFrame(tick);
		} else {
			animationFrameId = null;
		}
	}

	animationFrameId = requestAnimationFrame(tick);
}
