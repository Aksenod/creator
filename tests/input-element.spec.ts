import { test, expect, Page } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.removeItem('creator-project')
  })
  await page.reload()
})

async function addElement(page: Page, type: string) {
  await page.hover('[data-testid="add-element-trigger"]')
  await page.click(`[data-testid="add-${type}"]`)
}

async function enterPageEditor(page: Page) {
  const newProjectBtn = page.locator('button:has-text("New project")').first()
  await newProjectBtn.click()
  // После создания CanvasEditor — ждём появления кнопки Artboard
  await expect(page.locator('button:has-text("Artboard")')).toBeVisible()
}

async function getStoredProject(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    return p.state?.project ?? null
  })
}

async function getStoredArtboard(page: Page) {
  const project = await getStoredProject(page)
  if (!project) return null
  return Object.values(project.artboards)[0] as typeof project.artboards[string]
}

/** Получить первый элемент-потомок Body */
async function getFirstChildElement(page: Page) {
  return page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elemId = body?.children?.[0]
    return artboard?.elements?.[elemId] ?? null
  })
}

// ─── Тест 1: Добавление input через Toolbar ─────────────────────────────────

test('добавление input через Toolbar', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'input')

  // В Layers должен появиться элемент "input 1"
  await expect(page.locator('text=input 1')).toBeVisible()

  // Проверяем что элемент в store имеет тип input
  const el = await getFirstChildElement(page)
  expect(el).not.toBeNull()
  expect(el.type).toBe('input')
  expect(el.inputType).toBe('text')
})

// ─── Тест 2: Рендеринг input на Canvas ──────────────────────────────────────

test('рендеринг input на canvas с placeholder', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'input')
  await expect(page.locator('text=input 1')).toBeVisible()

  // Input должен отображаться на canvas с placeholder
  const artboardFrame = page.locator('[data-testid="artboard-frame"]')
  const inputOnCanvas = artboardFrame.locator('input[placeholder]')
  await expect(inputOnCanvas).toBeVisible()

  // Проверяем дефолтный placeholder
  await expect(inputOnCanvas).toHaveAttribute('placeholder', 'Введите текст...')
})

// ─── Тест 3: Редактирование placeholder ─────────────────────────────────────

test('редактирование placeholder через Properties', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'input')
  await page.click('text=input 1')

  // Должна быть видна секция Layer с полем Контент
  await expect(page.locator('span').filter({ hasText: /^Контент$/ })).toBeVisible()

  // Изменить placeholder через textarea
  const contentTextarea = page.locator('textarea').filter({ hasText: 'Введите текст...' })
  await contentTextarea.fill('Email адрес')

  // Проверяем в store
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return false
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return false
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elemId = body?.children?.[0]
    return artboard?.elements?.[elemId]?.content === 'Email адрес'
  })

  const el = await getFirstChildElement(page)
  expect(el.content).toBe('Email адрес')
})

// ─── Тест 4: Properties panel отображает секции для input ────────────────────

test('properties panel: отображение секций для input', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'input')
  await page.click('text=input 1')

  // Должны быть видны секции: Layer (с Name, Контент, Тип), Spacing, Size
  await expect(page.locator('span').filter({ hasText: /^Layer$/ })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: /^Name$/ })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: /^Контент$/ })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: /^Тип$/ })).toBeVisible()

  // Тип dropdown должен показывать "text" по умолчанию
  const typeRow = page.locator('div').filter({ has: page.locator('span').filter({ hasText: /^Тип$/ }) }).last()
  const typeDropdown = typeRow.locator('button').first()
  await expect(typeDropdown).toContainText('text')
})

// ─── Тест 5: Изменение inputType через dropdown ─────────────────────────────

test('изменение inputType через dropdown', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'input')
  await page.click('text=input 1')

  // Кликнуть dropdown Тип
  const typeRow = page.locator('div').filter({ has: page.locator('span').filter({ hasText: /^Тип$/ }) }).last()
  const typeButton = typeRow.locator('button').first()
  await typeButton.click()

  // Выбрать "email"
  await page.click('button:has-text("email")')

  // Проверяем в store
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return false
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return false
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elemId = body?.children?.[0]
    return artboard?.elements?.[elemId]?.inputType === 'email'
  })

  const el = await getFirstChildElement(page)
  expect(el.inputType).toBe('email')
})

// ─── Тест 6: Copy-paste input ───────────────────────────────────────────────

