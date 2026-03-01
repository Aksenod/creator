import { test, expect, Page } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Сброс localStorage и перезагрузка страницы */
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.removeItem('creator-project')
    localStorage.removeItem('creator-project')
  })
  await page.reload()
})

/** Открыть дропдаун и добавить элемент нужного типа */
async function addElement(page: Page, type: string) {
  await page.hover('[data-testid="add-element-trigger"]')
  await page.click(`[data-testid="add-${type}"]`)
}

/** Создать проект и дождаться открытия CanvasEditor */
async function createProject(page: Page) {
  await page.click('button:has-text("Новый проект")')
  // После создания проекта сразу открывается CanvasEditor
  await expect(page.locator('button:has-text("+ Артборд")')).toBeVisible()
}

/** Войти в Canvas Editor (теперь это просто createProject) */
async function enterPageEditor(page: Page) {
  await createProject(page)
  // Уже в CanvasEditor после создания проекта
  await expect(page.locator('button:has-text("← Проекты")')).toBeVisible()
}

// ─── Вспомогательная функция для чтения проекта из localStorage ──────────────

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

async function getStoredStyles(page: Page) {
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
    return artboard?.elements?.[elemId]?.styles ?? null
  })
}

// ─── Тест 1: Создание проекта ─────────────────────────────────────────────────

test('создание проекта', async ({ page }) => {
  // Должен быть ProjectsDashboard с текстом Creator
  await expect(page.locator('text=Creator').first()).toBeVisible()

  // Кнопка "Новый проект" (+ Новый проект в header)
  const btn = page.locator('button:has-text("Новый проект")').first()
  await expect(btn).toBeVisible()

  // Кликнуть → открывается CanvasEditor с кнопкой "+ Артборд"
  await btn.click()
  await expect(page.locator('button:has-text("+ Артборд")')).toBeVisible()

  // Должен быть виден артборд-карточка на холсте
  const artboard = page.locator('[data-testid="artboard-frame"]').first()
  await expect(artboard).toBeVisible()

  // Должно быть имя проекта в топбаре
  await expect(page.locator('span').filter({ hasText: 'Новый проект' }).first()).toBeVisible()
})

// ─── Тест 2: Вход в Canvas Editor ──────────────────────────────────────────

test('вход в артборд', async ({ page }) => {
  await createProject(page)

  // Кнопка "← Проекты"
  await expect(page.locator('button:has-text("← Проекты")')).toBeVisible()

  // Панель "Слои" — заголовок секции (div с точным текстом "Слои")
  await expect(page.getByText('Слои', { exact: true })).toBeVisible()

  // Панель "Свойства" — заголовок секции (div с точным текстом "Свойства")
  await expect(page.getByText('Свойства', { exact: true })).toBeVisible()
})

// ─── Тест 3: Добавление элементов через Toolbar ───────────────────────────────

test('добавление элементов через Toolbar', async ({ page }) => {
  await enterPageEditor(page)

  // Начальное состояние — Body слой виден в Layers
  await expect(page.locator('text=Body').first()).toBeVisible()

  // Кликнуть "+ Div"
  await addElement(page, 'div')

  // В Layers должен появиться элемент "div 1"
  await expect(page.locator('text=div 1')).toBeVisible()

  // Кликнуть "+ Text"
  await addElement(page, 'text')

  // В Layers должен появиться элемент "text 2"
  await expect(page.locator('text=text 2')).toBeVisible()
})

// ─── Тест 4: Выделение элемента и редактирование в Properties ─────────────────

test('выделение элемента и редактирование в Properties', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить Div
  await addElement(page, 'div')
  await expect(page.locator('text=div 1')).toBeVisible()

  // Кликнуть по элементу в Layers
  await page.click('text=div 1')

  // В панели Properties должны появиться поля редактирования
  // Проверяем секцию "Слой" с полем "Имя"
  await expect(page.locator('span').filter({ hasText: /^Слой$/ })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: /^Имя$/ })).toBeVisible()

  // Секция Позиция должна быть видна
  await expect(page.locator('span').filter({ hasText: /^Позиция$/ })).toBeVisible()

  // Изменить имя элемента
  const nameInput = page.locator('input').first()
  await nameInput.fill('мой-дивчик')

  // Проверить что имя обновилось в Layers
  await expect(page.locator('text=мой-дивчик')).toBeVisible()
})

