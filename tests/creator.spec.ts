import { test, expect, Page } from '@playwright/test'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Сброс localStorage и перезагрузка страницы */
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.removeItem('creator-project'))
  await page.reload()
})

/** Создать проект и вернуть page */
async function createProject(page: Page) {
  await page.click('button:has-text("Новый проект")')
  // Ждём появления артборда в BirdsEye
  await expect(page.locator('button:has-text("+ Артборд")')).toBeVisible()
}

/** Войти в PageEditor (двойной клик по артборду) */
async function enterPageEditor(page: Page) {
  await createProject(page)
  // Двойной клик по артборду-карточке
  await page.locator('[data-testid="artboard-card"]').first().dblclick()
  // Ждём появления кнопки "← Назад"
  await expect(page.locator('button:has-text("← Назад")')).toBeVisible()
}

// ─── Тест 1: Создание проекта ─────────────────────────────────────────────────

test('создание проекта', async ({ page }) => {
  // Должна быть Welcome-страница с заголовком Creator
  await expect(page.locator('h1')).toContainText('Creator')

  // Кнопка "Новый проект"
  const btn = page.locator('button:has-text("Новый проект")')
  await expect(btn).toBeVisible()

  // Кликнуть → появится BirdsEye с кнопкой "+ Артборд"
  await btn.click()
  await expect(page.locator('button:has-text("+ Артборд")')).toBeVisible()

  // Должен быть виден артборд-карточка в BirdsEye
  const artboard = page.locator('[data-testid="artboard-card"]').first()
  await expect(artboard).toBeVisible()

  // Должно быть имя проекта в топбаре
  await expect(page.locator('span').filter({ hasText: 'Мой проект' })).toBeVisible()
})

// ─── Тест 2: Вход в артборд (Page mode) ──────────────────────────────────────

test('вход в артборд', async ({ page }) => {
  await createProject(page)

  // Двойной клик по артборду-карточке
  await page.locator('[data-testid="artboard-card"]').first().dblclick()

  // Кнопка "← Назад"
  await expect(page.locator('button:has-text("← Назад")')).toBeVisible()

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
  await page.click('button:has-text("+ Div")')

  // В Layers должен появиться элемент "div 1"
  await expect(page.locator('text=div 1')).toBeVisible()

  // Кликнуть "+ Text"
  await page.click('button:has-text("+ Text")')

  // В Layers должен появиться элемент "text 2"
  await expect(page.locator('text=text 2')).toBeVisible()
})

// ─── Тест 4: Выделение элемента и редактирование в Properties ─────────────────

test('выделение элемента и редактирование в Properties', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить Div
  await page.click('button:has-text("+ Div")')
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
  await expect(page.locator('button:has-text("← Назад")')).toBeVisible()
})

// ─── Тест 6: Удаление элемента ───────────────────────────────────────────────

test('удаление элемента', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить элемент
  await page.click('button:has-text("+ Div")')
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

  // Текущая ширина до переключения
  const widthIndicator = page.locator('span').filter({ hasText: /px/ }).last()

  // Кликнуть на Mobile
  await mobileBtn.click()

  // В топбаре должна появиться надпись "375px" (внутри button Canvas Settings)
  await expect(page.locator('button:has-text("375px")')).toBeVisible()

  // Кликнуть Desktop — вернуться к 1440px (title начинается с "Desktop:")
  const desktopBtn = page.locator('button[title^="Desktop"]')
  await desktopBtn.click()
  await expect(page.locator('button:has-text("1440px")')).toBeVisible()
})

// ─── Тест 9: Добавление маржинов через Spacing panel ─────────────────────────

