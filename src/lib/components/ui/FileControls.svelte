<script lang="ts">
	import { onMount } from 'svelte';
	import {
		isFileSystemAccessSupported,
		openFile,
		createDefaultFile,
		reopenHandle,
		saveFile
	} from '$lib/filesystem/file-access';
	import FallbackImportExport from './FallbackImportExport.svelte';

	interface Props {
		onFileLoaded: (content: string) => void;
		getContent: () => string;
		onSaveReady?: (saveFn: () => Promise<void>) => void;
	}

	let { onFileLoaded, getContent, onSaveReady }: Props = $props();

	let supported = $state(false);
	let fileName = $state('');
	let fileHandle = $state<FileSystemFileHandle | null>(null);

	onMount(async () => {
		supported = isFileSystemAccessSupported();
		if (!supported) return;

		const storedHandle = await loadStoredHandle();
		if (storedHandle) {
			const result = await reopenHandle(storedHandle);
			if (result.ok) {
				registerSave(storedHandle);
				onFileLoaded(result.value);
				return;
			}
		}

		const created = await createDefaultFile();
		if (created.ok) {
			registerSave(created.value.handle);
			storeHandle(created.value.handle);
			onFileLoaded(created.value.content);
		}
	});

	async function handleOpen() {
		const result = await openFile();
		if (result.ok) {
			registerSave(result.value.handle);
			storeHandle(result.value.handle);
			onFileLoaded(result.value.content);
		}
	}

	async function save() {
		if (fileHandle) {
			await saveFile(fileHandle, getContent());
		}
	}

	function registerSave(handle: FileSystemFileHandle) {
		fileHandle = handle;
		fileName = handle.name;
		onSaveReady?.(save);
	}

	async function loadStoredHandle(): Promise<FileSystemFileHandle | null> {
		// FileSystemFileHandle cannot be serialized to localStorage.
		// In a full implementation, this would use IndexedDB via idb-keyval.
		// For now, handle persistence is session-only.
		return null;
	}

	function storeHandle(_handle: FileSystemFileHandle): void {
		// Placeholder for IndexedDB-based handle storage.
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