// ─── Тест 5: Preview mode ────────────────────────────────────────────────────

test('переключение в Preview mode', async ({ page }) => {
  await enterPageEditor(page)

  // Нажать "▶ Preview"
  await page.click('button:has-text("▶ Preview")')

  // Панели Layers и Properties должны скрыться
  // Заголовок "Слои" должен исчезнуть
  await expect(page.getByText('Слои', { exact: true })).toHaveCount(0)

  // Должна появиться кнопка "← Редактор"
  await expect(page.locator('button:has-text("← Редактор")')).toBeVisible()

  // Нажать "← Редактор"
  await page.click('button:has-text("← Редактор")')

  // Кнопка "▶ Preview" снова видна
  await expect(page.locator('button:has-text("▶ Preview")')).toBeVisible()

  // Панели вернулись
  await expect(page.locator('button:has-text("← Проекты")')).toBeVisible()
})

// ─── Тест 6: Удаление элемента ───────────────────────────────────────────────

test('удаление элемента', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить элемент
  await addElement(page, 'div')
  await expect(page.locator('text=div 1')).toBeVisible()

  // Выделить его в Layers
  await page.click('text=div 1')

  // Удалить через клавишу Delete
  await page.keyboard.press('Delete')

  // Элемент должен исчезнуть из Layers
  await expect(page.locator('text=div 1')).toHaveCount(0)

  // Body всё ещё виден в Layers
  await expect(page.locator('text=Body').first()).toBeVisible()
})

// ─── Тест 7: Breakpoint bar ──────────────────────────────────────────────────

test('переключение брейкпоинтов', async ({ page }) => {
  await enterPageEditor(page)

  // Найти кнопку Mobile (title содержит "Mobile")
  const mobileBtn = page.locator('button[title*="Mobile"]').or(
    page.locator('button[title*="375"]')
  )
  await expect(mobileBtn).toBeVisible()

  // Кликнуть на Mobile
  await mobileBtn.click()

  // В топбаре должна появиться надпись "375px" (внутри button Canvas Settings)
  await expect(page.locator('button:has-text("375px")')).toBeVisible()

  // Кликнуть Desktop — вернуться к 1440px
  const desktopBtn = page.locator('button[title^="Desktop"]')
  await desktopBtn.click()
  await expect(page.locator('button:has-text("1440px")')).toBeVisible()
})

// ─── Тест 9: Добавление маржинов через Spacing panel ─────────────────────────

test('добавление маржинов через Spacing panel', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить Div и выделить его
  await addElement(page, 'div')
  await page.click('text=div 1')

  // Секция Spacing должна быть видна
  await expect(page.getByText('Spacing', { exact: true })).toBeVisible()

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

  await setVal(0, 20) // marginTop
  await setVal(1, 10) // marginRight
  await setVal(2, 30) // marginBottom
  await setVal(3, 40) // marginLeft

  // Проверить отображаемые значения в триггерах
  await expect(triggers.nth(0)).toHaveText('20')
  await expect(triggers.nth(1)).toHaveText('10')
  await expect(triggers.nth(2)).toHaveText('30')
  await expect(triggers.nth(3)).toHaveText('40')

  // Проверить что значения сохранились в localStorage
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
      return s?.marginTop === 20 && s?.marginLeft === 40
    } catch { return false }
  })

  const stored = await getStoredStyles(page)
  expect(stored?.marginTop).toBe(20)
  expect(stored?.marginRight).toBe(10)
  expect(stored?.marginBottom).toBe(30)
  expect(stored?.marginLeft).toBe(40)
})

// ─── Тест 10: Черный бордер 10px у div ──────────────────────────────────────

