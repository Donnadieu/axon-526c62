import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	clamp,
	parseDateYYMMDD,
	daysSince,
	computeStaleness,
	todayYYMMDD
} from '../../src/lib/utils/staleness';

describe('clamp', () => {
	it('returns value when within range', () => {
		expect(clamp(5, 0, 10)).toBe(5);
	});

	it('clamps to min', () => {
		expect(clamp(-1, 0, 10)).toBe(0);
	});

	it('clamps to max', () => {
		expect(clamp(15, 0, 10)).toBe(10);
	});
});

describe('parseDateYYMMDD', () => {
	it("parses '260326' to March 26, 2026", () => {
		const date = parseDateYYMMDD('260326');
		expect(date).not.toBeNull();
		expect(date!.getFullYear()).toBe(2026);
		expect(date!.getMonth()).toBe(2); // March = 2 (zero-indexed)
		expect(date!.getDate()).toBe(26);
	});

	it('returns null for invalid format (too short)', () => {
		expect(parseDateYYMMDD('2603')).toBeNull();
	});

	it('returns null for non-numeric string', () => {
		expect(parseDateYYMMDD('abcdef')).toBeNull();
	});

	it('returns null for invalid month', () => {
		expect(parseDateYYMMDD('261326')).toBeNull();
	});

	it('returns null for invalid day', () => {
		expect(parseDateYYMMDD('260230')).toBeNull(); // Feb 30
	});
});

describe('daysSince', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns 0 for today', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		expect(daysSince('260326')).toBe(0);
	});

	it('returns correct days for past date', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		expect(daysSince('260311')).toBe(15); // March 11 → 15 days ago
	});

	it('returns 0 for invalid date string', () => {
		expect(daysSince('invalid')).toBe(0);
	});
});

describe('todayYYMMDD', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns correct YYMMDD format for a known date', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		expect(todayYYMMDD()).toBe('260326');
	});

	it('pads single-digit month and day with zeros', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 0, 5)); // January 5, 2026
		expect(todayYYMMDD()).toBe('260105');
	});

	it('returns a 6-character string matching YYMMDD pattern', () => {
		const result = todayYYMMDD();
		expect(result).toMatch(/^\d{6}$/);
	});
});

describe('computeStaleness', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns z=5.0 for task created 15 days ago with 30-day window', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		expect(computeStaleness('260311', 30)).toBe(5);
	});

	it('returns z=10 (clamped) for task created 60 days ago with 30-day window', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		// 60 days before March 26 = Jan 25
		expect(computeStaleness('260125', 30)).toBe(10);
	});

	it('returns z=0 for task created today with 30-day window', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 2, 26)); // March 26, 2026
		expect(computeStaleness('260326', 30)).toBe(0);
	});
});
