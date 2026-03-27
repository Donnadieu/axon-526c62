import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Disable the File System Access API and enable E2E test hooks.
 */
function setupTestPage(page: Page) {
	return page.addInitScript(() => {
		(window as any).__AXON_E2E__ = true;
		(window as any).showOpenFilePicker = undefined;
		(window as any).showSaveFilePicker = undefined;
		(window as any).showDirectoryPicker = undefined;
	});
}

/** Import a markdown string via the fallback file-chooser flow. */
async function importMarkdown(page: Page, mdContent: string) {
	const tmpFile = path.join(os.tmpdir(), `axon-test-${Date.now()}.md`);
	fs.writeFileSync(tmpFile, mdContent, 'utf-8');

	try {
		const chooserPromise = page.waitForEvent('filechooser');
		await page.getByRole('button', { name: /Import \.md file/i }).click();
		const chooser = await chooserPromise;
		await chooser.setFiles(tmpFile);
		await page.waitForTimeout(1000);
	} finally {
		try {
			fs.unlinkSync(tmpFile);
		} catch {}
	}
}

/** Export via the fallback flow and return the downloaded file content. */
async function exportMarkdown(page: Page): Promise<string> {
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: /Export \.md file/i }).click();
	const download = await downloadPromise;
	const filePath = await download.path();
	return fs.readFileSync(filePath!, 'utf-8');
}

/** Select a task by ID via the E2E test hook. */
async function selectTask(page: Page, taskId: string) {
	await page.evaluate((id) => (window as any).__axon.selectTask(id), taskId);
	await page.waitForTimeout(300);
}

/** Create a task via the E2E test hook and return its ID. */
async function createTask(page: Page, overrides: Record<string, unknown> = {}): Promise<string> {
	return page.evaluate((opts) => {
		const id = Math.random().toString(36).slice(2, 10);
		const now = new Date();
		const yy = String(now.getFullYear()).slice(-2);
		const mm = String(now.getMonth() + 1).padStart(2, '0');
		const dd = String(now.getDate()).padStart(2, '0');
		(window as any).__axon.addTask({
			id,
			text: opts.text ?? '',
			importance: opts.importance ?? 5,
			urgency: opts.urgency ?? 5,
			created: `${yy}${mm}${dd}`,
			status: 'open',
			...opts
		});
		(window as any).__axon.selectTask(id);
		return id;
	}, overrides);
}