test('установка черного бордера 10px у div', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить Div и выделить его
  await addElement(page, 'div')
  await expect(page.locator('text=div 1')).toBeVisible()
  await page.click('text=div 1')

  // Секция Borders должна быть видна
  await expect(page.locator('span').filter({ hasText: 'Borders' })).toBeVisible()

  // Кликнуть кнопку "—" (solid style) в строке Style
  const styleRow = page.locator('div').filter({ has: page.locator('span').filter({ hasText: /^Style$/ }) })
  const solidBtn = styleRow.locator('button').filter({ hasText: '—' })
  await solidBtn.click()

  // Установить Width = 10
  const widthRow = page.locator('div').filter({ has: page.locator('span').filter({ hasText: /^Width$/ }) }).last()
  const widthInput = widthRow.locator('input[type="number"]')
  await widthInput.fill('10')
  await page.keyboard.press('Tab')

  // Ввести Color = #000000
  const colorRow = page.locator('div').filter({ has: page.locator('span').filter({ hasText: /^Color$/ }) }).last()
  const colorHexInput = colorRow.locator('input[placeholder="—"]')
  await colorHexInput.fill('#000000')
  await page.keyboard.press('Tab')

  // Проверить значения инпутов
  await expect(widthInput).toHaveValue('10')
  await expect(colorHexInput).toHaveValue('#000000')

  // Ждём пока Zustand запишет borderStyle и borderWidth в localStorage
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
      return s?.borderStyle === 'solid' && s?.borderWidth === 10
    } catch { return false }
  })

  const stored = await getStoredStyles(page)
  expect(stored?.borderStyle).toBe('solid')
  expect(stored?.borderWidth).toBe(10)
  await expect(colorHexInput).toHaveValue('#000000')
})

// ─── Тест 8: Layout display modes ───────────────────────────────────────────

test('переключение display mode в Layout', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить Div
  await addElement(page, 'div')
  await page.click('text=div 1')

  // Найти секцию Layout
  await expect(page.locator('span').filter({ hasText: 'Layout' })).toBeVisible()

  // Нажать "Flex" в SegmentedControl Display
  const flexBtn = page.locator('button').filter({ hasText: /^Flex$/ })
  await flexBtn.click()

  // Должны появиться Direction / Align / Gap поля
  await expect(page.locator('span').filter({ hasText: 'Direction' })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: 'Align' }).first()).toBeVisible()
  await expect(page.locator('span').filter({ hasText: 'Gap' })).toBeVisible()

  // Нажать "Grid"
  const gridBtn = page.locator('button').filter({ hasText: /^Grid$/ })
  await gridBtn.click()

  // Должны появиться Columns / Rows поля
  await expect(page.locator('span').filter({ hasText: 'Columns' })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: 'Rows' })).toBeVisible()
})

// ─── Helpers для Grid тестов ──────────────────────────────────────────────────

/** Переключить элемент на display: grid */
async function switchToGrid(page: Page) {
  const gridBtn = page.locator('button').filter({ hasText: /^Grid$/ })
  await gridBtn.click()
  await expect(page.locator('span').filter({ hasText: 'Columns' })).toBeVisible()
}

// ─── Тест 12: Grid TrackList — добавить/удалить колонку ──────────────────────

test('Grid TrackList: добавить и удалить колонку', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'div')
  await page.click('text=div 1')
  await switchToGrid(page)

  const removeBtns = page.locator('[data-testid="track-remove"]')
  const countBefore = await removeBtns.count()

  const addBtns = page.locator('button').filter({ hasText: '+ Add' })
  await expect(addBtns.first()).toBeVisible()
  await addBtns.first().click()

  await expect(removeBtns).toHaveCount(countBefore + 1)

  await removeBtns.last().click()
  await expect(removeBtns).toHaveCount(countBefore)
})

// ─── Тест 13: Grid Gap lock/unlock ───────────────────────────────────────────

test('Grid Gap: lock/unlock раздельные gap значения', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'div')
  await page.click('text=div 1')
  await switchToGrid(page)

  const lockBtn = page.locator('button[title*="колонками"]')
  await expect(lockBtn).toBeVisible()

  await expect(page.locator('span').filter({ hasText: /^Col$/ })).toHaveCount(0)

  await lockBtn.click()

  await expect(page.locator('span').filter({ hasText: /^Col$/ })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: /^Row$/ })).toBeVisible()

  await lockBtn.click()
  await expect(page.locator('span').filter({ hasText: /^Col$/ })).toHaveCount(0)
})