test('добавление маржинов через Spacing panel', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить Div и выделить его
  await page.click('button:has-text("+ Div")')
  await page.click('text=div 1')

  // Секция Spacing должна быть видна
  await expect(page.getByText('Spacing', { exact: true })).toBeVisible()

  // Все SpacingValue-инпуты имеют placeholder="–"
  // Порядок рендера: marginTop(0), marginRight(1), marginBottom(2), marginLeft(3),
  //                  paddingTop(4), paddingRight(5), paddingBottom(6), paddingLeft(7)
  const spacingInputs = page.locator('input[placeholder="–"]')
  await expect(spacingInputs).toHaveCount(8)

  // Ввести marginTop = 20
  await spacingInputs.nth(0).fill('20')
  await page.keyboard.press('Tab')

  // Ввести marginRight = 10
  await spacingInputs.nth(1).fill('10')
  await page.keyboard.press('Tab')

  // Ввести marginBottom = 30
  await spacingInputs.nth(2).fill('30')
  await page.keyboard.press('Tab')

  // Ввести marginLeft = 40
  await spacingInputs.nth(3).fill('40')
  await page.keyboard.press('Tab')

  // Проверить значения инпутов сразу
  await expect(spacingInputs.nth(0)).toHaveValue('20')
  await expect(spacingInputs.nth(1)).toHaveValue('10')
  await expect(spacingInputs.nth(2)).toHaveValue('30')
  await expect(spacingInputs.nth(3)).toHaveValue('40')

  // Проверить что значения сохранились в localStorage
  // Zustand persist оборачивает state: { state: { project: ... } }
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const persisted = JSON.parse(raw)
    const project = persisted.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    // rootChildren[0] = body, body.children[0] = div 1
    const bodyId = artboard.rootChildren[0]
    const body = artboard.elements[bodyId]
    const elemId = body?.children?.[0]
    return artboard.elements[elemId]?.styles
  })

  expect(stored?.marginTop).toBe(20)
  expect(stored?.marginRight).toBe(10)
  expect(stored?.marginBottom).toBe(30)
  expect(stored?.marginLeft).toBe(40)
})

// ─── Тест 10: Черный бордер 10px у div ──────────────────────────────────────

test('установка черного бордера 10px у div', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить Div и выделить его
  await page.click('button:has-text("+ Div")')
  await expect(page.locator('text=div 1')).toBeVisible()
  await page.click('text=div 1')

  // Секция Borders должна быть видна
  await expect(page.locator('span').filter({ hasText: 'Borders' })).toBeVisible()

  // Кликнуть кнопку "—" (solid style) в строке Style
  const styleRow = page.locator('div').filter({ has: page.locator('span').filter({ hasText: /^Style$/ }) })
  const solidBtn = styleRow.locator('button').filter({ hasText: '—' })
  await solidBtn.click()

  // Установить Width = 10
  // .last() → самый внутренний div (BRow), а не внешний контейнер
  const widthRow = page.locator('div').filter({ has: page.locator('span').filter({ hasText: /^Width$/ }) }).last()
  const widthInput = widthRow.locator('input[type="number"]')
  await widthInput.fill('10')
  await page.keyboard.press('Tab')

  // Ввести Color = #000000 — скопить по Color BRow (.last() → innermost div)
  const colorRow = page.locator('div').filter({ has: page.locator('span').filter({ hasText: /^Color$/ }) }).last()
  const colorHexInput = colorRow.locator('input[placeholder="—"]')
  await colorHexInput.fill('#000000')
  await page.keyboard.press('Tab')

  // Проверить значения инпутов
  await expect(widthInput).toHaveValue('10')
  await expect(colorHexInput).toHaveValue('#000000')

  // Вспомогательная функция для чтения стилей из localStorage
  const getStoredStyles = () => page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const persisted = JSON.parse(raw)
    const project = persisted.state?.project
    if (!project) return null
    const artboard = Object.values(project.artboards)[0] as any
    // rootChildren[0] = body, body.children[0] = div 1
    const bodyId = artboard.rootChildren[0]
    const body = artboard.elements[bodyId]
    const elemId = body?.children?.[0]
    return artboard.elements[elemId]?.styles ?? null
  })

  // Ждём пока Zustand запишет borderStyle и borderWidth в localStorage
  await page.waitForFunction(() => {
    try {
      const raw = localStorage.getItem('creator-project')
      if (!raw) return false
      const p = JSON.parse(raw)
      const artboard = Object.values(p.state?.project?.artboards ?? {})[0] as any
      // rootChildren[0] = body, body.children[0] = div 1
      const bodyId = artboard?.rootChildren?.[0]
      const body = artboard?.elements?.[bodyId]
      const elemId = body?.children?.[0]
      const s = artboard?.elements?.[elemId]?.styles
      return s?.borderStyle === 'solid' && s?.borderWidth === 10
    } catch { return false }
  })

  const stored = await getStoredStyles()
  expect(stored?.borderStyle).toBe('solid')
  expect(stored?.borderWidth).toBe(10)
  // borderColor проверяем через UI (onChange контролируется React)
  await expect(colorHexInput).toHaveValue('#000000')
})

