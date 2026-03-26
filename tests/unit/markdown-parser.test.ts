import { describe, it, expect, vi } from 'vitest';
import { parseTasks } from '../../src/lib/parser/markdown-parser';

const THREE_TASKS = `## Buy groceries
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

describe('parseTasks', () => {
	it('parses 3 valid tasks with correct field values', () => {
		const { tasks, nonTaskContent } = parseTasks(THREE_TASKS);

		expect(tasks).toHaveLength(3);
		expect(nonTaskContent).toHaveLength(0);

		expect(tasks[0]).toEqual({
			id: 'abc123',
			text: 'Buy groceries',
			importance: 7,
			urgency: 5,
			created: '260326',
			status: 'open',
			due: '260401',
			fun: 3,
			friction: 2
		});

		expect(tasks[1]).toEqual({
			id: 'def456',
			text: 'Fix bug in auth',
			importance: 9,
			urgency: 8,
			created: '260320',
			status: 'open'
		});

		expect(tasks[2]).toEqual({
			id: 'ghi789',
			text: 'Clean up README',
			importance: 4,
			urgency: 2,
			created: '260315',
			status: 'done',
			fun: 6,
			friction: 1
		});
	});

	it('skips malformed block (missing importance) with warning', () => {
		const md = `## Valid task
id: aaa111
importance: 5
urgency: 3
created: 260326
status: open

## Malformed task
id: bbb222
urgency: 3
created: 260326
status: open

## Another valid task
id: ccc333
importance: 8
urgency: 7
created: 260326
status: open
`;
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { tasks, nonTaskContent } = parseTasks(md);

		expect(tasks).toHaveLength(2);
		expect(tasks[0].id).toBe('aaa111');
		expect(tasks[1].id).toBe('ccc333');
		expect(nonTaskContent).toHaveLength(1);
		expect(nonTaskContent[0].content).toContain('Malformed task');
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('missing required field "importance"'));

		warnSpy.mockRestore();
	});

	it('preserves non-task content (whitespace, blank lines, comments)', () => {
		const md = `# My Task File

Some introductory text here.

## A valid task
id: abc123
importance: 5
urgency: 3
created: 260326
status: open
`;
		const { tasks, nonTaskContent } = parseTasks(md);

		expect(tasks).toHaveLength(1);
		expect(tasks[0].id).toBe('abc123');
		expect(nonTaskContent).toHaveLength(1);
		expect(nonTaskContent[0].content).toContain('# My Task File');
		expect(nonTaskContent[0].content).toContain('Some introductory text');
		expect(nonTaskContent[0].position).toBe(0);
	});

	it('defaults optional fields to undefined when missing', () => {
		const md = `## Minimal task
id: min001
importance: 5
urgency: 3
created: 260326
status: open
`;
		const { tasks } = parseTasks(md);

		expect(tasks).toHaveLength(1);
		expect(tasks[0].due).toBeUndefined();
		expect(tasks[0].fun).toBeUndefined();
		expect(tasks[0].friction).toBeUndefined();
	});

	it('generates a new id when id field is missing', () => {
		const md = `## Task without id
importance: 5
urgency: 3
created: 260326
status: open
`;
		const { tasks } = parseTasks(md);

		expect(tasks).toHaveLength(1);
		expect(tasks[0].id).toBeDefined();
		expect(typeof tasks[0].id).toBe('string');
		expect(tasks[0].id.length).toBeGreaterThan(0);
		expect(tasks[0].text).toBe('Task without id');
	});

	it('returns empty arrays for empty file', () => {
		const { tasks, nonTaskContent } = parseTasks('');
		expect(tasks).toHaveLength(0);
		expect(nonTaskContent).toHaveLength(0);
	});

	it('returns empty arrays for whitespace-only file', () => {
		const { tasks, nonTaskContent } = parseTasks('   \n\n  \n');
		expect(tasks).toHaveLength(0);
		expect(nonTaskContent).toHaveLength(0);
	});

	it('returns empty tasks with preserved content for non-task-only file', () => {
		const md = `# Just a regular markdown file

This has no task blocks at all.

- bullet point
- another bullet
`;
		const { tasks, nonTaskContent } = parseTasks(md);

		expect(tasks).toHaveLength(0);
		expect(nonTaskContent).toHaveLength(1);
		expect(nonTaskContent[0].content).toContain('Just a regular markdown file');
		expect(nonTaskContent[0].content).toContain('bullet point');
	});

	it('rejects importance outside 1-10 range', () => {
		const md = `## Bad importance
id: bad001
importance: 15
urgency: 3
created: 260326
status: open
`;
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { tasks } = parseTasks(md);

		expect(tasks).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('importance'));

		warnSpy.mockRestore();
	});

	it('rejects invalid status', () => {
		const md = `## Bad status
id: bad002
importance: 5
urgency: 3
created: 260326
status: pending
`;
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { tasks } = parseTasks(md);

		expect(tasks).toHaveLength(0);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('status'));

		warnSpy.mockRestore();
	});
});
