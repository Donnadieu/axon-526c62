<script lang="ts">
	import { openTasks, selectedTaskId } from '$lib/stores/tasks';
	import { preferences } from '$lib/stores/preferences';
	import { cameraState } from '$lib/stores/camera';
	import { computeZPosition, computeStackedZPosition, groupTasksByCell } from '$lib/utils/lens';
	import { getDueDateStatus, type DueDateStatus } from '$lib/utils/due-date';
	import TaskSphere from './TaskSphere.svelte';
	import OverlapBadge from './OverlapBadge.svelte';

	const tasks = $derived($openTasks);
	const prefs = $derived($preferences);
	const is2D = $derived($cameraState.is2D);

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
				const baseZ = is2D ? 0 : computeZPosition(task, prefs.activeLens, prefs.stalenessWindow);
				const z = is2D ? 0 : computeStackedZPosition(baseZ, i);
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

	interface OverlapEntry {
		key: string;
		position: [number, number, number];
		count: number;
	}

	const overlapEntries: OverlapEntry[] = $derived.by(() => {
		if (!is2D) return [];
		const grouped = groupTasksByCell(tasks);
		const entries: OverlapEntry[] = [];

		for (const [key, group] of grouped) {
			if (group.length > 1) {
				const task = group[0];
				entries.push({
					key,
					position: [task.importance, task.urgency, 0],
					count: group.length
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

{#each overlapEntries as overlap (overlap.key)}
	<OverlapBadge position={overlap.position} count={overlap.count} />
{/each}