// ─── Тест 8: Layout display modes ───────────────────────────────────────────

test('переключение display mode в Layout', async ({ page }) => {
  await enterPageEditor(page)

  // Добавить Div
  await page.click('button:has-text("+ Div")')
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

  await page.click('button:has-text("+ Div")')
  await page.click('text=div 1')
  await switchToGrid(page)

  // Кнопки удаления треков (data-testid)
  const removeBtns = page.locator('[data-testid="track-remove"]')
  const countBefore = await removeBtns.count()

  // Добавить колонку (первая кнопка "+ Add" = Columns)
  const addBtns = page.locator('button').filter({ hasText: '+ Add' })
  await expect(addBtns.first()).toBeVisible()
  await addBtns.first().click()

  // Должен появиться новый трек
  await expect(removeBtns).toHaveCount(countBefore + 1)

  // Удалить последний добавленный трек
  await removeBtns.last().click()
  await expect(removeBtns).toHaveCount(countBefore)
})

// ─── Тест 13: Grid Gap lock/unlock ───────────────────────────────────────────

test('Grid Gap: lock/unlock раздельные gap значения', async ({ page }) => {
  await enterPageEditor(page)

  await page.click('button:has-text("+ Div")')
  await page.click('text=div 1')
  await switchToGrid(page)

  // Кнопка lock видна (по умолчанию locked)
  const lockBtn = page.locator('button[title*="gap"]')
  await expect(lockBtn).toBeVisible()

  // Заголовка "Col" и "Row" нет когда locked
  await expect(page.locator('span').filter({ hasText: /^Col$/ })).toHaveCount(0)

  // Разблокировать
  await lockBtn.click()

  // Теперь видны Col/Row метки
  await expect(page.locator('span').filter({ hasText: /^Col$/ })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: /^Row$/ })).toBeVisible()

  // Заблокировать обратно
  await lockBtn.click()
  await expect(page.locator('span').filter({ hasText: /^Col$/ })).toHaveCount(0)
})

// ─── Тест 14: Grid Auto-flow direction ───────────────────────────────────────

test('Grid Auto-flow: переключение направления', async ({ page }) => {
  await enterPageEditor(page)

  await page.click('button:has-text("+ Div")')
  await page.click('text=div 1')
  await switchToGrid(page)

  // По умолчанию Row активен
  const rowBtn = page.locator('button').filter({ hasText: '→ Row' })
  const colBtn = page.locator('button').filter({ hasText: '↓ Column' })
  await expect(rowBtn).toBeVisible()
  await expect(colBtn).toBeVisible()

  // Нажать Column
  await colBtn.click()

  // Проверить в localStorage
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const artboard = Object.values(p.state?.project?.artboards ?? {})[0] as any
    // rootChildren[0] = body, body.children[0] = div 1
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const elemId = body?.children?.[0]
    return artboard?.elements?.[elemId]?.styles?.gridAutoFlow ?? null
  })
  expect(stored).toBe('column')

  // Нажать Row
  await rowBtn.click()

  const stored2 = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const artboard = Object.values(p.state?.project?.artboards ?? {})[0] as any
    // rootChildren[0] = body, body.children[0] = div 1
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

  // Добавить родительский div и переключить на Grid
  await page.click('button:has-text("+ Div")')
  await page.click('text=div 1')
  await switchToGrid(page)

  // Добавить дочерний div (будет добавлен в выбранный div 1)
  await page.click('button:has-text("+ Div")')

  // Выбрать дочерний элемент в Layers
  await page.click('text=div 2')

  // Секция "Grid child" должна появиться
  await expect(page.locator('span').filter({ hasText: 'Grid child' })).toBeVisible()

  // Метки Column и Row должны быть видны
  await expect(page.locator('span').filter({ hasText: /^Column$/ })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: /^Row$/ })).toBeVisible()
})

