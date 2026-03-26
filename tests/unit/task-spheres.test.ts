import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Task } from '../../src/lib/types/task';
import type { LensMode } from '../../src/lib/types/preferences';
import { computeZPosition, computeStackedZPosition, groupTasksByCell } from '../../src/lib/utils/lens';

function makeTask(overrides: Partial<Task> = {}): Task {
	return {
		id: 'test-id',
		text: 'Test task',
		importance: 5,
		urgency: 5,
		created: '260326',
		status: 'open',
		...overrides
	};
}

/**
 * Mirrors the sphereEntries computation logic from TaskSpheres.svelte
 */
function computeSpherePositions(
	tasks: Task[],
	activeLens: LensMode,
	stalenessWindow: number
): Array<{ taskId: string; position: [number, number, number] }> {
	const openTasks = tasks.filter((t) => t.status === 'open');
	const grouped = groupTasksByCell(openTasks);
	const entries: Array<{ taskId: string; position: [number, number, number] }> = [];

	for (const [, group] of grouped) {
		for (let i = 0; i < group.length; i++) {
			const task = group[i];
			const baseZ = computeZPosition(task, activeLens, stalenessWindow);
			const z = computeStackedZPosition(baseZ, i);
			entries.push({
				taskId: task.id,
				position: [task.importance, task.urgency, z]
			});
		}
	}

	return entries;
}

describe('TaskSpheres position computation', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('positions a task at its (importance, urgency, z) coordinates', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26));
		const tasks = [makeTask({ id: 'a', importance: 7, urgency: 3, created: '260311' })];
		const entries = computeSpherePositions(tasks, 'staleness', 30);
		expect(entries).toHaveLength(1);
		expect(entries[0].taskId).toBe('a');
		expect(entries[0].position[0]).toBe(7); // importance = x
		expect(entries[0].position[1]).toBe(3); // urgency = y
		expect(entries[0].position[2]).toBe(5); // staleness z: 15 days / 30 window * 10 = 5
	});

	it('filters out completed tasks', () => {
		const tasks = [
			makeTask({ id: 'open1', status: 'open' }),
			makeTask({ id: 'done1', status: 'done' }),
			makeTask({ id: 'open2', status: 'open', importance: 3, urgency: 7 })
		];
		const entries = computeSpherePositions(tasks, 'fun', 30);
		expect(entries).toHaveLength(2);
		expect(entries.map((e) => e.taskId).sort()).toEqual(['open1', 'open2']);
	});

	it('stacks tasks at the same (importance, urgency) cell', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26));
		const tasks = [
			makeTask({ id: 'a', importance: 5, urgency: 5, created: '260326' }),
			makeTask({ id: 'b', importance: 5, urgency: 5, created: '260326' })
		];
		const entries = computeSpherePositions(tasks, 'staleness', 30);
		expect(entries).toHaveLength(2);

		const posA = entries.find((e) => e.taskId === 'a')!;
		const posB = entries.find((e) => e.taskId === 'b')!;

		// Same x and y
		expect(posA.position[0]).toBe(posB.position[0]);
		expect(posA.position[1]).toBe(posB.position[1]);
		// Different z with ~0.3 offset
		expect(Math.abs(posA.position[2] - posB.position[2])).toBeCloseTo(0.3);
	});

	it('uses fun lens for z-position', () => {
		const tasks = [makeTask({ id: 'a', importance: 3, urgency: 8, fun: 6 })];
		const entries = computeSpherePositions(tasks, 'fun', 30);
		expect(entries[0].position).toEqual([3, 8, 6]);
	});

	it('uses friction lens for z-position', () => {
		const tasks = [makeTask({ id: 'a', importance: 2, urgency: 9, friction: 4 })];
		const entries = computeSpherePositions(tasks, 'friction', 30);
		expect(entries[0].position).toEqual([2, 9, 4]);
	});

	it('positions update when lens changes', () => {
		const tasks = [makeTask({ id: 'a', fun: 7, friction: 2 })];
		const funEntries = computeSpherePositions(tasks, 'fun', 30);
		const frictionEntries = computeSpherePositions(tasks, 'friction', 30);
		expect(funEntries[0].position[2]).toBe(7);
		expect(frictionEntries[0].position[2]).toBe(2);
	});

	it('positions update when staleness window changes', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26));
		const tasks = [makeTask({ id: 'a', created: '260311' })]; // 15 days ago
		const narrow = computeSpherePositions(tasks, 'staleness', 15);
		const wide = computeSpherePositions(tasks, 'staleness', 30);
		expect(narrow[0].position[2]).toBe(10); // 15/15 * 10 = 10 (clamped)
		expect(wide[0].position[2]).toBe(5); // 15/30 * 10 = 5
	});

	it('returns empty array for no tasks', () => {
		const entries = computeSpherePositions([], 'staleness', 30);
		expect(entries).toHaveLength(0);
	});

	it('tasks at different cells are not stacked', () => {
		const tasks = [
			makeTask({ id: 'a', importance: 3, urgency: 7, fun: 5 }),
			makeTask({ id: 'b', importance: 8, urgency: 2, fun: 5 })
		];
		const entries = computeSpherePositions(tasks, 'fun', 30);
		// Both have same base z (fun=5) but different cells, so no stacking
		expect(entries[0].position[2]).toBe(5);
		expect(entries[1].position[2]).toBe(5);
	});
});
