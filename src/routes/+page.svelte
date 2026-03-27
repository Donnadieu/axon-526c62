<script lang="ts">
	import { get } from 'svelte/store';
	import { browser } from '$app/environment';
	import Canvas3D from '$lib/components/canvas/Canvas3D.svelte';
	import Toolbar from '$lib/components/ui/Toolbar.svelte';
	import Inspector from '$lib/components/ui/Inspector.svelte';
	import FileControls from '$lib/components/ui/FileControls.svelte';
	import {
		selectedTask,
		selectedTaskId,
		tasks,
		nonTaskContent,
		loadFromMarkdown,
		addTask,
		completeTask,
		deleteTask
	} from '$lib/stores/tasks';
	import { serializeTasks } from '$lib/parser/markdown-serializer';

	function handleFileLoaded(content: string) {
		loadFromMarkdown(content);
	}

	function getContent(): string {
		return serializeTasks(get(tasks), get(nonTaskContent));
	}

	if (browser && (window as any).__AXON_E2E__) {
		(window as any).__axon = {
			addTask,
			completeTask,
			deleteTask,
			selectTask: (id: string) => selectedTaskId.set(id),
			deselectTask: () => selectedTaskId.set(null),
			getTasks: () => get(tasks),
			getOpenTasks: () => get(tasks).filter((t) => t.status === 'open')
		};
	}
</script>

<div class="app-layout">
	<Toolbar>
		<FileControls onFileLoaded={handleFileLoaded} {getContent} />
	</Toolbar>

	<main class="viewport">
		<div class="canvas-area">
			<Canvas3D />
		</div>
		<aside class="inspector-panel" class:open={$selectedTask !== null}>
			<Inspector />
		</aside>
	</main>
</div>

<style>
	.app-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}

	.viewport {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.canvas-area {
		flex: 3;
		min-width: 0;
	}

	.inspector-panel {
		width: 0;
		flex-shrink: 0;
		background-color: var(--axon-secondary);
		border-left: 1px solid var(--axon-muted);
		transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		overflow: hidden;
	}

	.inspector-panel.open {
		width: 320px;
	}

	.inspector-panel :global(.inspector) {
		opacity: 0;
		transform: translateX(16px);
		transition:
			opacity 0.2s ease 0.05s,
			transform 0.2s ease 0.05s;
	}

	.inspector-panel.open :global(.inspector) {
		opacity: 1;
		transform: translateX(0);
	}
</style>
