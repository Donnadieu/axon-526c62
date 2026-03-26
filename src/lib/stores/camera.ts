import { writable } from 'svelte/store';

export interface CameraState {
	is2D: boolean;
	activePreset: string | null;
}

export const cameraState = writable<CameraState>({
	is2D: false,
	activePreset: null
});

export function toggleFlatten(): void {
	cameraState.update((s) => ({ ...s, is2D: !s.is2D }));
}

export function setPreset(presetName: string): void {
	cameraState.update((s) => ({ ...s, activePreset: presetName }));
}

export function clearPreset(): void {
	cameraState.update((s) => ({ ...s, activePreset: null }));
}
