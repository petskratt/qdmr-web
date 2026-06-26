import { expect, test } from '@playwright/test';

test('create a codeplug, add a channel, export YAML', async ({ page }) => {
	await page.goto('/');

	// Empty state -> create a new codeplug.
	await page.getByRole('button', { name: 'New codeplug' }).click();

	// A dataset tab appears and the Channels section is shown by default.
	await expect(page.getByRole('tab', { name: /Untitled codeplug/ })).toBeVisible();
	await expect(page.getByRole('heading', { name: /Channels/ })).toBeVisible();

	// Add a channel; the schema-driven editor opens.
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();

	// Name is the first text field on the Basic tab.
	await dialog.getByRole('textbox').first().fill('Test Channel');
	await dialog.getByRole('button', { name: 'Save' }).click();
	await expect(dialog).toBeHidden();

	// The new row shows the name (the internal id column is hidden by design).
	await expect(page.getByRole('cell', { name: 'Test Channel', exact: true })).toBeVisible();

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

test('bulk-tags selected channels', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: 'Import qDMR YAML' }).click();
	await page.locator('input[type=file]').setInputFiles('sampledata/example.qdmr.yaml');
	await expect(page.getByRole('heading', { name: /Channels \(2\)/ })).toBeVisible();

	// Select all rows -> bulk bar appears.
	await page.getByRole('checkbox', { name: 'Select all' }).check();
	await expect(page.getByText(/2 selected/)).toBeVisible();

	// Apply a tag to the selection.
	await page.getByPlaceholder('tag').fill('fav');
	await page.getByRole('button', { name: 'Add tag' }).click();

	// The analog channel (no prior tags) now shows the tag in its tags column.
	await expect(page.getByRole('cell', { name: 'fav', exact: true })).toBeVisible();
});