// ─── Тест 14: Grid Auto-flow direction ───────────────────────────────────────

test('Grid Auto-flow: переключение направления', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'div')
  await page.click('text=div 1')
  await switchToGrid(page)

  const rowBtn = page.locator('button').filter({ hasText: '→ Row' })
  const colBtn = page.locator('button').filter({ hasText: '↓ Column' })
  await expect(rowBtn).toBeVisible()
  await expect(colBtn).toBeVisible()

  await colBtn.click()

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elemId = body?.children?.[0]
    return artboard?.elements?.[elemId]?.styles?.gridAutoFlow ?? null
  })
  expect(stored).toBe('column')

  await rowBtn.click()

  const stored2 = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elemId = body?.children?.[0]
    return artboard?.elements?.[elemId]?.styles?.gridAutoFlow ?? null
  })
  expect(stored2).toBe('row')
})

// ─── Тест 15: Grid Child Section — появляется для дочернего элемента ─────────

test('Grid Child Section: появляется для дочернего элемента grid', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'div')
  await page.click('text=div 1')
  await switchToGrid(page)

  await addElement(page, 'div')

  await page.click('text=div 2')

  await expect(page.locator('span').filter({ hasText: 'Grid child' })).toBeVisible()

  await page.click('button:has-text("Manual")')

  await expect(page.locator('span').filter({ hasText: /^Column$/ })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: /^Row$/ })).toBeVisible()
})

// ─── Тест 16: Grid Edit Mode — открыть и закрыть ─────────────────────────────

test('Grid Edit Mode: открыть и закрыть overlay', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'div')
  await page.click('text=div 1')
  await switchToGrid(page)

  const editBtn = page.locator('button').filter({ hasText: /Edit Grid/ })
  await expect(editBtn).toBeVisible()

  await editBtn.click()

  const doneBtn = page.locator('button').filter({ hasText: 'Done' })
  await expect(doneBtn).toBeVisible()

  await expect(page.locator('button').filter({ hasText: /Exit Edit Mode/ })).toBeVisible()

  await doneBtn.click()
  await expect(doneBtn).toHaveCount(0)

  await expect(page.locator('button').filter({ hasText: /Edit Grid/ })).toBeVisible()
})

// ─── Тест 17: Grid Child — column span через Properties ──────────────────────

test('Grid Child: установить column span 2', async ({ page }) => {
  await enterPageEditor(page)

  await addElement(page, 'div')
  await page.click('text=div 1')
  await switchToGrid(page)

  const addColBtn = page.locator('button').filter({ hasText: '+ Add' }).first()
  await addColBtn.click()
  await addColBtn.click()
  await addColBtn.click()

  await addElement(page, 'div')
  await page.click('text=div 2')

  await expect(page.locator('span').filter({ hasText: 'Grid child' })).toBeVisible()

  await page.click('button:has-text("Manual")')

  const spanSelect = page.locator('[data-testid="grid-line-span-column"]')
  await expect(spanSelect).toBeVisible()

  const colInputs = spanSelect.locator('..').locator('input[type="number"]')
  const startInput = colInputs.first()
  const endInput = colInputs.last()

  await startInput.fill('1')
  await spanSelect.selectOption('span')
  await endInput.fill('2')
  await page.keyboard.press('Tab')

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const parentId = body?.children?.[0]
    const parent = artboard?.elements?.[parentId]
    const childId = parent?.children?.[0]
    return artboard?.elements?.[childId]?.styles?.gridColumn ?? null
  })

  expect(stored).toBe('1 / span 2')
})

// ─── Тест 18: Size section — ввод Width/Height/Min/Max ────────────────────────

