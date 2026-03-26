export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

export function parseDateYYMMDD(dateStr: string): Date | null {
	if (!/^\d{6}$/.test(dateStr)) return null;

	const year = 2000 + parseInt(dateStr.slice(0, 2), 10);
	const month = parseInt(dateStr.slice(2, 4), 10);
	const day = parseInt(dateStr.slice(4, 6), 10);

	if (month < 1 || month > 12 || day < 1 || day > 31) return null;

	const date = new Date(year, month - 1, day);

	if (
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day
	) {
		return null;
	}

	return date;
}

export function daysSince(dateStr: string): number {
	const date = parseDateYYMMDD(dateStr);
	if (!date) return 0;

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const diffMs = today.getTime() - date.getTime();
	return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function computeStaleness(createdDate: string, stalenessWindow: number): number {
	return clamp((daysSince(createdDate) / stalenessWindow) * 10, 0, 10);
}

export function todayYYMMDD(): string {
	const now = new Date();
	const yy = String(now.getFullYear() - 2000).padStart(2, '0');
	const mm = String(now.getMonth() + 1).padStart(2, '0');
	const dd = String(now.getDate()).padStart(2, '0');
	return `${yy}${mm}${dd}`;
}
