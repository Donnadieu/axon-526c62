import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	isFileSystemAccessSupported,
	openFile,
	saveFile,
	createDefaultFile,
	reopenHandle
} from '../../src/lib/filesystem/file-access';

const originalWindow = globalThis.window;

function setupWindow(extras: Record<string, unknown> = {}) {
	const win = { ...(originalWindow ?? {}), ...extras };
	Object.defineProperty(globalThis, 'window', { value: win, writable: true, configurable: true });
	return win;
}

function restoreWindow() {
	Object.defineProperty(globalThis, 'window', {
		value: originalWindow,
		writable: true,
		configurable: true
	});
}

describe('isFileSystemAccessSupported', () => {
	afterEach(restoreWindow);

	it('returns true when showOpenFilePicker exists on window', () => {
		setupWindow({ showOpenFilePicker: vi.fn() });
		expect(isFileSystemAccessSupported()).toBe(true);
	});

	it('returns false when showOpenFilePicker is missing', () => {
		setupWindow();
		expect(isFileSystemAccessSupported()).toBe(false);
	});

	it('returns false when window is undefined', () => {
		Object.defineProperty(globalThis, 'window', {
			value: undefined,
			writable: true,
			configurable: true
		});
		expect(isFileSystemAccessSupported()).toBe(false);
	});
});

describe('openFile', () => {
	let mockHandle: any;

	beforeEach(() => {
		mockHandle = {
			getFile: vi.fn().mockResolvedValue({
				text: vi.fn().mockResolvedValue('# Task file content')
			})
		};
		setupWindow({
			showOpenFilePicker: vi.fn().mockResolvedValue([mockHandle])
		});
	});

	afterEach(restoreWindow);

	it('calls showOpenFilePicker with .md filter and returns handle + content', async () => {
		const result = await openFile();

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.handle).toBe(mockHandle);
			expect(result.value.content).toBe('# Task file content');
		}

		expect((globalThis.window as any).showOpenFilePicker).toHaveBeenCalledWith({
			types: [{ description: 'Markdown files', accept: { 'text/markdown': ['.md'] } }],
			multiple: false
		});
	});

	it('returns user-cancelled error when picker is aborted', async () => {
		(globalThis.window as any).showOpenFilePicker = vi
			.fn()
			.mockRejectedValue(new DOMException('User cancelled', 'AbortError'));

		const result = await openFile();

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe('user-cancelled');
		}
	});

	it('returns permission-denied error on NotAllowedError', async () => {
		(globalThis.window as any).showOpenFilePicker = vi
			.fn()
			.mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError'));

		const result = await openFile();

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe('permission-denied');
		}
	});

	it('returns unknown error for unexpected failures', async () => {
		(globalThis.window as any).showOpenFilePicker = vi
			.fn()
			.mockRejectedValue(new Error('Network failure'));

		const result = await openFile();

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe('unknown');
			expect(result.error).toHaveProperty('message', 'Network failure');
		}
	});
});

describe('saveFile', () => {
	it('writes content via writable stream', async () => {
		const mockWritable = {
			write: vi.fn().mockResolvedValue(undefined),
			close: vi.fn().mockResolvedValue(undefined)
		};
		const mockHandle = {
			createWritable: vi.fn().mockResolvedValue(mockWritable)
		} as unknown as FileSystemFileHandle;

		const result = await saveFile(mockHandle, '# Updated content');

		expect(result.ok).toBe(true);
		expect(mockWritable.write).toHaveBeenCalledWith('# Updated content');
		expect(mockWritable.close).toHaveBeenCalled();
	});

	it('returns error when write fails', async () => {
		const mockHandle = {
			createWritable: vi
				.fn()
				.mockRejectedValue(new DOMException('Denied', 'NotAllowedError'))
		} as unknown as FileSystemFileHandle;

		const result = await saveFile(mockHandle, 'content');

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe('permission-denied');
		}
	});
});

describe('createDefaultFile', () => {
	beforeEach(() => {
		setupWindow({ showSaveFilePicker: vi.fn() });
	});

	afterEach(restoreWindow);

	it('creates a file with default template content', async () => {
		const mockWritable = {
			write: vi.fn().mockResolvedValue(undefined),
			close: vi.fn().mockResolvedValue(undefined)
		};
		const mockHandle = {
			createWritable: vi.fn().mockResolvedValue(mockWritable)
		};
		(globalThis.window as any).showSaveFilePicker = vi.fn().mockResolvedValue(mockHandle);

		const result = await createDefaultFile();

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.handle).toBe(mockHandle);
			expect(result.value.content).toContain('# Axon Tasks');
		}

		expect((globalThis.window as any).showSaveFilePicker).toHaveBeenCalledWith({
			suggestedName: 'axon-tasks.md',
			types: [{ description: 'Markdown files', accept: { 'text/markdown': ['.md'] } }]
		});
		expect(mockWritable.write).toHaveBeenCalled();
		expect(mockWritable.close).toHaveBeenCalled();
	});

	it('returns user-cancelled on abort', async () => {
		(globalThis.window as any).showSaveFilePicker = vi
			.fn()
			.mockRejectedValue(new DOMException('User cancelled', 'AbortError'));

		const result = await createDefaultFile();

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe('user-cancelled');
		}
	});
});

describe('reopenHandle', () => {
	it('reads file when permission is already granted', async () => {
		const mockHandle = {
			queryPermission: vi.fn().mockResolvedValue('granted'),
			getFile: vi.fn().mockResolvedValue({
				text: vi.fn().mockResolvedValue('file content')
			})
		} as unknown as FileSystemFileHandle;

		const result = await reopenHandle(mockHandle);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe('file content');
		}
		expect(mockHandle.queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
	});

	it('requests permission when not already granted and succeeds', async () => {
		const mockHandle = {
			queryPermission: vi.fn().mockResolvedValue('prompt'),
			requestPermission: vi.fn().mockResolvedValue('granted'),
			getFile: vi.fn().mockResolvedValue({
				text: vi.fn().mockResolvedValue('file content after prompt')
			})
		} as unknown as FileSystemFileHandle;

		const result = await reopenHandle(mockHandle);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value).toBe('file content after prompt');
		}
		expect(mockHandle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
	});

	it('returns permission-denied when user denies', async () => {
		const mockHandle = {
			queryPermission: vi.fn().mockResolvedValue('prompt'),
			requestPermission: vi.fn().mockResolvedValue('denied')
		} as unknown as FileSystemFileHandle;

		const result = await reopenHandle(mockHandle);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe('permission-denied');
		}
	});

	it('returns error when handle is stale', async () => {
		const mockHandle = {
			queryPermission: vi
				.fn()
				.mockRejectedValue(new DOMException('Not found', 'NotFoundError'))
		} as unknown as FileSystemFileHandle;

		const result = await reopenHandle(mockHandle);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.kind).toBe('not-found');
		}
	});
});
