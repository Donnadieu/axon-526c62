const DEFAULT_FILENAME = 'axon-tasks.md';

export function importFile(): Promise<string> {
	return new Promise((resolve, reject) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.md';
		input.style.display = 'none';

		input.addEventListener('change', () => {
			const file = input.files?.[0];
			if (!file) {
				reject(new Error('No file selected'));
				input.remove();
				return;
			}
			const reader = new FileReader();
			reader.onload = () => {
				resolve(reader.result as string);
				input.remove();
			};
			reader.onerror = () => {
				reject(new Error('Failed to read file'));
				input.remove();
			};
			reader.readAsText(file);
		});

		input.addEventListener('cancel', () => {
			reject(new Error('File selection cancelled'));
			input.remove();
		});

		document.body.appendChild(input);
		input.click();
	});
}

export function exportFile(content: string, filename: string = DEFAULT_FILENAME): void {
	const blob = new Blob([content], { type: 'text/markdown' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.style.display = 'none';
	document.body.appendChild(a);
	a.click();
	URL.revokeObjectURL(url);
	a.remove();
}
