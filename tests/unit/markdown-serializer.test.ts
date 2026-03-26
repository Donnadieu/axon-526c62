import { describe, it, expect, vi } from 'vitest';
import type { Task, NonTaskBlock } from '../../src/lib/types/task';
import { serializeTasks, addTask, updateTask, deleteTask } from '../../src/lib/parser/markdown-serializer';
import { parseTasks } from '../../src/lib/parser/markdown-parser';

const SAMPLE_MARKDOWN = `## Buy groceries
id: abc123
importance: 7
urgency: 5
created: 260326
status: open
due: 260401
fun: 3
friction: 2

## Fix bug in auth
id: def456
importance: 9
urgency: 8
created: 260320
status: open

## Clean up README
id: ghi789
importance: 4
urgency: 2
created: 260315
status: done
fun: 6
friction: 1
`;

function makeSampleTask(overrides: Partial<Task> = {}): Task {
	return {
		id: 'new001',
		text: 'New task',
		importance: 5,
		urgency: 3,
		created: '260326',
		status: 'open',
		...overrides
	};
}

describe('serializeTasks', () => {
	it('serializes tasks back to valid markdown', () => {
		const { tasks, nonTaskContent } = parseTasks(SAMPLE_MARKDOWN);
		const output = serializeTasks(tasks, nonTaskContent);

		expect(output).toContain('## Buy groceries');
		expect(output).toContain('id: abc123');
		expect(output).toContain('importance: 7');
		expect(output).toContain('## Fix bug in auth');
		expect(output).toContain('## Clean up README');
		expect(output.endsWith('\n')).toBe(true);
	});

	it('round-trips: parse → serialize → parse produces identical task data', () => {
		const firstParse = parseTasks(SAMPLE_MARKDOWN);
		const serialized = serializeTasks(firstParse.tasks, firstParse.nonTaskContent);
		const secondParse = parseTasks(serialized);

		expect(secondParse.tasks).toHaveLength(firstParse.tasks.length);

		for (let i = 0; i < firstParse.tasks.length; i++) {
			expect(secondParse.tasks[i]).toEqual(firstParse.tasks[i]);
		}
	});

	it('preserves non-task content during round-trip', () => {
		const mdWithHeader = `# My Tasks

Some notes here.

## Buy groceries
id: abc123
importance: 7
urgency: 5
created: 260326
status: open

## Fix bug
id: def456
importance: 9
urgency: 8
created: 260320
status: open
`;
		const { tasks, nonTaskContent } = parseTasks(mdWithHeader);
		const serialized = serializeTasks(tasks, nonTaskContent);

		expect(serialized).toContain('# My Tasks');
		expect(serialized).toContain('Some notes here.');
		expect(serialized).toContain('## Buy groceries');
		expect(serialized).toContain('## Fix bug');
	});

	it('handles empty inputs', () => {
		const result = serializeTasks([], []);
		expect(result).toBe('');
	});
});

describe('addTask', () => {
	it('appends a new block without corrupting existing content', () => {
		const newTask = makeSampleTask();
		const result = addTask(SAMPLE_MARKDOWN, newTask);

		expect(result).toContain('## Buy groceries');
		expect(result).toContain('## Fix bug in auth');
		expect(result).toContain('## Clean up README');
		expect(result).toContain('## New task');
		expect(result).toContain('id: new001');

		const { tasks } = parseTasks(result);
		expect(tasks).toHaveLength(4);
		expect(tasks[3].id).toBe('new001');
	});

	it('works on empty markdown', () => {
		const newTask = makeSampleTask();
		const result = addTask('', newTask);

		expect(result).toContain('## New task');
		const { tasks } = parseTasks(result);
		expect(tasks).toHaveLength(1);
	});

	it('includes optional fields only if they have values', () => {
		const taskWithOptionals = makeSampleTask({ due: '260401', fun: 7, friction: 4 });
		const result = addTask('', taskWithOptionals);

		expect(result).toContain('due: 260401');
		expect(result).toContain('fun: 7');
		expect(result).toContain('friction: 4');

		const taskWithoutOptionals = makeSampleTask();
		const result2 = addTask('', taskWithoutOptionals);

		expect(result2).not.toContain('due:');
		expect(result2).not.toContain('fun:');
		expect(result2).not.toContain('friction:');
	});
});

describe('updateTask', () => {
	it('modifies only the target task block', () => {
		const updated = makeSampleTask({
			id: 'def456',
			text: 'Fix bug in auth - UPDATED',
			importance: 10,
			urgency: 10,
			created: '260320',
			status: 'done'
		});

		const result = updateTask(SAMPLE_MARKDOWN, updated);
		const { tasks } = parseTasks(result);

		expect(tasks).toHaveLength(3);

		const target = tasks.find((t) => t.id === 'def456');
		expect(target).toBeDefined();
		expect(target!.text).toBe('Fix bug in auth - UPDATED');
		expect(target!.importance).toBe(10);
		expect(target!.status).toBe('done');

		const unchanged1 = tasks.find((t) => t.id === 'abc123');
		expect(unchanged1).toBeDefined();
		expect(unchanged1!.text).toBe('Buy groceries');
		expect(unchanged1!.importance).toBe(7);

		const unchanged2 = tasks.find((t) => t.id === 'ghi789');
		expect(unchanged2).toBeDefined();
		expect(unchanged2!.text).toBe('Clean up README');
	});

	it('returns original markdown when task ID not found', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const unknown = makeSampleTask({ id: 'nonexistent' });
		const result = updateTask(SAMPLE_MARKDOWN, unknown);

		expect(result).toBe(SAMPLE_MARKDOWN);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent'));

		warnSpy.mockRestore();
	});
});

describe('deleteTask', () => {
	it('removes a task and cleans up whitespace', () => {
		const result = deleteTask(SAMPLE_MARKDOWN, 'def456');
		const { tasks } = parseTasks(result);

		expect(tasks).toHaveLength(2);
		expect(tasks.find((t) => t.id === 'def456')).toBeUndefined();
		expect(tasks.find((t) => t.id === 'abc123')).toBeDefined();
		expect(tasks.find((t) => t.id === 'ghi789')).toBeDefined();

		// No orphaned blank lines (more than 2 consecutive newlines)
		expect(result).not.toMatch(/\n{3,}/);
	});

	it('returns original markdown when task ID not found', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const result = deleteTask(SAMPLE_MARKDOWN, 'nonexistent');

		expect(result).toBe(SAMPLE_MARKDOWN);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('nonexistent'));

		warnSpy.mockRestore();
	});

	it('returns empty string when last task is deleted and no non-task content', () => {
		const singleTask = `## Only task
id: only001
importance: 5
urgency: 3
created: 260326
status: open
`;
		const result = deleteTask(singleTask, 'only001');
		expect(result).toBe('');
	});
});
