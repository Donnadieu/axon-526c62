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
 * Mirrors TaskSpheres computation with is2D support
 */
function computeSpherePositions(
	tasks: Task[],
	activeLens: LensMode,
	stalenessWindow: number,
	is2D: boolean
): Array<{ taskId: string; position: [number, number, number] }> {
	const openTasks = tasks.filter((t) => t.status === 'open');
	const grouped = groupTasksByCell(openTasks);
	const entries: Array<{ taskId: string; position: [number, number, number] }> = [];

	for (const [, group] of grouped) {
		for (let i = 0; i < group.length; i++) {
			const task = group[i];
			const baseZ = is2D ? 0 : computeZPosition(task, activeLens, stalenessWindow);
			const z = is2D ? 0 : computeStackedZPosition(baseZ, i);
			entries.push({
				taskId: task.id,
				position: [task.importance, task.urgency, z]
			});
		}
	}

	return entries;
}

/**
 * Mirrors TaskSpheres overlap computation
 */
function computeOverlapEntries(
	tasks: Task[],
	is2D: boolean
): Array<{ key: string; count: number; position: [number, number, number] }> {
	if (!is2D) return [];
	const openTasks = tasks.filter((t) => t.status === 'open');
	const grouped = groupTasksByCell(openTasks);
	const entries: Array<{ key: string; count: number; position: [number, number, number] }> = [];

	for (const [key, group] of grouped) {
		if (group.length > 1) {
			const task = group[0];
			entries.push({
				key,
				count: group.length,
				position: [task.importance, task.urgency, 0]
			});
		}
	}

	return entries;
}

describe('2D flatten mode', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('projects all tasks to z=0 in 2D mode', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26));
		const tasks = [
			makeTask({ id: 'a', importance: 3, urgency: 7, created: '260311', fun: 6 }),
			makeTask({ id: 'b', importance: 8, urgency: 2, created: '260320', fun: 9 })
		];

		const entries = computeSpherePositions(tasks, 'staleness', 30, true);
		for (const entry of entries) {
			expect(entry.position[2]).toBe(0);
		}
	});

	it('preserves x and y positions in 2D mode', () => {
		const tasks = [
			makeTask({ id: 'a', importance: 3, urgency: 7, fun: 6 }),
			makeTask({ id: 'b', importance: 8, urgency: 2, fun: 9 })
		];

		const entries = computeSpherePositions(tasks, 'fun', 30, true);
		const a = entries.find((e) => e.taskId === 'a')!;
		const b = entries.find((e) => e.taskId === 'b')!;
		expect(a.position[0]).toBe(3);
		expect(a.position[1]).toBe(7);
		expect(b.position[0]).toBe(8);
		expect(b.position[1]).toBe(2);
	});

	it('restores z-positions when switching back to 3D', () => {
		const tasks = [makeTask({ id: 'a', importance: 5, urgency: 5, fun: 7 })];

		const flat = computeSpherePositions(tasks, 'fun', 30, true);
		expect(flat[0].position[2]).toBe(0);

		const restored = computeSpherePositions(tasks, 'fun', 30, false);
		expect(restored[0].position[2]).toBe(7);
	});

	it('z=0 applies regardless of lens in 2D mode', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26));
		const task = makeTask({ id: 'a', created: '260311', fun: 7, friction: 3 });
		const tasks = [task];

		for (const lens of ['staleness', 'fun', 'friction'] as LensMode[]) {
			const entries = computeSpherePositions(tasks, lens, 30, true);
			expect(entries[0].position[2]).toBe(0);
		}
	});

	it('does not stack tasks in 2D mode (all at z=0)', () => {
		const tasks = [
			makeTask({ id: 'a', importance: 5, urgency: 5, fun: 3 }),
			makeTask({ id: 'b', importance: 5, urgency: 5, fun: 6 })
		];

		const entries = computeSpherePositions(tasks, 'fun', 30, true);
		expect(entries[0].position[2]).toBe(0);
		expect(entries[1].position[2]).toBe(0);
	});
});

describe('Overlap badge computation', () => {
	it('returns no overlaps in 3D mode', () => {
		const tasks = [
			makeTask({ id: 'a', importance: 5, urgency: 5 }),
			makeTask({ id: 'b', importance: 5, urgency: 5 })
		];
		const overlaps = computeOverlapEntries(tasks, false);
		expect(overlaps).toHaveLength(0);
	});

	it('detects overlapping tasks in 2D mode', () => {
		const tasks = [
			makeTask({ id: 'a', importance: 5, urgency: 5 }),
			makeTask({ id: 'b', importance: 5, urgency: 5 }),
			makeTask({ id: 'c', importance: 5, urgency: 5 })
		];
		const overlaps = computeOverlapEntries(tasks, true);
		expect(overlaps).toHaveLength(1);
		expect(overlaps[0].count).toBe(3);
		expect(overlaps[0].position).toEqual([5, 5, 0]);
	});

	it('does not flag single tasks as overlapping', () => {
		const tasks = [
			makeTask({ id: 'a', importance: 3, urgency: 7 }),
			makeTask({ id: 'b', importance: 8, urgency: 2 })
		];
		const overlaps = computeOverlapEntries(tasks, true);
		expect(overlaps).toHaveLength(0);
	});

	it('handles multiple overlap groups', () => {
		const tasks = [
			makeTask({ id: 'a1', importance: 3, urgency: 7 }),
			makeTask({ id: 'a2', importance: 3, urgency: 7 }),
			makeTask({ id: 'b1', importance: 8, urgency: 2 }),
			makeTask({ id: 'b2', importance: 8, urgency: 2 }),
			makeTask({ id: 'b3', importance: 8, urgency: 2 }),
			makeTask({ id: 'c1', importance: 1, urgency: 1 }) // solo, no overlap
		];
		const overlaps = computeOverlapEntries(tasks, true);
		expect(overlaps).toHaveLength(2);

		const groupA = overlaps.find((o) => o.key === '3-7')!;
		const groupB = overlaps.find((o) => o.key === '8-2')!;
		expect(groupA.count).toBe(2);
		expect(groupB.count).toBe(3);
	});

	it('excludes done tasks from overlap counts', () => {
		const tasks = [
			makeTask({ id: 'a', importance: 5, urgency: 5, status: 'open' }),
			makeTask({ id: 'b', importance: 5, urgency: 5, status: 'done' }),
			makeTask({ id: 'c', importance: 5, urgency: 5, status: 'open' })
		];
		const overlaps = computeOverlapEntries(tasks, true);
		expect(overlaps).toHaveLength(1);
		expect(overlaps[0].count).toBe(2);
	});

	it('returns empty for no tasks', () => {
		const overlaps = computeOverlapEntries([], true);
		expect(overlaps).toHaveLength(0);
	});
});
