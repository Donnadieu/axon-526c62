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

describe('Lens switching z-position behavior', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('switching to Fun lens moves tasks with fun values to their fun z-position', () => {
		const tasks = [
			makeTask({ id: 'a', fun: 7, friction: 3 }),
			makeTask({ id: 'b', importance: 3, urgency: 7, fun: 2 })
		];
		const entries = computeSpherePositions(tasks, 'fun', 30);
		const a = entries.find((e) => e.taskId === 'a')!;
		const b = entries.find((e) => e.taskId === 'b')!;
		expect(a.position[2]).toBe(7);
		expect(b.position[2]).toBe(2);
	});

	it('switching to Fun lens places tasks without fun at z=0', () => {
		const tasks = [
			makeTask({ id: 'with-fun', fun: 8 }),
			makeTask({ id: 'no-fun', importance: 3, urgency: 7 })
		];
		const entries = computeSpherePositions(tasks, 'fun', 30);
		expect(entries.find((e) => e.taskId === 'with-fun')!.position[2]).toBe(8);
		expect(entries.find((e) => e.taskId === 'no-fun')!.position[2]).toBe(0);
	});

	it('switching to Friction lens moves tasks with friction values to their friction z-position', () => {
		const tasks = [
			makeTask({ id: 'a', friction: 9, fun: 2 }),
			makeTask({ id: 'b', importance: 3, urgency: 7, friction: 4 })
		];
		const entries = computeSpherePositions(tasks, 'friction', 30);
		expect(entries.find((e) => e.taskId === 'a')!.position[2]).toBe(9);
		expect(entries.find((e) => e.taskId === 'b')!.position[2]).toBe(4);
	});

	it('switching to Friction lens places tasks without friction at z=0', () => {
		const tasks = [
			makeTask({ id: 'with-friction', friction: 5 }),
			makeTask({ id: 'no-friction', importance: 3, urgency: 7 })
		];
		const entries = computeSpherePositions(tasks, 'friction', 30);
		expect(entries.find((e) => e.taskId === 'with-friction')!.position[2]).toBe(5);
		expect(entries.find((e) => e.taskId === 'no-friction')!.position[2]).toBe(0);
	});

	it('switching back to Staleness recomputes z from created dates', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		const tasks = [
			makeTask({ id: 'old', importance: 3, urgency: 7, created: '260311', fun: 2, friction: 8 }), // 15 days ago
			makeTask({ id: 'new', importance: 8, urgency: 2, created: '260326', fun: 9, friction: 1 }) // today
		];

		// Start on fun
		const funEntries = computeSpherePositions(tasks, 'fun', 30);
		expect(funEntries.find((e) => e.taskId === 'old')!.position[2]).toBe(2);
		expect(funEntries.find((e) => e.taskId === 'new')!.position[2]).toBe(9);

		// Switch to staleness
		const stalenessEntries = computeSpherePositions(tasks, 'staleness', 30);
		expect(stalenessEntries.find((e) => e.taskId === 'old')!.position[2]).toBe(5); // 15/30*10
		expect(stalenessEntries.find((e) => e.taskId === 'new')!.position[2]).toBe(0); // 0/30*10
	});

	it('z-positions differ when switching between all three lenses', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26));
		const task = makeTask({ id: 'a', created: '260311', fun: 7, friction: 3 });
		const tasks = [task];

		const staleness = computeSpherePositions(tasks, 'staleness', 30);
		const fun = computeSpherePositions(tasks, 'fun', 30);
		const friction = computeSpherePositions(tasks, 'friction', 30);

		expect(staleness[0].position[2]).toBe(5); // 15 days / 30 window * 10
		expect(fun[0].position[2]).toBe(7);
		expect(friction[0].position[2]).toBe(3);

		// All three are different
		const zValues = [staleness[0].position[2], fun[0].position[2], friction[0].position[2]];
		expect(new Set(zValues).size).toBe(3);
	});

	it('x and y positions remain unchanged across lens switches', () => {
		const task = makeTask({ id: 'a', importance: 8, urgency: 3, fun: 7, friction: 2 });
		const tasks = [task];

		const lenses: LensMode[] = ['staleness', 'fun', 'friction'];
		for (const lens of lenses) {
			const entries = computeSpherePositions(tasks, lens, 30);
			expect(entries[0].position[0]).toBe(8); // importance unchanged
			expect(entries[0].position[1]).toBe(3); // urgency unchanged
		}
	});
});
