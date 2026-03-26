// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface FileSystemFileHandle {
		queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
		requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
	}

	interface Window {
		showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
		showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
	}

	interface OpenFilePickerOptions {
		types?: FilePickerAcceptType[];
		multiple?: boolean;
		excludeAcceptAllOption?: boolean;
	}

	interface SaveFilePickerOptions {
		suggestedName?: string;
		types?: FilePickerAcceptType[];
		excludeAcceptAllOption?: boolean;
	}

	interface FilePickerAcceptType {
		description?: string;
		accept: Record<string, string[]>;
	}
}

export {};
