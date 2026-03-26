import { writable } from 'svelte/store';
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

/** Placeholder for programmatic camera animation (used by presets and flatten toggle). */
export function setCameraPosition(
	_position: [number, number, number],
	_target: [number, number, number]
): void {
	// Will be implemented when camera presets / flatten toggle are built.
}
