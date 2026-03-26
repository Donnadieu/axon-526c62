import type { Task } from '$lib/types/task';
import { parseDateYYMMDD } from './staleness';

export type DueDateStatus = 'overdue' | 'warning' | 'normal';

export function getDueDateStatus(task: Task): DueDateStatus {
	if (!task.due) return 'normal';

	const dueDate = parseDateYYMMDD(task.due);
	if (!dueDate) return 'normal';

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

	const diffMs = dueMidnight.getTime() - today.getTime();
	const diffDays = diffMs / (1000 * 60 * 60 * 24);

	if (diffDays < 0) return 'overdue';
	if (diffDays <= 3) return 'warning';
	return 'normal';
}
