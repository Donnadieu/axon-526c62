<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isFileSystemAccessSupported,
		openFile,
		createDefaultFile,
		reopenHandle,
		saveFile
	} from '$lib/filesystem/file-access';
	import {
		loadStoredHandle,
		storeHandle
	} from '$lib/filesystem/handle-store';
	import { fileHandle as fileHandleStore } from '$lib/stores/tasks';
	import FallbackImportExport from './FallbackImportExport.svelte';

	interface Props {
		onFileLoaded: (content: string) => void;
		getContent: () => string;
		onSaveReady?: (saveFn: () => Promise<void>) => void;
	}

	let { onFileLoaded, getContent, onSaveReady }: Props = $props();

	let supported = $state(false);
	let fileName = $state('');
	let currentHandle = $state<FileSystemFileHandle | null>(null);

	onMount(async () => {
		supported = isFileSystemAccessSupported();
		if (!supported) return;

		const storedHandle = await loadStoredHandle();
		if (storedHandle) {
			const result = await reopenHandle(storedHandle);
			if (result.ok) {
				registerHandle(storedHandle);
				onFileLoaded(result.value);
				return;
			}
		}

		const created = await createDefaultFile();
		if (created.ok) {
			registerHandle(created.value.handle);
			storeHandle(created.value.handle);
			onFileLoaded(created.value.content);
		}
	});

	async function handleOpen() {
		const result = await openFile();
		if (result.ok) {
			registerHandle(result.value.handle);
			storeHandle(result.value.handle);
			onFileLoaded(result.value.content);
		}
	}

	async function save() {
		if (currentHandle) {
			await saveFile(currentHandle, getContent());
		}
	}

	function registerHandle(handle: FileSystemFileHandle) {
		currentHandle = handle;
		fileName = handle.name;
		fileHandleStore.set(handle);
		onSaveReady?.(save);
	}
</script>

{#if supported}
	<div class="flex items-center gap-3">
		<button
			class="btn variant-filled-primary rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80"
			onclick={handleOpen}
		>
			Open file
		</button>
		{#if fileName}
			<span class="text-sm text-muted">{fileName}</span>
		{/if}
	</div>
{:else}
	<FallbackImportExport onImport={onFileLoaded} {getContent} />
{/if}
