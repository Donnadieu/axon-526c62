import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Task } from '../../src/lib/types/task';
import { getDueDateStatus } from '../../src/lib/utils/due-date';

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

describe('getDueDateStatus', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns 'normal' for task with no due date", () => {
		const task = makeTask();
		expect(getDueDateStatus(task)).toBe('normal');
	});

	it("returns 'warning' for task due tomorrow", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		const task = makeTask({ due: '260327' }); // March 27
		expect(getDueDateStatus(task)).toBe('warning');
	});

	it("returns 'warning' for task due 3 days from now", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		const task = makeTask({ due: '260329' }); // March 29
		expect(getDueDateStatus(task)).toBe('warning');
	});

	it("returns 'normal' for task due 4 days from now", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		const task = makeTask({ due: '260330' }); // March 30
		expect(getDueDateStatus(task)).toBe('normal');
	});

	it("returns 'overdue' for task due yesterday", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		const task = makeTask({ due: '260325' }); // March 25
		expect(getDueDateStatus(task)).toBe('overdue');
	});

	it("returns 'warning' for task due today (within 3 days includes today)", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		const task = makeTask({ due: '260326' }); // March 26
		expect(getDueDateStatus(task)).toBe('warning');
	});
});
