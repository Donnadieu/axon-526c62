import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Task } from '../../src/lib/types/task';
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

describe('computeZPosition', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('with staleness lens delegates to computeStaleness', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		const task = makeTask({ created: '260311' }); // 15 days ago
		expect(computeZPosition(task, 'staleness', 30)).toBe(5);
	});

	it('with fun lens returns task.fun', () => {
		const task = makeTask({ fun: 7 });
		expect(computeZPosition(task, 'fun', 30)).toBe(7);
	});

	it('with fun lens returns 0 when fun is undefined', () => {
		const task = makeTask();
		expect(computeZPosition(task, 'fun', 30)).toBe(0);
	});

	it('with friction lens returns task.friction', () => {
		const task = makeTask({ friction: 3 });
		expect(computeZPosition(task, 'friction', 30)).toBe(3);
	});

	it('with friction lens returns 0 when friction is undefined', () => {
		const task = makeTask();
		expect(computeZPosition(task, 'friction', 30)).toBe(0);
	});
});

describe('computeStackedZPosition', () => {
	it('with stackIndex 0 returns baseZ', () => {
		expect(computeStackedZPosition(5, 0)).toBe(5);
	});

	it('with stackIndex 2 and offset 0.3 returns baseZ + 0.6', () => {
		expect(computeStackedZPosition(5, 2, 0.3)).toBeCloseTo(5.6);
	});

	it('uses default offset of 0.3', () => {
		expect(computeStackedZPosition(2, 3)).toBeCloseTo(2.9);
	});
});

describe('groupTasksByCell', () => {
	it('groups tasks at same (importance, urgency) correctly', () => {
		const tasks = [
			makeTask({ id: 'a', importance: 3, urgency: 7 }),
			makeTask({ id: 'b', importance: 3, urgency: 7 }),
			makeTask({ id: 'c', importance: 5, urgency: 2 })
		];
		const grouped = groupTasksByCell(tasks);
		expect(grouped.size).toBe(2);
		expect(grouped.get('3-7')).toHaveLength(2);
		expect(grouped.get('5-2')).toHaveLength(1);
	});

	it('returns empty map for empty array', () => {
		const grouped = groupTasksByCell([]);
		expect(grouped.size).toBe(0);
	});
});
