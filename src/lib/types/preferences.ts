export type LensMode = 'staleness' | 'fun' | 'friction';

export interface CameraPreset {
	name: string;
	position: [number, number, number];
	target: [number, number, number];
}

export interface UserPreferences {
	stalenessWindow: number;
	activeLens: LensMode;
	lastFileHandle: FileSystemFileHandle | null;
}
