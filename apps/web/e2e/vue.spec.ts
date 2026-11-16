import { test, expect } from '@playwright/test'

// See here how to get started:
// https://playwright.dev/docs/intro
test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  // TODO #2: a Tarefa 3 põe a grade em `/`; por ora, só confere que o app montou.
  await expect(page.locator('#app main')).toBeAttached()
})
