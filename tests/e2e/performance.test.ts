import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupTestPage(page: Page) {
	return page.addInitScript(() => {
		(window as any).__AXON_E2E__ = true;
		(window as any).showOpenFilePicker = undefined;
		(window as any).showSaveFilePicker = undefined;
		(window as any).showDirectoryPicker = undefined;
	});
}

/** Generate a markdown file with `count` tasks spread across the 10x10 grid. */
function generateTasksMd(count: number): string {
	const lines: string[] = ['# Axon Tasks (Performance Test)', ''];

	for (let i = 0; i < count; i++) {
		const importance = (i % 10) + 1;
		const urgency = (Math.floor(i / 10) % 10) + 1;
		const id = `perf${String(i).padStart(4, '0')}`;
		// Stagger creation dates across the past 90 days
		const daysAgo = Math.floor(i * 90 / count);
		const d = new Date();
		d.setDate(d.getDate() - daysAgo);
		const yy = String(d.getFullYear()).slice(-2);
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		const created = `${yy}${mm}${dd}`;

		const fun = (i % 10) + 1;
		const friction = ((i + 5) % 10) + 1;

		lines.push(`## Task ${i + 1}`);
		lines.push('');
		lines.push(`id: ${id}`);
		lines.push(`importance: ${importance}`);
		lines.push(`urgency: ${urgency}`);
		lines.push(`created: ${created}`);
		lines.push('status: open');
		lines.push(`fun: ${fun}`);
		lines.push(`friction: ${friction}`);
		lines.push('');
	}

	return lines.join('\n');
}

async function importMarkdown(page: Page, mdContent: string) {
	const tmpFile = path.join(os.tmpdir(), `axon-perf-${Date.now()}.md`);
	fs.writeFileSync(tmpFile, mdContent, 'utf-8');

	try {
		const chooserPromise = page.waitForEvent('filechooser');
		await page.getByRole('button', { name: /Import \.md file/i }).click();
		const chooser = await chooserPromise;
		await chooser.setFiles(tmpFile);
	} finally {
		try {
			fs.unlinkSync(tmpFile);
		} catch {}
	}
}

// ---------------------------------------------------------------------------
// Performance tests
// ---------------------------------------------------------------------------

test.describe('Performance', () => {
	test('200 tasks render within 3 seconds', async ({ page }) => {
		// Collect console errors
		const consoleErrors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				consoleErrors.push(msg.text());
			}
		});

		await setupTestPage(page);
		await page.goto('/');
		await expect(page.getByRole('button', { name: /Import \.md file/i })).toBeVisible({
			timeout: 5000
		});

		// Generate 200-task markdown
		const md = generateTasksMd(200);

		// Measure time from import click to render stable
		const startTime = Date.now();

		await importMarkdown(page, md);

		// Wait for canvas to be visible and rendering
		await expect(page.locator('canvas')).toBeVisible();

		// Wait until the frame is fully painted by checking for animation stability
		// We consider rendering complete when the canvas has had time to paint all spheres
		await page.waitForTimeout(500); // Let the render loop process all spheres

		// Verify that the WebGL canvas is active
		const canvasOk = await page.locator('canvas').evaluate((el: HTMLCanvasElement) => {
			const gl = el.getContext('webgl2') || el.getContext('webgl');
			return gl !== null && el.width > 0 && el.height > 0;
		});
		expect(canvasOk).toBe(true);

		const elapsed = Date.now() - startTime;

		// Performance gate: render within 3 seconds
		expect(elapsed).toBeLessThan(3000);

		// Verify the canvas remains responsive by performing a user interaction
		const canvas = page.locator('canvas');
		const box = await canvas.boundingBox();
		expect(box).not.toBeNull();

		// Simulate orbit interaction (mouse drag on canvas) — should not freeze
		await canvas.hover({ position: { x: box!.width / 2, y: box!.height / 2 } });
		const interactionStart = Date.now();
		await page.mouse.down();
		await page.mouse.move(box!.x + box!.width / 2 + 50, box!.y + box!.height / 2 + 50, {
			steps: 5
		});
		await page.mouse.up();
		const interactionElapsed = Date.now() - interactionStart;

		// Interaction should complete quickly (under 5 seconds, relaxed for software rendering)
		expect(interactionElapsed).toBeLessThan(5000);

		// Switch lens to verify reactivity with 200 tasks
		await page.getByRole('button', { name: 'Fun' }).click();
		await page.waitForTimeout(500);
		await expect(page.getByRole('button', { name: 'Fun' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);

		// Toggle 2D mode
		await page.locator('.flatten-btn').click();
		await page.waitForTimeout(500);
		await expect(page.locator('.flatten-btn')).toHaveAttribute('aria-pressed', 'true');

		// No console errors during the entire test
		const relevantErrors = consoleErrors.filter(
			(e) =>
				// Ignore common non-app errors
				!e.includes('favicon') &&
				!e.includes('DevTools') &&
				!e.includes('third-party')
		);
		expect(relevantErrors).toEqual([]);
	});
});
