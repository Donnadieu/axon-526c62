<script lang="ts">
	import { importFile, exportFile } from '$lib/filesystem/fallback';
	import { isDirty } from '$lib/stores/tasks';

	interface Props {
		onImport: (content: string) => void;
		getContent: () => string;
	}

	let { onImport, getContent }: Props = $props();

	let importing = $state(false);
	let error = $state('');

	async function handleImport() {
		importing = true;
		error = '';
		try {
			const content = await importFile();
			onImport(content);
			isDirty.set(false);
		} catch (err) {
			if (err instanceof Error && err.message !== 'File selection cancelled') {
				error = err.message;
			}
		} finally {
			importing = false;
		}
	}

	function handleExport() {
		exportFile(getContent());
		isDirty.set(false);
	}
</script>

<div class="flex flex-col gap-3">
	{#if $isDirty}
		<div class="rounded-lg border border-red-500/50 bg-red-500/15 px-4 py-3 text-sm text-red-200">
			You have unsaved changes! Export now to avoid losing your work.
		</div>
	{:else}
		<div class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
			Your browser doesn't support direct file access. Changes are in-memory only — use Export to save.
		</div>
	{/if}

	<div class="flex gap-2">
		<button
			class="btn variant-filled-primary rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/80"
			onclick={handleImport}
			disabled={importing}
		>
			{importing ? 'Importing...' : 'Import .md file'}
		</button>

		<button
			class="btn variant-filled-secondary rounded-md bg-secondary px-4 py-2 text-sm font-medium text-white hover:bg-secondary/80"
			onclick={handleExport}
		>
			Export .md file
		</button>
	</div>

	{#if error}
		<p class="text-sm text-destructive">{error}</p>
	{/if}
</div>
