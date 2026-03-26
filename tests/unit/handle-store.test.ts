import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadStoredHandle, storeHandle } from '../../src/lib/filesystem/handle-store';

function createMockIDB(storedValue: unknown = undefined) {
	const store: Record<string, unknown> = {};
	if (storedValue !== undefined) {
		store['lastFileHandle'] = storedValue;
	}

	const mockObjectStore = {
		get: vi.fn((key: string) => {
			const req = {
				result: store[key],
				onsuccess: null as (() => void) | null,
				onerror: null as (() => void) | null
			};
			setTimeout(() => req.onsuccess?.(), 0);
			return req;
		}),
		put: vi.fn((value: unknown, key: string) => {
			store[key] = value;
			const req = {
				onsuccess: null as (() => void) | null,
				onerror: null as (() => void) | null
			};
			setTimeout(() => req.onsuccess?.(), 0);
			return req;
		})
	};

	const mockTransaction = {
		objectStore: vi.fn(() => mockObjectStore)
	};

	const mockDB = {
		transaction: vi.fn(() => mockTransaction),
		createObjectStore: vi.fn()
	};

	const mockOpenReq = {
		result: mockDB,
		onupgradeneeded: null as (() => void) | null,
		onsuccess: null as (() => void) | null,
		onerror: null as (() => void) | null,
		error: null
	};

	const mockIndexedDB = {
		open: vi.fn(() => {
			setTimeout(() => {
				mockOpenReq.onupgradeneeded?.();
				mockOpenReq.onsuccess?.();
			}, 0);
			return mockOpenReq;
		})
	};

	Object.defineProperty(globalThis, 'indexedDB', {
		value: mockIndexedDB,
		writable: true,
		configurable: true
	});

	return { mockIndexedDB, mockDB, mockObjectStore, store };
}

describe('handle-store', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe('loadStoredHandle', () => {
		it('returns null when no handle is stored', async () => {
			createMockIDB();
			const result = await loadStoredHandle();
			expect(result).toBeNull();
		});

		it('returns stored handle when one exists', async () => {
			const mockHandle = { name: 'axon-tasks.md' } as FileSystemFileHandle;
			createMockIDB(mockHandle);
			const result = await loadStoredHandle();
			expect(result).toBe(mockHandle);
		});

		it('returns null when indexedDB throws', async () => {
			Object.defineProperty(globalThis, 'indexedDB', {
				value: {
					open: vi.fn(() => {
						throw new Error('IDB unavailable');
					})
				},
				writable: true,
				configurable: true
			});
			const result = await loadStoredHandle();
			expect(result).toBeNull();
		});
	});

	describe('storeHandle', () => {
		it('stores handle in IndexedDB', async () => {
			const { mockObjectStore } = createMockIDB();
			const mockHandle = { name: 'test.md' } as FileSystemFileHandle;

			await storeHandle(mockHandle);

			expect(mockObjectStore.put).toHaveBeenCalledWith(mockHandle, 'lastFileHandle');
		});

		it('does not throw when indexedDB fails', async () => {
			Object.defineProperty(globalThis, 'indexedDB', {
				value: {
					open: vi.fn(() => {
						throw new Error('IDB unavailable');
					})
				},
				writable: true,
				configurable: true
			});

			await expect(storeHandle({} as FileSystemFileHandle)).resolves.toBeUndefined();
		});
	});
});
