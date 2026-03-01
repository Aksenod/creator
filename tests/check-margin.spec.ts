import { test, expect, Page } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.removeItem('creator-project')
    localStorage.removeItem('creator-project')
  })
  await page.reload()
})

async function enterPageEditor(page: Page) {
  await page.click('button:has-text("Новый проект")')
  await expect(page.locator('button:has-text("+ Артборд")')).toBeVisible()
  await expect(page.locator('button:has-text("← Проекты")')).toBeVisible()
}

async function addElement(page: Page, type: string) {
  await page.hover('[data-testid="add-element-trigger"]')
  await page.click(`[data-testid="add-${type}"]`)
}

/** Хелпер: кликнуть на триггер spacing, ввести значение в попапе и применить */
async function setSpacingValue(page: Page, triggerIndex: number, value: number) {
  const triggers = page.locator('[data-spacing-trigger]')
  await triggers.nth(triggerIndex).click()
  // Дождаться попапа
  const popoverInput = page.locator('[data-spacing-popover] input')
  await expect(popoverInput).toBeVisible()
  await popoverInput.fill(String(value))
  await page.keyboard.press('Enter')
  await page.waitForTimeout(50)
}

test('margin-top moves element visually away from sibling', async ({ page }) => {
  await enterPageEditor(page)

  // Add two divs
  await addElement(page, 'div')
  await page.waitForTimeout(100)
  await addElement(page, 'div')
  await page.waitForTimeout(200)

  // Select second div (div 2): elements(0)=body, elements(1)=div1, elements(2)=div2
  const elements = page.locator('[data-element-id]')
  const secondEl = elements.nth(2)
  await secondEl.click()
  await page.waitForTimeout(200)

  // Get initial position of second element
  const initialBox = await secondEl.boundingBox()
  console.log('Initial box:', JSON.stringify(initialBox))

  // Set marginTop = 80 on second div (trigger index 0 = marginTop)
  await setSpacingValue(page, 0, 80)
  await page.waitForTimeout(300)

  // Get position after margin applied
  const afterBox = await secondEl.boundingBox()
  console.log('After margin box:', JSON.stringify(afterBox))

  // Element should have moved down (canvas transform scale, 80px margin → visible shift)
  expect(afterBox!.y).toBeGreaterThanOrEqual(initialBox!.y + 30)
})
