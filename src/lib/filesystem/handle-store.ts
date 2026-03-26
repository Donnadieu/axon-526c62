const DB_NAME = 'axon';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const HANDLE_KEY = 'lastFileHandle';

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			req.result.createObjectStore(STORE_NAME);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function loadStoredHandle(): Promise<FileSystemFileHandle | null> {
	try {
		const db = await openDB();
		return new Promise((resolve) => {
			const tx = db.transaction(STORE_NAME, 'readonly');
			const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
			req.onsuccess = () => resolve(req.result ?? null);
			req.onerror = () => resolve(null);
		});
	} catch {
		return null;
	}
}

export async function storeHandle(handle: FileSystemFileHandle): Promise<void> {
	try {
		const db = await openDB();
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
	} catch {
		// Best-effort persistence — silent failure is acceptable
	}
}
