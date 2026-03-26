import { describe, it, expect } from 'vitest';
import { generateId } from '../../src/lib/utils/id';

describe('generateId', () => {
	it('returns a string of length 8', () => {
		const id = generateId();
		expect(typeof id).toBe('string');
		expect(id).toHaveLength(8);
	});

	it('produces different IDs on successive calls', () => {
		const a = generateId();
		const b = generateId();
		expect(a).not.toBe(b);
	});
});
