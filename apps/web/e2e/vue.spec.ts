import { test, expect } from '@playwright/test'

// O título da grade não depende da API: a página monta em `/` mesmo sem servidor (CI).
test('a página da grade monta em /', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Escolha seus horários' })).toBeVisible()
})
