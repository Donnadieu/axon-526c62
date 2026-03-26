import type { Task, NonTaskBlock } from '$lib/types/task';
import { parseTasks } from './markdown-parser';

function serializeTask(task: Task): string {
	const lines: string[] = [`## ${task.text}`];
	lines.push(`id: ${task.id}`);
	lines.push(`importance: ${task.importance}`);
	lines.push(`urgency: ${task.urgency}`);
	lines.push(`created: ${task.created}`);
	lines.push(`status: ${task.status}`);

	if (task.due !== undefined) {
		lines.push(`due: ${task.due}`);
	}
	if (task.fun !== undefined) {
		lines.push(`fun: ${task.fun}`);
	}
	if (task.friction !== undefined) {
		lines.push(`friction: ${task.friction}`);
	}

	return lines.join('\n');
}

export function serializeTasks(tasks: Task[], nonTaskContent: NonTaskBlock[]): string {
	if (tasks.length === 0 && nonTaskContent.length === 0) {
		return '';
	}

	const occupied = new Set(nonTaskContent.map((ntb) => ntb.position));
	const blocks: { content: string; position: number }[] = [...nonTaskContent.map((ntb) => ({ content: ntb.content, position: ntb.position }))];

	let slot = 0;
	for (const task of tasks) {
		while (occupied.has(slot)) {
			slot++;
		}
		blocks.push({ content: serializeTask(task), position: slot });
		occupied.add(slot);
		slot++;
	}

	blocks.sort((a, b) => a.position - b.position);

	const result = blocks.map((b) => b.content.trimEnd()).join('\n\n');
	return result + '\n';
}

export function addTask(markdown: string, task: Task): string {
	const trimmed = markdown.trimEnd();
	const separator = trimmed.length > 0 ? '\n\n' : '';
	return trimmed + separator + serializeTask(task) + '\n';
}

export function updateTask(markdown: string, task: Task): string {
	const { tasks, nonTaskContent } = parseTasks(markdown);
	const index = tasks.findIndex((t) => t.id === task.id);

	if (index === -1) {
		console.warn(`updateTask: task with id "${task.id}" not found`);
		return markdown;
	}

	tasks[index] = task;
	return serializeTasks(tasks, nonTaskContent);
}

export function deleteTask(markdown: string, taskId: string): string {
	const { tasks, nonTaskContent } = parseTasks(markdown);
	const filtered = tasks.filter((t) => t.id !== taskId);

	if (filtered.length === tasks.length) {
		console.warn(`deleteTask: task with id "${taskId}" not found`);
		return markdown;
	}

	if (filtered.length === 0 && nonTaskContent.length === 0) {
		return '';
	}

	return serializeTasks(filtered, nonTaskContent);
}
