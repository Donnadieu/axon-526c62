<script lang="ts">
	import { get } from 'svelte/store';
	import { tasks, selectedTask, selectedTaskId, updateTask, completeTask, deleteTask } from '$lib/stores/tasks';
	import { preferences } from '$lib/stores/preferences';
	import { computeStaleness } from '$lib/utils/staleness';
	import ConfirmDialog from './ConfirmDialog.svelte';

	let localText = $state('');
	let localDue = $state('');
	let localFun = $state<number | null>(null);
	let localFriction = $state<number | null>(null);
	let showFun = $state(false);
	let showFriction = $state(false);
	let showDeleteConfirm = $state(false);
	let textareaRef = $state<HTMLTextAreaElement | null>(null);

	let previousTaskId: string | null = null;

	function saveEditsForTask(taskId: string) {
		const allTasks = get(tasks);
		const task = allTasks.find((t) => t.id === taskId);
		if (task && task.status === 'open') {
			updateTask({
				...task,
				text: localText,
				due: localDue.trim() || undefined,
				fun: showFun && localFun != null ? localFun : undefined,
				friction: showFriction && localFriction != null ? localFriction : undefined
			});
		}
	}

	$effect(() => {
		const task = $selectedTask;

		if (task && task.id !== previousTaskId) {
			// Switching tasks — save edits to previous task first
			if (previousTaskId) {
				saveEditsForTask(previousTaskId);
			}

			previousTaskId = task.id;
			localText = task.text;
			localDue = task.due ?? '';
			localFun = task.fun ?? null;
			localFriction = task.friction ?? null;
			showFun = task.fun != null;
			showFriction = task.friction != null;

			setTimeout(() => textareaRef?.focus(), 50);
		} else if (!task && previousTaskId) {
			// Deselected — save edits (skipped for completed/deleted tasks)
			saveEditsForTask(previousTaskId);
			previousTaskId = null;
		}
	});

	function handleClose() {
		selectedTaskId.set(null);
	}

	function handleComplete() {
		const task = $selectedTask;
		if (task) {
			completeTask(task.id);
		}
		selectedTaskId.set(null);
	}

	function handleDeleteConfirm() {
		const task = $selectedTask;
		if (task) {
			deleteTask(task.id);
		}
		showDeleteConfirm = false;
		selectedTaskId.set(null);
	}

	let staleness = $derived(
		$selectedTask
			? computeStaleness($selectedTask.created, $preferences.stalenessWindow)
			: 0
	);
</script>

{#if $selectedTask}
	<div class="inspector">
		<header class="inspector-header">
			<h3 class="h3">Task Details</h3>
			<button type="button" class="btn btn-sm variant-ghost" onclick={handleClose} aria-label="Close inspector">
				✕
			</button>
		</header>

		<div class="inspector-body">
			<!-- Text field -->
			<label class="label">
				<span class="label-text">Text</span>
				<textarea
					class="textarea"
					rows="4"
					bind:value={localText}
					bind:this={textareaRef}
					placeholder="Task description..."
				></textarea>
			</label>

			<!-- Due date -->
			<label class="label">
				<span class="label-text">Due Date</span>
				<input
					class="input"
					type="text"
					bind:value={localDue}
					placeholder="YYMMDD"
					maxlength="6"
				/>
			</label>

			<!-- Fun -->
			<div class="field-group">
				<label class="flex items-center gap-2">
					<input class="checkbox" type="checkbox" bind:checked={showFun} />
					<span class="label-text">Fun</span>
				</label>
				{#if showFun}
					<div class="slider-row">
						<input
							class="input"
							type="range"
							min="1"
							max="10"
							bind:value={localFun}
							oninput={(e) => { localFun = parseInt(e.currentTarget.value); }}
						/>
						<span class="slider-value badge variant-filled-primary">{localFun ?? 5}</span>
					</div>
				{/if}
			</div>

			<!-- Friction -->
			<div class="field-group">
				<label class="flex items-center gap-2">
					<input class="checkbox" type="checkbox" bind:checked={showFriction} />
					<span class="label-text">Friction</span>
				</label>
				{#if showFriction}
					<div class="slider-row">
						<input
							class="input"
							type="range"
							min="1"
							max="10"
							bind:value={localFriction}
							oninput={(e) => { localFriction = parseInt(e.currentTarget.value); }}
						/>
						<span class="slider-value badge variant-filled-primary">{localFriction ?? 5}</span>
					</div>
				{/if}
			</div>

			<!-- Read-only metadata -->
			<div class="card variant-soft metadata-card">
				<header class="card-header">
					<h4 class="h4">Metadata</h4>
				</header>
				<div class="metadata-grid">
					<span class="metadata-label">Importance</span>
					<span class="metadata-value">{$selectedTask.importance}</span>
					<span class="metadata-label">Urgency</span>
					<span class="metadata-value">{$selectedTask.urgency}</span>
					<span class="metadata-label">Created</span>
					<span class="metadata-value">{$selectedTask.created}</span>
					<span class="metadata-label">Staleness</span>
					<span class="metadata-value">{staleness.toFixed(1)}</span>
				</div>
			</div>

			<!-- Actions -->
			<div class="action-buttons">
				<button type="button" class="btn variant-filled-primary" onclick={handleComplete}>
					Complete
				</button>
				<button type="button" class="btn variant-filled-error" onclick={() => { showDeleteConfirm = true; }}>
					Delete
				</button>
			</div>
		</div>
	</div>

	{#if showDeleteConfirm}
		<ConfirmDialog
			message="Permanently delete this task? This cannot be undone."
			onConfirm={handleDeleteConfirm}
			onCancel={() => { showDeleteConfirm = false; }}
		/>
	{/if}
{/if}

<style>
	.inspector {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow-y: auto;
	}

	.inspector-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border-bottom: 1px solid var(--axon-muted);
		flex-shrink: 0;
	}

	.inspector-body {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 16px;
		overflow-y: auto;
		flex: 1;
	}

	.label-text {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--axon-text-secondary);
		margin-bottom: 4px;
		display: block;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.slider-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.slider-row input[type='range'] {
		flex: 1;
	}

	.slider-value {
		min-width: 32px;
		text-align: center;
	}

	.metadata-card {
		background-color: var(--axon-background);
		border: 1px solid var(--axon-muted);
		border-radius: 8px;
		padding: 12px;
	}

	.metadata-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 4px 12px;
		padding-top: 8px;
	}

	.metadata-label {
		font-size: 0.75rem;
		color: var(--axon-text-secondary);
	}

	.metadata-value {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--axon-foreground);
	}

	.action-buttons {
		display: flex;
		gap: 8px;
		padding-top: 8px;
	}

	.action-buttons .btn {
		flex: 1;
	}
</style>
