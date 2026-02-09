import { test, expect } from '@playwright/test';

const displayStory = (variant: string) =>
  `/iframe.html?id=resource-drawer-folder-insights-display--${variant}&viewMode=story`;

const containerStory = (variant: string) =>
  `/iframe.html?id=resource-drawer-folder-insights--${variant}&viewMode=story`;

test.describe('Folder Insights Display', () => {
  test.describe('Default story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(displayStory('default'));
      await page.waitForSelector('ccms-folder-insights-display');
    });

    test('renders Total Files with compact value', async ({ page }) => {
      const card = page.locator('ccms-stat-card').filter({ hasText: 'Total Files' });
      await expect(card.locator('.value')).toContainText('3.4K');
    });

    test('renders Total Words with compact value', async ({ page }) => {
      const card = page.locator('ccms-stat-card').filter({ hasText: 'Total Words' });
      await expect(card.locator('.value')).toContainText('482.3K');
    });

    test('renders content type breakdown sorted by count descending', async ({ page }) => {
      const items = page.locator('.breakdown-item');
      await expect(items).toHaveCount(6);

      const labels = items.locator('.breakdown-label');
      await expect(labels.nth(0)).toHaveText('Topic');
      await expect(labels.nth(1)).toHaveText('Map');
      await expect(labels.nth(2)).toHaveText('Image');
      await expect(labels.nth(3)).toHaveText('Resource');
      await expect(labels.nth(4)).toHaveText('Folders');
      await expect(labels.nth(5)).toHaveText('Glossary');
    });

    test('renders raw counts in breakdown values', async ({ page }) => {
      const values = page.locator('.breakdown-value');
      await expect(values.nth(0)).toHaveText('1842');
      await expect(values.nth(1)).toHaveText('623');
    });
  });

  test.describe('SmallFolder story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(displayStory('small-folder'));
      await page.waitForSelector('ccms-folder-insights-display');
    });

    test('does not compact values below threshold', async ({ page }) => {
      const files = page.locator('ccms-stat-card').filter({ hasText: 'Total Files' });
      await expect(files.locator('.value')).toContainText('12');

      const words = page.locator('ccms-stat-card').filter({ hasText: 'Total Words' });
      await expect(words.locator('.value')).toContainText('840');
    });

    test('shows Folders with count 0 when no TOTAL_FOLDERS', async ({ page }) => {
      const items = page.locator('.breakdown-item');
      await expect(items).toHaveCount(1);
      await expect(items.locator('.breakdown-label')).toHaveText('Folders');
      await expect(items.locator('.breakdown-value')).toHaveText('0');
    });
  });

  test.describe('LargeFolder story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(displayStory('large-folder'));
      await page.waitForSelector('ccms-folder-insights-display');
    });

    test('compacts large numbers (thousands and millions)', async ({ page }) => {
      const files = page.locator('ccms-stat-card').filter({ hasText: 'Total Files' });
      await expect(files.locator('.value')).toContainText('14.8K');

      const words = page.locator('ccms-stat-card').filter({ hasText: 'Total Words' });
      await expect(words.locator('.value')).toContainText('2.5M');
    });

    test('renders all 6 breakdown items sorted descending', async ({ page }) => {
      const items = page.locator('.breakdown-item');
      await expect(items).toHaveCount(6);
      await expect(items.nth(0).locator('.breakdown-label')).toHaveText('Topic');
      await expect(items.nth(5).locator('.breakdown-label')).toHaveText('Glossary');
    });
  });

  test.describe('CalloutsOnly story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(displayStory('callouts-only'));
      await page.waitForSelector('ccms-folder-insights-display');
    });

    test('renders mixed compact and standard values', async ({ page }) => {
      const files = page.locator('ccms-stat-card').filter({ hasText: 'Total Files' });
      await expect(files.locator('.value')).toContainText('500');

      const words = page.locator('ccms-stat-card').filter({ hasText: 'Total Words' });
      await expect(words.locator('.value')).toContainText('25K');
    });

    test('shows only Folders in breakdown', async ({ page }) => {
      const items = page.locator('.breakdown-item');
      await expect(items).toHaveCount(1);
      await expect(items.locator('.breakdown-label')).toHaveText('Folders');
      await expect(items.locator('.breakdown-value')).toHaveText('10');
    });
  });

  test.describe('Empty story', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(displayStory('empty'));
      await page.waitForSelector('ccms-folder-insights-display');
    });

    test('shows no data available for empty callouts', async ({ page }) => {
      await expect(page.locator('.no-data-text')).toHaveText('No data available');
    });

    test('still renders Folders row with count 0', async ({ page }) => {
      const items = page.locator('.breakdown-item');
      await expect(items).toHaveCount(1);
      await expect(items.locator('.breakdown-value')).toHaveText('0');
    });
  });
});

test.describe('Folder Insights Loading', () => {
  test('renders skeleton loading state', async ({ page }) => {
    await page.goto(containerStory('loading'));

    const cards = page.locator('.skeleton--card');
    await expect(cards).toHaveCount(2);

    const texts = page.locator('.skeleton--text');
    await expect(texts).toHaveCount(4);

    const badges = page.locator('.skeleton--badge');
    await expect(badges).toHaveCount(4);
  });
});