test('несколько input элементов на canvas', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить два input элемента
  await addElement(page, 'input')
  await expect(page.locator('text=input 1')).toBeVisible()

  await addElement(page, 'input')
  await expect(page.locator('text=input 2')).toBeVisible()

  // В store два input элемента
  const artboard = await getStoredArtboard(page)
  const inputElements = Object.values(artboard!.elements).filter((el: any) => el.type === 'input')
  expect(inputElements.length).toBe(2)

  // Оба с дефолтным inputType
  expect((inputElements[0] as any).inputType).toBe('text')
  expect((inputElements[1] as any).inputType).toBe('text')
})

// ─── Тест 7: Удаление input ─────────────────────────────────────────────────

test('удаление input элемента', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'input')
  await expect(page.locator('text=input 1')).toBeVisible()

  // Выделить и удалить
  await page.click('text=input 1')
  await page.keyboard.press('Delete')

  // Элемент должен исчезнуть
  await expect(page.locator('text=input 1')).toHaveCount(0)
  await expect(page.locator('text=Body').first()).toBeVisible()
})

// ─── Тест 8: Padding и margin влияют на input ────────────────────────────────

test('padding и margin применяются к input', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'input')
  await page.click('text=input 1')

  // Секция Spacing должна быть видна
  await expect(page.getByText('Spacing', { exact: true }).first()).toBeVisible()

  const triggers = page.locator('[data-spacing-trigger]')
  await expect(triggers).toHaveCount(8)

  async function setVal(idx: number, val: number) {
    await triggers.nth(idx).click()
    const inp = page.locator('[data-spacing-popover] input')
    await expect(inp).toBeVisible()
    await inp.fill(String(val))
    await page.keyboard.press('Enter')
    await page.waitForTimeout(50)
  }

  // Устанавливаем margin
  await setVal(0, 10) // marginTop
  await setVal(2, 15) // marginBottom

  // Устанавливаем padding
  await setVal(4, 12) // paddingTop
  await setVal(6, 8)  // paddingBottom

  // Проверяем значения в триггерах
  await expect(triggers.nth(0)).toHaveText('10px')
  await expect(triggers.nth(2)).toHaveText('15px')
  await expect(triggers.nth(4)).toHaveText('12px')
  await expect(triggers.nth(6)).toHaveText('8px')

  // Проверяем в localStorage
  await page.waitForFunction(() => {
    try {
      const raw = localStorage.getItem('creator-project')
      if (!raw) return false
      const p = JSON.parse(raw)
      const project = p.state?.project
      if (!project) return false
      const artboard = Object.values(project.artboards)[0] as any
      const bodyId = artboard?.rootChildren?.[0]
      const body = artboard?.elements?.[bodyId]
      const elemId = body?.children?.[0]
      const s = artboard?.elements?.[elemId]?.styles
      return s?.marginTop === 10 && s?.marginBottom === 15 && s?.paddingTop === 12 && s?.paddingBottom === 8
    } catch { return false }
  })

  const el = await getFirstChildElement(page)
  expect(el.styles.marginTop).toBe(10)
  expect(el.styles.marginBottom).toBe(15)
  expect(el.styles.paddingTop).toBe(12)
  expect(el.styles.paddingBottom).toBe(8)
})

// ─── Тест 9: HTML экспорт input с inputType ─────────────────────────────────

test('HTML экспорт input с inputType', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'input')
  await page.click('text=input 1')

  // Изменяем тип на email
  const typeRow = page.locator('div').filter({ has: page.locator('span').filter({ hasText: /^Тип$/ }) }).last()
  const typeButton = typeRow.locator('button').first()
  await typeButton.click()
  await page.click('button:has-text("email")')

  // Ждём обновления store
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return false
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return false
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elemId = body?.children?.[0]
    return artboard?.elements?.[elemId]?.inputType === 'email'
  })

  // Вызываем exportArtboardHTML через evaluate
  const html = await page.evaluate(async () => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return ''
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return ''
    const artboard = Object.values(project.artboards)[0] as any
    if (!artboard) return ''

    // Импортируем exportArtboardHTML
    const mod = await import('/src/utils/exportHTML.ts')
    return mod.exportArtboardHTML(artboard)
  })

  // Проверяем что HTML содержит type="email" и placeholder
  expect(html).toContain('type="email"')
  expect(html).toContain('placeholder="Введите текст..."')
  expect(html).toContain('<input')
})