// ─── Тест 16: Grid Edit Mode — открыть и закрыть ─────────────────────────────

test('Grid Edit Mode: открыть и закрыть overlay', async ({ page }) => {
  await enterPageEditor(page)

  await page.click('button:has-text("+ Div")')
  await page.click('text=div 1')
  await switchToGrid(page)

  // Кнопка "Edit Grid" должна быть видна
  const editBtn = page.locator('button').filter({ hasText: /Edit Grid/ })
  await expect(editBtn).toBeVisible()

  // Нажать — появится overlay с кнопкой Done
  await editBtn.click()

  // Кнопка Done появилась
  const doneBtn = page.locator('button').filter({ hasText: 'Done' })
  await expect(doneBtn).toBeVisible()

  // Кнопка "Exit Edit Mode" в Properties (кнопка поменяла текст)
  await expect(page.locator('button').filter({ hasText: /Exit Edit Mode/ })).toBeVisible()

  // Нажать Done — overlay закрывается
  await doneBtn.click()
  await expect(doneBtn).toHaveCount(0)

  // Кнопка в Properties снова "Edit Grid"
  await expect(page.locator('button').filter({ hasText: /Edit Grid/ })).toBeVisible()
})

// ─── Тест 17: Grid Child — column span через Properties ──────────────────────

test('Grid Child: установить column span 2', async ({ page }) => {
  await enterPageEditor(page)

  // Создать grid с 3 колонками
  await page.click('button:has-text("+ Div")')
  await page.click('text=div 1')
  await switchToGrid(page)

  // Добавить 3 колонки
  const addColBtn = page.locator('button').filter({ hasText: '+ Add' }).first()
  await addColBtn.click()
  await addColBtn.click()
  await addColBtn.click()

  // Добавить дочерний элемент
  await page.click('button:has-text("+ Div")')
  await page.click('text=div 2')

  // Grid child секция видна
  await expect(page.locator('span').filter({ hasText: 'Grid child' })).toBeVisible()

  // Заполнить Column: start=1, span, end=2
  // Используем data-testid на select
  const spanSelect = page.locator('[data-testid="grid-line-span-column"]')
  await expect(spanSelect).toBeVisible()

  // Inputs рядом со span select в Column row
  const colInputs = spanSelect.locator('..').locator('input[type="number"]')
  const startInput = colInputs.first()
  const endInput = colInputs.last()

  await startInput.fill('1')
  await spanSelect.selectOption('span')
  await endInput.fill('2')
  await page.keyboard.press('Tab')

  // Проверить localStorage
  const stored = await page.evaluate(() => {
    const raw = localStorage.getItem('creator-project')
    if (!raw) return null
    const p = JSON.parse(raw)
    const artboard = Object.values(p.state?.project?.artboards ?? {})[0] as any
    // rootChildren[0] = body, body.children[0] = div 1 (grid parent), div1.children[0] = div 2
    const bodyId = artboard?.rootChildren?.[0]
    const body = artboard?.elements?.[bodyId]
    const parentId = body?.children?.[0]
    const parent = artboard?.elements?.[parentId]
    const childId = parent?.children?.[0]
    return artboard?.elements?.[childId]?.styles?.gridColumn ?? null
  })

  expect(stored).toBe('1 / span 2')
})
