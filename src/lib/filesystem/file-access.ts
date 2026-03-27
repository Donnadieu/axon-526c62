export type FileAccessError =
	| { kind: 'user-cancelled' }
	| { kind: 'permission-denied' }
	| { kind: 'not-found' }
	| { kind: 'unknown'; message: string };

export type FileAccessResult<T> = { ok: true; value: T } | { ok: false; error: FileAccessError };

const DEFAULT_FILENAME = 'axon-tasks.md';

const MD_ACCEPT_TYPE = {
	description: 'Markdown files',
	accept: { 'text/markdown': ['.md'] }
};

const DEFAULT_TEMPLATE = `# Axon Tasks
# This file is managed by Axon. Each task is an H2 block with metadata fields.
# Format: ## Task title, followed by key: value fields (id, importance, urgency, created, status, etc.)
`;

export function isFileSystemAccessSupported(): boolean {
	return typeof window !== 'undefined' && typeof window.showOpenFilePicker === 'function';
}

function classifyError(err: unknown): FileAccessError {
	if (err instanceof DOMException) {
		if (err.name === 'AbortError') return { kind: 'user-cancelled' };
		if (err.name === 'NotAllowedError') return { kind: 'permission-denied' };
		if (err.name === 'NotFoundError') return { kind: 'not-found' };
	}
	return { kind: 'unknown', message: err instanceof Error ? err.message : String(err) };
}

export async function openFile(): Promise<
	FileAccessResult<{ handle: FileSystemFileHandle; content: string }>
> {
	try {
		const [handle] = await window.showOpenFilePicker({
			types: [MD_ACCEPT_TYPE],
			multiple: false
		});
		const file = await handle.getFile();
		const content = await file.text();
		return { ok: true, value: { handle, content } };
	} catch (err) {
		return { ok: false, error: classifyError(err) };
	}
}

export async function saveFile(
	handle: FileSystemFileHandle,
	content: string
): Promise<FileAccessResult<void>> {
	try {
		const writable = await handle.createWritable();
		await writable.write(content);
		await writable.close();
		return { ok: true, value: undefined };
	} catch (err) {
		return { ok: false, error: classifyError(err) };
	}
}

export async function createDefaultFile(): Promise<
	FileAccessResult<{ handle: FileSystemFileHandle; content: string }>
> {
	try {
		const handle = await window.showSaveFilePicker({
			suggestedName: DEFAULT_FILENAME,
			types: [MD_ACCEPT_TYPE]
		});
		const writable = await handle.createWritable();
		await writable.write(DEFAULT_TEMPLATE);
		await writable.close();
		return { ok: true, value: { handle, content: DEFAULT_TEMPLATE } };
	} catch (err) {
		return { ok: false, error: classifyError(err) };
	}
}

export async function reopenHandle(
	handle: FileSystemFileHandle
): Promise<FileAccessResult<string>> {
	try {
		const permission = await handle.queryPermission({ mode: 'readwrite' });
		if (permission === 'granted') {
			const file = await handle.getFile();
			return { ok: true, value: await file.text() };
		}
		const requested = await handle.requestPermission({ mode: 'readwrite' });
		if (requested !== 'granted') {
			return { ok: false, error: { kind: 'permission-denied' } };
		}
		const file = await handle.getFile();
		return { ok: true, value: await file.text() };
	} catch (err) {
		return { ok: false, error: classifyError(err) };
	}
}
