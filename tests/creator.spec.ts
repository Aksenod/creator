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

  // Кнопка "Удалить элемент"
  await expect(page.locator('button:has-text("Удалить элемент")')).toBeVisible()

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

  // Кнопка "Удалить элемент" должна появиться
  await expect(page.locator('button:has-text("Удалить элемент")')).toBeVisible()

  // Нажать кнопку удаления
  await page.click('button:has-text("Удалить элемент")')

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

  // В топбаре должна появиться надпись "375px"
  await expect(page.locator('span:has-text("375px")')).toBeVisible()

  // Кликнуть снова — вернуться к оригинальной ширине (артборд 1440px по умолчанию)
  await mobileBtn.click()
  await expect(page.locator('span:has-text("1440px")')).toBeVisible()
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
  await expect(page.locator('span').filter({ hasText: 'Align' })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: 'Gap' })).toBeVisible()

  // Нажать "Grid"
  const gridBtn = page.locator('button').filter({ hasText: /^Grid$/ })
  await gridBtn.click()

  // Должны появиться Columns / Rows поля
  await expect(page.locator('span').filter({ hasText: 'Columns' })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: 'Rows' })).toBeVisible()
})
