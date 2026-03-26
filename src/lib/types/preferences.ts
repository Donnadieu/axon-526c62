export type LensMode = 'staleness' | 'fun' | 'friction';

export interface CameraPreset {
	name: string;
	label: string;
	position: [number, number, number];
	target: [number, number, number];
	lens?: LensMode;
}

export interface UserPreferences {
	stalenessWindow: number;
	activeLens: LensMode;
	lastFileHandle: FileSystemFileHandle | null;
}
