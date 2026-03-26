import type { CameraPreset } from '$lib/types/preferences';

export const CAMERA_PRESETS: CameraPreset[] = [
	{
		name: 'default',
		label: 'Default',
		position: [15, 15, 15],
		target: [5, 5, 5]
	},
	{
		name: 'old-but-important',
		label: 'Old but important',
		position: [10, 8, 20],
		target: [8, 5, 8],
		lens: 'staleness'
	},
	{
		name: 'easy-wins',
		label: 'Easy wins',
		position: [15, 10, 2],
		target: [8, 5, 3],
		lens: 'friction'
	},
	{
		name: 'most-dreaded',
		label: 'Most dreaded',
		position: [5, 10, 18],
		target: [5, 5, 8],
		lens: 'friction'
	},
	{
		name: 'overview',
		label: 'Overview',
		position: [5, 25, 5],
		target: [5, 5, 5]
	}
];
