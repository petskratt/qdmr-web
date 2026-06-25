import { expect, test } from '@playwright/test';

test('create a codeplug, add a channel, export YAML', async ({ page }) => {
	await page.goto('/');

	// Empty state -> create a new codeplug.
	await page.getByRole('button', { name: 'New codeplug' }).click();

	// A dataset tab appears and the Channels section is shown by default.
	await expect(page.getByRole('tab', { name: /Untitled codeplug/ })).toBeVisible();
	await expect(page.getByRole('heading', { name: /Channels/ })).toBeVisible();

	// Add a channel; the editor modal opens with a generated id (ch1).
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();

	// Save and close (the new element already has id ch1).
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog).toBeHidden();

	// The new row is in the table.
	await expect(page.getByRole('cell', { name: 'ch1', exact: true })).toBeVisible();

	// Export menu offers the dmrconf-clean option.
	await page.getByRole('button', { name: 'Export' }).click();
	await expect(page.getByText('qDMR YAML (dmrconf-clean)')).toBeVisible();
});

test('imports the example qDMR YAML fixture', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Import qDMR YAML' }).click();
	await page.locator('input[type=file]').setInputFiles('sampledata/example.qdmr.yaml');

	await expect(page.getByRole('tab', { name: /example\.qdmr/ })).toBeVisible();
	// 2 channels in the fixture.
	await expect(page.getByRole('heading', { name: /Channels \(2\)/ })).toBeVisible();
	await expect(page.getByRole('cell', { name: 'BB DB0LDS TS2', exact: true })).toBeVisible();
});
