import type { Task } from '../types/task';
import type { LensMode } from '../types/preferences';
import { computeStaleness } from './staleness';

export function computeZPosition(task: Task, lens: LensMode, stalenessWindow: number): number {
	switch (lens) {
		case 'staleness':
			return computeStaleness(task.created, stalenessWindow);
		case 'fun':
			return task.fun ?? 0;
		case 'friction':
			return task.friction ?? 0;
	}
}

export function computeStackedZPosition(
	baseZ: number,
	stackIndex: number,
	stackOffset: number = 0.3
): number {
	return baseZ + stackIndex * stackOffset;
}

export function groupTasksByCell(tasks: Task[]): Map<string, Task[]> {
	const map = new Map<string, Task[]>();
	for (const task of tasks) {
		const key = `${task.importance}-${task.urgency}`;
		const group = map.get(key);
		if (group) {
			group.push(task);
		} else {
			map.set(key, [task]);
		}
	}
	return map;
}