// A simple two-task markdown file used by most tests.
const TWO_TASK_MD = `# Axon Tasks

## Buy groceries

id: tst00001
importance: 3
urgency: 8
created: 260301
status: open
fun: 7
friction: 3

## Write report

id: tst00002
importance: 7
urgency: 4
created: 260310
status: open
due: 261231
fun: 4
friction: 8
`;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Task Lifecycle', () => {
	test.beforeEach(async ({ page }) => {
		await setupTestPage(page);
		await page.goto('/');
		await expect(page.getByRole('button', { name: /Import \.md file/i })).toBeVisible({
			timeout: 5000
		});
	});

	test('Create, edit, complete lifecycle', async ({ page }) => {
		// 1. Import a test .md file via fallback
		await importMarkdown(page, TWO_TASK_MD);

		// 2. Verify canvas element and WebGL context
		const canvas = page.locator('canvas');
		await expect(canvas).toBeVisible();
		const hasWebGL = await canvas.evaluate((el: HTMLCanvasElement) => {
			const gl = el.getContext('webgl2') || el.getContext('webgl');
			return gl !== null;
		});
		expect(hasWebGL).toBe(true);

		// 3. Click on canvas to create a new task.
		//    Try canvas click first; fall back to programmatic creation if raycasting
		//    doesn't work in the headless WebGL environment.
		await page.locator('.flatten-btn').click();
		await page.waitForTimeout(1000);

		const box = await canvas.boundingBox();
		expect(box).not.toBeNull();
		await canvas.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
		await page.waitForTimeout(500);

		let taskId: string;
		if (await page.locator('.inspector-panel.open').isVisible()) {
			// Canvas click worked — inspector opened for new task
			taskId = await page.evaluate(() => {
				const tasks = (window as any).__axon.getOpenTasks();
				return tasks[tasks.length - 1]?.id ?? '';
			});
		} else {
			// Fallback: create task programmatically (headless WebGL raycasting limitation)
			taskId = await createTask(page);
		}

		// 4. Verify inspector panel is open
		await expect(page.locator('.inspector-panel.open')).toBeVisible({ timeout: 3000 });

		// 5. Type task text and set a due date
		const textarea = page.locator('.textarea');
		await textarea.fill('My brand new task');
		const dueInput = page.locator('input[placeholder="YYMMDD"]');
		await dueInput.fill('271231');

		// 6. Close the inspector
		await page.getByLabel('Close inspector').click();
		await expect(page.locator('.inspector')).not.toBeVisible();

		// 7. Reopen the task
		await selectTask(page, taskId);
		await expect(page.locator('.inspector-panel.open')).toBeVisible({ timeout: 3000 });

		// 8. Verify text persists
		await expect(textarea).toHaveValue('My brand new task');
		await expect(dueInput).toHaveValue('271231');

		// 9. Click Complete → verify inspector closes
		await page.getByRole('button', { name: 'Complete' }).click();
		await page.waitForTimeout(300);
		await expect(page.locator('.inspector')).not.toBeVisible();

		// 10. Verify the task is no longer in the open tasks
		const openCount = await page.evaluate(() => (window as any).__axon.getOpenTasks().length);
		expect(openCount).toBe(2); // Original 2 tasks remain, new one is completed

		// 11. Export and verify the completed task has status: done
		const exported = await exportMarkdown(page);
		expect(exported).toContain('status: done');
		expect(exported).toContain('My brand new task');
	});

	test('Delete lifecycle', async ({ page }) => {
		// 1. Import a file with tasks
		await importMarkdown(page, TWO_TASK_MD);

		// 2. Select a task for deletion
		await selectTask(page, 'tst00001');
		await expect(page.locator('.inspector-panel.open')).toBeVisible({ timeout: 3000 });

		// Verify we have the right task
		const textarea = page.locator('.textarea');
		await expect(textarea).toHaveValue('Buy groceries');

		// 3. Click Delete → confirm dialog appears
		await page.getByRole('button', { name: 'Delete' }).click();
		await expect(page.locator('.modal-backdrop')).toBeVisible();
		await expect(page.locator('.modal-card')).toBeVisible();

		// 4. Confirm deletion
		await page.locator('.modal-card').getByRole('button', { name: 'Confirm' }).click();
		await page.waitForTimeout(300);

		// 5. Verify inspector closes
		await expect(page.locator('.inspector')).not.toBeVisible();

		// 6. Export and verify the deleted task is removed entirely
		const exported = await exportMarkdown(page);
		expect(exported).not.toContain('Buy groceries');
		expect(exported).not.toContain('tst00001');
		// Other task should still be present
		expect(exported).toContain('Write report');
		expect(exported).toContain('tst00002');
	});

	test('Lens switching', async ({ page }) => {
		// 1. Import tasks with fun and friction values
		await importMarkdown(page, TWO_TASK_MD);

		// 2. Verify Staleness is the default active lens
		const stalenessBtn = page.getByRole('button', { name: 'Staleness' });
		const funBtn = page.getByRole('button', { name: 'Fun' });
		const frictionBtn = page.getByRole('button', { name: 'Friction' });

		await expect(stalenessBtn).toHaveAttribute('aria-pressed', 'true');
		await expect(funBtn).toHaveAttribute('aria-pressed', 'false');
		await expect(frictionBtn).toHaveAttribute('aria-pressed', 'false');

		// 3. Switch to Fun lens
		await funBtn.click();
		await expect(funBtn).toHaveAttribute('aria-pressed', 'true');
		await expect(stalenessBtn).toHaveAttribute('aria-pressed', 'false');
		await expect(frictionBtn).toHaveAttribute('aria-pressed', 'false');
		await expect(funBtn).toHaveClass(/active/);

		// 4. Switch to Friction lens
		await frictionBtn.click();
		await expect(frictionBtn).toHaveAttribute('aria-pressed', 'true');
		await expect(funBtn).toHaveAttribute('aria-pressed', 'false');
		await expect(stalenessBtn).toHaveAttribute('aria-pressed', 'false');
		await expect(frictionBtn).toHaveClass(/active/);

		// 5. Switch back to Staleness
		await stalenessBtn.click();
		await expect(stalenessBtn).toHaveAttribute('aria-pressed', 'true');
		await expect(funBtn).toHaveAttribute('aria-pressed', 'false');
		await expect(frictionBtn).toHaveAttribute('aria-pressed', 'false');
		await expect(stalenessBtn).toHaveClass(/active/);
	});

	test('2D toggle', async ({ page }) => {
		// 1. Initially the toggle shows "2D" (click to switch to 2D)
		const toggleBtn = page.locator('.flatten-btn');
		await expect(toggleBtn).toBeVisible();
		await expect(toggleBtn).toHaveText('2D');
		await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');

		// 2. Click to switch to 2D mode
		await toggleBtn.click();
		await expect(toggleBtn).toHaveText('3D', { timeout: 3000 });
		await expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
		await expect(toggleBtn).toHaveClass(/active/);

		// 3. Click to switch back to 3D
		await toggleBtn.click();
		await expect(toggleBtn).toHaveText('2D', { timeout: 3000 });
		await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
	});

	test('Fallback mode', async ({ page }) => {
		// FSAPI is already mocked as unavailable in beforeEach

		// 1. Verify Import/Export buttons appear
		await expect(page.getByRole('button', { name: /Import \.md file/i })).toBeVisible();
		await expect(page.getByRole('button', { name: /Export \.md file/i })).toBeVisible();

		// Verify the fallback info message is shown
		await expect(
			page.getByText("browser doesn't support direct file access", { exact: false })
		).toBeVisible();

		// 2. Import a file and verify tasks load
		await importMarkdown(page, TWO_TASK_MD);

		// Verify canvas is rendering
		await expect(page.locator('canvas')).toBeVisible();

		// 3. Export and verify download is triggered with correct content
		const exported = await exportMarkdown(page);

		expect(exported).toContain('Buy groceries');
		expect(exported).toContain('tst00001');
		expect(exported).toContain('Write report');
		expect(exported).toContain('tst00002');
		expect(exported).toContain('status: open');
	});
});
