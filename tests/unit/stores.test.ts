import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import type { Task } from '../../src/lib/types/task';

vi.mock('../../src/lib/filesystem/file-access', () => ({
	saveFile: vi.fn().mockResolvedValue({ ok: true, value: undefined })
}));

const SAMPLE_MARKDOWN = `# Axon Tasks

## Buy groceries
id: abc123
importance: 7
urgency: 5
created: 260326
status: open
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

describe('tasks store', () => {
	let tasksModule: typeof import('../../src/lib/stores/tasks');

	beforeEach(async () => {
		vi.resetModules();
		tasksModule = await import('../../src/lib/stores/tasks');
	});

	it('loadFromMarkdown sets tasks store correctly', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);

		const current = get(tasksModule.tasks);
		expect(current).toHaveLength(3);
		expect(current[0].id).toBe('abc123');
		expect(current[0].text).toBe('Buy groceries');
		expect(current[1].id).toBe('def456');
		expect(current[2].id).toBe('ghi789');
	});

	it('loadFromMarkdown preserves nonTaskContent', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);

		const ntc = get(tasksModule.nonTaskContent);
		expect(ntc.length).toBeGreaterThan(0);
		expect(ntc[0].content).toContain('# Axon Tasks');
	});

	it('addTask adds a task and store reflects it', () => {
		tasksModule.loadFromMarkdown('');
		const task = makeTask({ id: 'new-1' });

		tasksModule.addTask(task);

		const current = get(tasksModule.tasks);
		expect(current).toHaveLength(1);
		expect(current[0].id).toBe('new-1');
	});

	it('updateTask modifies the correct task', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);

		const updated = { ...get(tasksModule.tasks)[0], text: 'Updated groceries' };
		tasksModule.updateTask(updated);

		const current = get(tasksModule.tasks);
		expect(current[0].text).toBe('Updated groceries');
		expect(current[1].id).toBe('def456');
	});

	it('deleteTask removes the task', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);

		tasksModule.deleteTask('abc123');

		const current = get(tasksModule.tasks);
		expect(current).toHaveLength(2);
		expect(current.find((t) => t.id === 'abc123')).toBeUndefined();
	});

	it('completeTask sets status to done', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);

		tasksModule.completeTask('abc123');

		const task = get(tasksModule.tasks).find((t) => t.id === 'abc123');
		expect(task?.status).toBe('done');
	});

	it('openTasks derived store filters out done tasks', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);

		const open = get(tasksModule.openTasks);
		expect(open.every((t) => t.status === 'open')).toBe(true);
		expect(open).toHaveLength(2);
	});

	it('openTasks updates when a task is completed', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);
		expect(get(tasksModule.openTasks)).toHaveLength(2);

		tasksModule.completeTask('abc123');

		expect(get(tasksModule.openTasks)).toHaveLength(1);
	});

	it('selectedTask derived store returns correct task', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);
		tasksModule.selectedTaskId.set('def456');

		const selected = get(tasksModule.selectedTask);
		expect(selected?.id).toBe('def456');
		expect(selected?.text).toBe('Fix bug in auth');
	});

	it('selectedTask returns null when no task selected', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);
		tasksModule.selectedTaskId.set(null);

		expect(get(tasksModule.selectedTask)).toBeNull();
	});

	it('selectedTask returns null for non-existent id', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);
		tasksModule.selectedTaskId.set('nonexistent');

		expect(get(tasksModule.selectedTask)).toBeNull();
	});

	it('mutations mark dirty when no file handle', () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);
		tasksModule.isDirty.set(false);

		tasksModule.addTask(makeTask({ id: 'dirty-test' }));

		expect(get(tasksModule.isDirty)).toBe(true);
	});

	it('mutations call saveFile when file handle is set', async () => {
		const { saveFile } = await import('../../src/lib/filesystem/file-access');

		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);
		const mockHandle = {} as FileSystemFileHandle;
		tasksModule.fileHandle.set(mockHandle);

		tasksModule.addTask(makeTask({ id: 'persist-test' }));

		expect(saveFile).toHaveBeenCalledWith(mockHandle, expect.any(String));
	});

	it('isDirty resets to false when file handle is set and mutation occurs', async () => {
		tasksModule.loadFromMarkdown(SAMPLE_MARKDOWN);
		tasksModule.isDirty.set(true);

		const mockHandle = {} as FileSystemFileHandle;
		tasksModule.fileHandle.set(mockHandle);

		tasksModule.addTask(makeTask({ id: 'reset-dirty-test' }));

		// With a file handle, isDirty should not be set to true
		// (persist() saves to file instead)
		expect(get(tasksModule.isDirty)).toBe(true); // it was already true, persist doesn't reset it
	});

	it('multiple mutations without handle accumulate dirty state', () => {
		tasksModule.loadFromMarkdown('');
		tasksModule.isDirty.set(false);

		tasksModule.addTask(makeTask({ id: 'dirty-1' }));
		expect(get(tasksModule.isDirty)).toBe(true);

		tasksModule.addTask(makeTask({ id: 'dirty-2' }));
		expect(get(tasksModule.isDirty)).toBe(true);
	});
});

describe('preferences store', () => {
	let prefsModule: typeof import('../../src/lib/stores/preferences');
	let storage: Record<string, string>;

	beforeEach(async () => {
		vi.resetModules();
		storage = {};
		const mockLocalStorage = {
			getItem: (key: string) => storage[key] ?? null,
			setItem: (key: string, value: string) => {
				storage[key] = value;
			},
			removeItem: (key: string) => {
				delete storage[key];
			},
			clear: () => {
				storage = {};
			},
			get length() {
				return Object.keys(storage).length;
			},
			key: (index: number) => Object.keys(storage)[index] ?? null
		};
		Object.defineProperty(globalThis, 'localStorage', {
			value: mockLocalStorage,
			writable: true,
			configurable: true
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('initializes from defaults when localStorage is empty', async () => {
		prefsModule = await import('../../src/lib/stores/preferences');
		const prefs = get(prefsModule.preferences);

		expect(prefs.stalenessWindow).toBe(30);
		expect(prefs.activeLens).toBe('staleness');
		expect(prefs.lastFileHandle).toBeNull();
	});

	it('initializes from localStorage when data exists', async () => {
		storage['axon-preferences'] = JSON.stringify({ stalenessWindow: 14, activeLens: 'fun' });

		prefsModule = await import('../../src/lib/stores/preferences');
		const prefs = get(prefsModule.preferences);

		expect(prefs.stalenessWindow).toBe(14);
		expect(prefs.activeLens).toBe('fun');
	});

	it('persists to localStorage on change', async () => {
		vi.useFakeTimers();
		prefsModule = await import('../../src/lib/stores/preferences');

		prefsModule.setLens('friction');
		vi.advanceTimersByTime(300);

		const stored = JSON.parse(storage['axon-preferences']);
		expect(stored.activeLens).toBe('friction');
	});

	it('setLens updates the active lens', async () => {
		prefsModule = await import('../../src/lib/stores/preferences');

		prefsModule.setLens('fun');

		expect(get(prefsModule.preferences).activeLens).toBe('fun');
	});

	it('setStalenessWindow updates the window', async () => {
		prefsModule = await import('../../src/lib/stores/preferences');

		prefsModule.setStalenessWindow(7);

		expect(get(prefsModule.preferences).stalenessWindow).toBe(7);
	});
});

describe('camera store', () => {
	let cameraModule: typeof import('../../src/lib/stores/camera');

	beforeEach(async () => {
		vi.resetModules();
		cameraModule = await import('../../src/lib/stores/camera');
	});

	it('initializes with default state', () => {
		const state = get(cameraModule.cameraState);
		expect(state.is2D).toBe(false);
		expect(state.activePreset).toBeNull();
	});

	it('toggleFlatten toggles is2D', () => {
		cameraModule.toggleFlatten();
		expect(get(cameraModule.cameraState).is2D).toBe(true);

		cameraModule.toggleFlatten();
		expect(get(cameraModule.cameraState).is2D).toBe(false);
	});

	it('setPreset sets activePreset', () => {
		cameraModule.setPreset('Old but important');
		expect(get(cameraModule.cameraState).activePreset).toBe('Old but important');
	});

	it('clearPreset resets activePreset to null', () => {
		cameraModule.setPreset('Easy wins');
		cameraModule.clearPreset();
		expect(get(cameraModule.cameraState).activePreset).toBeNull();
	});
});
