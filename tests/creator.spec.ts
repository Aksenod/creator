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
  // Артборд — первый белый div с содержимым "Пусто"
  const artboard = page.locator('div').filter({ hasText: /Пусто|двойной клик/ }).first()
  await artboard.dblclick()
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

  // Должен быть виден артборд (белый прямоугольник с текстом о пустоте или кол-ве элементов)
  const artboard = page.locator('div').filter({ hasText: /Пусто|двойной клик/ }).first()
  await expect(artboard).toBeVisible()

  // Должно быть имя проекта в топбаре
  await expect(page.locator('span').filter({ hasText: 'Мой проект' })).toBeVisible()
})

// ─── Тест 2: Вход в артборд (Page mode) ──────────────────────────────────────

test('вход в артборд', async ({ page }) => {
  await createProject(page)

  // Двойной клик по артборду
  const artboard = page.locator('div').filter({ hasText: /Пусто|двойной клик/ }).first()
  await artboard.dblclick()

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

  // Начальное состояние — "Нет элементов"
  await expect(page.getByText('Нет элементов', { exact: true })).toBeVisible()

  // Кликнуть "+ Div"
  await page.click('button:has-text("+ Div")')

  // В Layers должен появиться элемент "div 1"
  await expect(page.locator('text=div 1')).toBeVisible()

  // Кликнуть "+ Text"
  await page.click('button:has-text("+ Text")')

  // В Layers должен появиться элемент "text 2"
  await expect(page.locator('text=text 2')).toBeVisible()

  // "Нет элементов" должно исчезнуть
  await expect(page.getByText('Нет элементов', { exact: true })).toHaveCount(0)
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

  // "Нет элементов" должно появиться снова
  await expect(page.getByText('Нет элементов', { exact: true })).toBeVisible()
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
    const elemId = artboard.rootChildren[0]
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
    const elemId = artboard.rootChildren[0]
    return artboard.elements[elemId]?.styles ?? null
  })

  // Ждём пока Zustand запишет borderStyle и borderWidth в localStorage
  await page.waitForFunction(() => {
    try {
      const raw = localStorage.getItem('creator-project')
      if (!raw) return false
      const p = JSON.parse(raw)
      const artboard = Object.values(p.state?.project?.artboards ?? {})[0] as any
      const elemId = artboard?.rootChildren?.[0]
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