test('Size section: ввод width и height меняет стили элемента', async ({ page }) => {
  await enterPageEditor(page)
  await addElement(page, 'div')
  await page.click('text=div 1')

  await page.locator('[data-testid="size-width"]').fill('300')
  await page.keyboard.press('Tab')

  let stored = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elId = body?.children?.[0]
    return artboard?.elements?.[elId]?.styles?.width ?? null
  })
  expect(stored).toBe('300%')

  await page.locator('[data-testid="size-width"]').fill('')
  await page.keyboard.press('Tab')
  await page.locator('[data-testid="size-width"]').fill('200')
  await page.keyboard.press('Tab')

  stored = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elId = body?.children?.[0]
    return artboard?.elements?.[elId]?.styles?.width ?? null
  })
  expect(stored).toBe('200px')

  await page.locator('[data-testid="size-height"]').fill('150')
  await page.keyboard.press('Tab')

  stored = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elId = body?.children?.[0]
    return artboard?.elements?.[elId]?.styles?.height ?? null
  })
  expect(stored).toBe('150px')
})

test('Size section: ввод minWidth и maxWidth', async ({ page }) => {
  await enterPageEditor(page)
  await addElement(page, 'div')
  await page.click('text=div 1')

  const minWInput = page.locator('input[placeholder="Min W"]')
  await minWInput.fill('100')
  await page.keyboard.press('Tab')

  const maxWInput = page.locator('input[placeholder="Max W"]')
  await maxWInput.fill('500')
  await page.keyboard.press('Tab')

  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const project = p.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elId = body?.children?.[0]
    const el = artboard?.elements?.[elId]
    return { minWidth: el?.styles?.minWidth, maxWidth: el?.styles?.maxWidth }
  })
  expect(stored?.minWidth).toBe('100px')
  expect(stored?.maxWidth).toBe('500px')
})

// ─── Тест 19: Навигация по слоям (Enter/Tab/Shift) ───────────────────────────

test('навигация по слоям: Enter/Tab/Shift+Tab/Shift+Enter', async ({ page }) => {
  await enterPageEditor(page)

  // Создаём дерево: Body > div1 > (div2, div3)
  await addElement(page, 'div') // div1 — ребёнок Body
  await page.click('text=div 1')
  await addElement(page, 'div') // div2 — ребёнок div1
  await page.click('text=div 1') // повторно выбираем div1
  await addElement(page, 'div') // div3 — ребёнок div1

  // Убеждаемся что все три div видны в слоях
  await expect(page.locator('text=div 1')).toBeVisible()
  await expect(page.locator('text=div 2')).toBeVisible()
  await expect(page.locator('text=div 3')).toBeVisible()

  // Выделяем div 1
  await page.click('text=div 1')

  // Enter → провалиться: выделяются дети (div2, div3)
  await page.keyboard.press('Enter')

  // После Enter выделены дети — selectedElementIds содержит обоих
  const afterEnter = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    return p.state?.selectedElementIds?.length ?? 0
  })
  expect(afterEnter).toBe(2)

  // Tab → первый ребёнок → перейти на следующий сиблинг (div3)
  await page.keyboard.press('Tab')

  // Теперь selectedElementIds.length === 1 (Tab работает только при single-select,
  // но после Enter было 2 — Tab сработает только при single.
  // Сначала нужен single-select: кликнем div2
  await page.click('text=div 2')

  // Tab → переход к div3
  await page.keyboard.press('Tab')
  const afterTab = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    return p.state?.selectedElementId ?? null
  })
  // Проверяем что выбран div 3 (последний ребёнок)
  const div3Name = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const selId = p.state?.selectedElementId
    const project = p.state?.project
    if (!project || !selId) return null
    const artboard = Object.values(project.artboards)[0] as any
    return artboard?.elements?.[selId]?.name ?? null
  })
  expect(div3Name).toBe('div 3')

  // Shift+Tab → назад к div2
  await page.keyboard.press('Shift+Tab')
  const afterShiftTab = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const selId = p.state?.selectedElementId
    const project = p.state?.project
    if (!project || !selId) return null
    const artboard = Object.values(project.artboards)[0] as any
    return artboard?.elements?.[selId]?.name ?? null
  })
  expect(afterShiftTab).toBe('div 2')

  // Shift+Enter → подняться к родителю (div1)
  await page.keyboard.press('Shift+Enter')
  const afterShiftEnter = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const selId = p.state?.selectedElementId
    const project = p.state?.project
    if (!project || !selId) return null
    const artboard = Object.values(project.artboards)[0] as any
    return artboard?.elements?.[selId]?.name ?? null
  })
  expect(afterShiftEnter).toBe('div 1')
})
