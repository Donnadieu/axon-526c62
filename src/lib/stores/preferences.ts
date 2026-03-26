import { writable, get } from 'svelte/store';
import type { LensMode, UserPreferences } from '$lib/types/preferences';

const STORAGE_KEY = 'axon-preferences';

const DEFAULTS: UserPreferences = {
	stalenessWindow: 30,
	activeLens: 'staleness',
	lastFileHandle: null
};

function loadFromStorage(): UserPreferences {
	if (typeof localStorage === 'undefined') return { ...DEFAULTS };
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULTS };
		const parsed = JSON.parse(raw);
		return {
			stalenessWindow: parsed.stalenessWindow ?? DEFAULTS.stalenessWindow,
			activeLens: parsed.activeLens ?? DEFAULTS.activeLens,
			lastFileHandle: null
		};
	} catch {
		return { ...DEFAULTS };
	}
}

function saveToStorage(prefs: UserPreferences): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({
			stalenessWindow: prefs.stalenessWindow,
			activeLens: prefs.activeLens
		})
	);
}

export const preferences = writable<UserPreferences>(loadFromStorage());

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

preferences.subscribe((value) => {
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => saveToStorage(value), 200);
});

export function setLens(lens: LensMode): void {
	preferences.update((p) => ({ ...p, activeLens: lens }));
}

export function setStalenessWindow(days: number): void {
	preferences.update((p) => ({ ...p, stalenessWindow: days }));
}
