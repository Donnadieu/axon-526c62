import { writable, derived, get } from 'svelte/store';
import type { Task, NonTaskBlock } from '$lib/types/task';
import { parseTasks } from '$lib/parser/markdown-parser';
import { serializeTasks } from '$lib/parser/markdown-serializer';
import { saveFile } from '$lib/filesystem/file-access';

export const tasks = writable<Task[]>([]);
export const nonTaskContent = writable<NonTaskBlock[]>([]);
export const selectedTaskId = writable<string | null>(null);
export const fileHandle = writable<FileSystemFileHandle | null>(null);
export const isDirty = writable(false);

export const openTasks = derived(tasks, ($tasks) => $tasks.filter((t) => t.status === 'open'));

export const selectedTask = derived([tasks, selectedTaskId], ([$tasks, $selectedTaskId]) =>
	$selectedTaskId ? ($tasks.find((t) => t.id === $selectedTaskId) ?? null) : null
);

async function persist(): Promise<void> {
	const handle = get(fileHandle);
	const content = serializeTasks(get(tasks), get(nonTaskContent));
	if (handle) {
		await saveFile(handle, content);
	} else {
		isDirty.set(true);
	}
}

export function loadFromMarkdown(md: string): void {
	const result = parseTasks(md);
	tasks.set(result.tasks);
	nonTaskContent.set(result.nonTaskContent);
}

export function addTask(task: Task): void {
	tasks.update((current) => [...current, task]);
	persist();
}

export function updateTask(task: Task): void {
	tasks.update((current) => current.map((t) => (t.id === task.id ? task : t)));
	persist();
}

export function deleteTask(id: string): void {
	tasks.update((current) => current.filter((t) => t.id !== id));
	persist();
}

export function completeTask(id: string): void {
	tasks.update((current) =>
		current.map((t) => (t.id === id ? { ...t, status: 'done' as const } : t))
	);
	persist();
}
