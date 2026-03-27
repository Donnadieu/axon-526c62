import type { Task, NonTaskBlock } from '$lib/types/task';
import { generateId } from '$lib/utils/id';

export interface ParseResult {
	tasks: Task[];
	nonTaskContent: NonTaskBlock[];
}

const REQUIRED_FIELDS = ['importance', 'urgency', 'created', 'status'] as const;
const VALID_STATUSES = ['open', 'done'] as const;

function isValidRange(value: number, min: number, max: number): boolean {
	return Number.isInteger(value) && value >= min && value <= max;
}

function parseMetadata(lines: string[]): Record<string, string> | null {
	const metadata: Record<string, string> = {};
	for (const line of lines) {
		const match = line.match(/^\s*(\w+):\s*(.+)$/);
		if (match) {
			metadata[match[1]] = match[2].trim();
		}
	}
	return Object.keys(metadata).length > 0 ? metadata : null;
}

function tryParseTask(heading: string, metadata: Record<string, string>): Task | null {
	for (const field of REQUIRED_FIELDS) {
		if (!(field in metadata)) {
			console.warn(`Skipping block "${heading}": missing required field "${field}"`);
			return null;
		}
	}

	const importance = Number(metadata.importance);
	const urgency = Number(metadata.urgency);

	if (!isValidRange(importance, 1, 10)) {
		console.warn(`Skipping block "${heading}": importance must be an integer 1-10, got "${metadata.importance}"`);
		return null;
	}
	if (!isValidRange(urgency, 1, 10)) {
		console.warn(`Skipping block "${heading}": urgency must be an integer 1-10, got "${metadata.urgency}"`);
		return null;
	}

	const status = metadata.status;
	if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
		console.warn(`Skipping block "${heading}": status must be "open" or "done", got "${status}"`);
		return null;
	}

	const task: Task = {
		id: metadata.id || generateId(),
		text: heading,
		importance,
		urgency,
		created: metadata.created,
		status: status as 'open' | 'done'
	};

	if (metadata.due) {
		task.due = metadata.due;
	}

	if (metadata.fun !== undefined) {
		const fun = Number(metadata.fun);
		if (!isValidRange(fun, 1, 10)) {
			console.warn(`Skipping block "${heading}": fun must be an integer 1-10, got "${metadata.fun}"`);
			return null;
		}
		task.fun = fun;
	}

	if (metadata.friction !== undefined) {
		const friction = Number(metadata.friction);
		if (!isValidRange(friction, 1, 10)) {
			console.warn(`Skipping block "${heading}": friction must be an integer 1-10, got "${metadata.friction}"`);
			return null;
		}
		task.friction = friction;
	}

	return task;
}

export function parseTasks(markdown: string): ParseResult {
	const tasks: Task[] = [];
	const nonTaskContent: NonTaskBlock[] = [];

	if (!markdown.trim()) {
		return { tasks, nonTaskContent };
	}

	const sections = markdown.split(/^(?=## )/m);
	let position = 0;

	for (const section of sections) {
		const headingMatch = section.match(/^## (.+)$/m);

		if (!headingMatch) {
			if (section.trim()) {
				nonTaskContent.push({ content: section, position });
			}
			position++;
			continue;
		}

		const heading = headingMatch[1].trim();
		const bodyLines = section
			.split('\n')
			.slice(1)
			.filter((line) => line.trim() !== '');

		const metadata = parseMetadata(bodyLines);

		if (!metadata) {
			nonTaskContent.push({ content: section, position });
			position++;
			continue;
		}

		const task = tryParseTask(heading, metadata);

		if (task) {
			tasks.push(task);
		} else {
			nonTaskContent.push({ content: section, position });
		}

		position++;
	}

	return { tasks, nonTaskContent };
}
