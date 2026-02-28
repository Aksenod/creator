import { test, expect, Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('creator-project'))
  await page.reload()
})

async function enterPageEditor(page: Page) {
  await page.click('button:has-text("Новый проект")')
  await expect(page.locator('button:has-text("+ Артборд")')).toBeVisible()
  await page.locator('[data-testid="artboard-card"]').first().dblclick()
  await expect(page.locator('button:has-text("← Назад")')).toBeVisible()
}

test('margin-top moves element visually away from sibling', async ({ page }) => {
  await enterPageEditor(page)

  // Add two divs
  await page.click('button:has-text("+ Div")')
  await page.waitForTimeout(100)
  await page.click('button:has-text("+ Div")')
  await page.waitForTimeout(200)

  // Select second div (div 2): elements(0)=body, elements(1)=div1, elements(2)=div2
  const elements = page.locator('[data-element-id]')
  const secondEl = elements.nth(2)
  await secondEl.click()
  await page.waitForTimeout(200)

  // Get initial position of second element
  const initialBox = await secondEl.boundingBox()
  console.log('Initial box:', JSON.stringify(initialBox))

  // Set marginTop = 80 on second div
  const spacingInputs = page.locator('input[placeholder="–"]')
  await spacingInputs.nth(0).fill('80')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(300)

  // Get position after margin applied
  const afterBox = await secondEl.boundingBox()
  console.log('After margin box:', JSON.stringify(afterBox))

  // Element should have moved down (canvas auto-fit scale ~0.625, so 80px margin → ~50px visual)
  expect(afterBox!.y).toBeGreaterThan(initialBox!.y + 40)
})
