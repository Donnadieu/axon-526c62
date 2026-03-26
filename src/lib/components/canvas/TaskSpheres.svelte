<script lang="ts">
	import { openTasks, selectedTaskId } from '$lib/stores/tasks';
	import { preferences } from '$lib/stores/preferences';
	import { computeZPosition, computeStackedZPosition, groupTasksByCell } from '$lib/utils/lens';
	import { getDueDateStatus, type DueDateStatus } from '$lib/utils/due-date';
	import TaskSphere from './TaskSphere.svelte';

	const tasks = $derived($openTasks);
	const prefs = $derived($preferences);

	interface SphereEntry {
		taskId: string;
		task: (typeof tasks)[number];
		position: [number, number, number];
		dueDateStatus: DueDateStatus;
	}

	const sphereEntries: SphereEntry[] = $derived.by(() => {
		const grouped = groupTasksByCell(tasks);
		const entries: SphereEntry[] = [];

		for (const [, group] of grouped) {
			for (let i = 0; i < group.length; i++) {
				const task = group[i];
				const baseZ = computeZPosition(task, prefs.activeLens, prefs.stalenessWindow);
				const z = computeStackedZPosition(baseZ, i);
				entries.push({
					taskId: task.id,
					task,
					position: [task.importance, task.urgency, z],
					dueDateStatus: getDueDateStatus(task)
				});
			}
		}

		return entries;
	});
</script>

{#each sphereEntries as entry (entry.taskId)}
	<TaskSphere
		task={entry.task}
		targetPosition={entry.position}
		isSelected={$selectedTaskId === entry.taskId}
		dueDateStatus={entry.dueDateStatus}
	/>
{/each}
