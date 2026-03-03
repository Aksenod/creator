# Creator — Visual Website Editor

## Tech Stack

- **Runtime:** React 18 + TypeScript 5 + Vite 5
- **State:** Zustand 5 с persist middleware + undo/redo через pushHistory
- **DnD:** @dnd-kit/core
- **AI:** OpenRouter API (AIChat с 8 инструментами, streaming)
- **Tests:** Playwright 1.58
- **Deploy:** Vercel

## Commands

```bash
npm run dev          # Dev server (Vite)
npm run build        # tsc && vite build
npx tsc --noEmit     # Type check only
npx playwright test  # E2E tests
npx vercel --prod    # Production deploy
```

---

## Agent Roles

### PM — Project Manager (основной контекст, всегда активен)
- **Реализация:** Основной контекст Claude — единственная точка контакта с пользователем
- **Всегда активен:** PM работает в каждом сообщении
- **Зоны ответственности:**
  - **Коммуникация:** Принимает запросы от пользователя, отвечает простым языком
  - **Оркестрация:** Решает какие фазы запускать, делегирует задачи агентам
  - **Приоритизация:** Оценивает сложность, определяет нужен ли benchmark/design/etc
  - **Отчётность:** Докладывает прогресс, показывает результаты, запрашивает одобрение
  - **Операции:** Worktree lifecycle, deploy, мерж-гейты, memory updates
  - **Эскалация:** Если что-то блокирует — сообщает пользователю, предлагает варианты
- **Правило:** Пользователь общается ТОЛЬКО с PM. Не нужно знать про фазы и агентов — просто описать что хочешь.

### Команда (делегируются PM через Agent tool)

#### 1. Researcher
- **Реализация:** Agent(subagent_type: "Explore")
- **Когда:** PM запускает в начале задачи
- **Что делает:** Исследует кодовую базу, ищет переиспользуемые компоненты, находит паттерны
- **Выход:** Список релевантных файлов, существующие паттерны, рекомендации по переиспользованию

#### 2. Competitor Analyst
- **Реализация:** Agent(subagent_type: "general-purpose") с WebSearch + WebFetch
- **Когда:** PM запускает для UI/UX фич (Phase 0 — BENCHMARK)
- **Что делает:** Исследует как фича реализована у Figma, Webflow, Framer
- **Источники:**
  - Документация: help.figma.com, university.webflow.com, framer.com/docs
  - Форумы: forum.figma.com, community.webflow.com
  - Figma MCP: get_screenshot, get_design_context — визуальный анализ UI
- **Выход:** Отчёт в memory/competitors.md — best practices, UX-паттерны, что взять/не взять
- **Правило:** Не копируем слепо — берём лучшее и адаптируем

#### 3. Architect
- **Реализация:** EnterPlanMode
- **Когда:** PM переходит в plan mode после исследования
- **Что делает:** Проектирует реализацию, определяет затрагиваемые файлы, выбирает подход
- **Выход:** Plan-файл с пошаговым планом → PM показывает пользователю для одобрения

#### 4. Designer
- **Реализация:** MCP Pencil tools (batch_design, get_screenshot, etc.)
- **Когда:** PM создаёт мокап для UI-задач
- **Что делает:** Создаёт .pen мокап в designs/ → screenshot → PM показывает пользователю
- **Выход:** Одобренный мокап в `designs/<feature-name>.pen`

#### 5. Layout Engineer
- **Реализация:** Основной контекст (PM переключает "шляпу")
- **Когда:** Архитектура, реализация, code review
- **Что делает:** Контролирует layout-first подход, grid/flex, responsive стратегию
- **Выход:** Layout-решения в плане, валидация при review

#### 6. Code Reviewer
- **Реализация:** Agent(subagent_type: "general-purpose")
- **Когда:** PM запускает после реализации
- **Что делает:** Проверяет качество кода, дублирование, соответствие patterns.md
- **Выход:** Список замечаний → PM исправляет → повторный ревью

#### 7. Tester
- **Реализация:** Agent(subagent_type: "general-purpose")
- **Когда:** PM запускает после code review
- **Что делает:** tsc → dev server → Playwright → написание новых тестов
- **Выход:** Все проверки зелёные → PM докладывает пользователю

---

## 9-Phase Workflow Pipeline

```
Запрос пользователя
  → [0. BENCHMARK]       — Competitor Analyst: как это у Figma/Webflow/Framer?
  → [1. RESEARCH]        — Explore-агенты параллельно исследуют кодовую базу
  → [2. ARCHITECTURE]    — Plan mode + Layout Engineer определяет layout-подход
  ═══ ГЕЙТ 1: одобрение плана пользователем ═══
  → [3. DESIGN]          — .pen мокап → скриншот → согласование (обязательно для UI)
  → [4. IMPLEMENTATION]  — EnterWorktree → код по плану → Layout Engineer контролирует
  → [5. CODE REVIEW]     — качество, переиспользование, паттерны, layout
  → [6. TESTING]         — tsc → Playwright → новые тесты
  ═══ ГЕЙТ 2: все проверки зелёные ═══
  → [7. USER REVIEW]     — пользователь проверяет в браузере
  ═══ ГЕЙТ 3: одобрение пользователя ═══
  → [8. MERGE & DEPLOY]  — мерж → build → vercel --prod → обновление memory
```

### Phase Details

**Phase 0 — BENCHMARK (для UI/UX фич):**
- Competitor Analyst исследует: как фича реализована у конкурентов
- Параллельные агенты: Figma (WebSearch + Figma MCP), Webflow (WebSearch + WebFetch), Framer
- Проверить memory/competitors.md — может уже исследовано ранее
- Выход: best practices, UX-паттерны, что взять / что не взять
- Пропускается для чисто технических задач (рефакторинг, баг-фикс)

**Phase 1 — RESEARCH:**
- Запустить 2-3 Explore-агента параллельно
- Найти: затрагиваемые файлы, существующие паттерны, переиспользуемые компоненты
- Проверить memory/patterns.md и memory/components.md
- Учесть инсайты из Phase 0 (если была)

**Phase 2 — ARCHITECTURE + Layout Engineer:**
- Architect создаёт план реализации в EnterPlanMode
- Layout Engineer добавляет: какой layout pattern (grid/flex/container), глубину вложенности, responsive стратегию
- Структура реализации: каркас (layout) → контент → стили

**Phase 3 — DESIGN (обязательно для UI-задач):**
- Создать .pen мокап: `designs/<feature-name>.pen`
- Сделать скриншот через get_screenshot
- Согласовать с пользователем перед реализацией
- Пропускается только для чисто логических задач (store, utils)

**Phase 4 — IMPLEMENTATION:**
- EnterWorktree для изоляции
- Код строго по плану, layout-first подход
- Сначала контейнеры и структура, потом наполнение

**Phase 5 — CODE REVIEW:**
- Agent(general-purpose) проверяет:
  - Дублирование кода
  - Переиспользование существующих компонентов (см. memory/components.md)
  - Соответствие паттернам (см. memory/patterns.md)
  - Потенциальные баги (null checks, edge cases)
  - Layout Engineer подтверждает layout-качество
- Если найдены проблемы → исправить → повторный ревью

**Phase 6 — TESTING:**
- `npx tsc --noEmit` — нет ошибок типов
- `npm run dev` — сервер стартует без ошибок
- `npx playwright test` — все тесты проходят
- При необходимости: написать новые тесты в tests/
- Ошибки → проверить memory/errors.md → исправить → добавить в errors.md

**Phase 7 — USER REVIEW:**
- Показать пользователю URL dev-сервера
- Дождаться одобрения
- Без одобрения — не мержить

**Phase 8 — MERGE & DEPLOY:**
- `git checkout main && git merge <worktree-branch>`
- `npm run build` — проверка production build
- `npx vercel --prod` — deploy
- Обновить memory-файлы (errors.md, patterns.md, components.md, MEMORY.md)
- Очистить стейлые worktree

---

## Competitor Analyst Protocol

### Когда запускать
- **Обязательно:** новая UI/UX фича (layers, fills, typography, responsive)
- **Опционально:** улучшение существующей фичи
- **Пропустить:** баг-фиксы, рефакторинг, чисто техническое

### Конкуренты (приоритет)
1. **Figma** — основной эталон UX для design tools
2. **Webflow** — основной эталон для visual website builders
3. **Framer** — гибрид дизайна и кода, близок к нашей нише
4. **Другие:** Wix Studio, Plasmic, Builder.io — по ситуации

### Процесс
1. Проверить `memory/competitors.md` — может уже исследовано
2. Запустить 2-3 агента параллельно (по конкуренту):
   - WebSearch: `"figma <feature> how it works"`
   - WebFetch: документация (help.figma.com, university.webflow.com)
   - Figma MCP: `get_screenshot` для визуального анализа UI (если есть ссылка)
3. Собрать отчёт:
   - Как реализовано у каждого конкурента
   - UX-паттерны: что удобно, что нет
   - Best practices: что общего у всех
   - Наше решение: что берём, что адаптируем, что делаем иначе

### Сохранение результатов
- Добавить в `memory/competitors.md` — секция по фиче
- Формат: фича → конкурент → описание → наше решение
- Не дублировать — если фича уже исследована, обновить

### Принцип
> Мы не копируем — мы изучаем решения лидеров и берём лучшее, адаптируя под наш контекст (лёгкий, быстрый визуальный редактор с AI).

---

## Layout Engineer Protocol

### Layout-First Approach
1. **Containers first** — создать структуру контейнеров (div, section)
2. **Content second** — наполнить контейнеры контентом
3. **Styles last** — стилизация после структуры

### Grid vs Flex Decision Tree
- **Grid:** 2D layout, dashboard, карточки в сетке, сложное позиционирование
- **Flex:** 1D layout, навигация, кнопки в ряд, стек элементов, выравнивание
- **Container (div):** Обёртка без layout, семантическая группировка

### Responsive Strategy
- **Desktop-first cascade:** base styles = desktop → laptop → tablet → mobile (overrides)
- Хранение: `element.styles` (desktop) + `element.breakpointStyles` (delta only)
- Разрешение: `resolveStyles(el, breakpointId)` — cascade merge

### Nesting Rules
- Максимум 3-4 уровня вложенности
- Семантическая структура: body → section → container → content
- Не вкладывать flex в flex без причины
- Grid children не должны быть grid-контейнерами без необходимости

---

## Designer Protocol

### Обязательно для UI-задач
1. Создать мокап: `designs/<feature-name>.pen`
2. Скриншот: `get_screenshot(nodeId)` для валидации
3. Согласование с пользователем перед реализацией
4. Мокап — source of truth для визуала

### Именование
- `designs/<feature-name>.pen` — один файл на фичу
- Примеры: `designs/layer-visibility.pen`, `designs/fill-section.pen`

---

## Code Review Protocol

### Чеклист
- [ ] Нет дублирования кода (проверить memory/components.md)
- [ ] Переиспользованы существующие компоненты (CollapsibleSection, PropertyRow, FigmaInput)
- [ ] Соответствие паттернам из memory/patterns.md
- [ ] Null safety (optional chaining, default values)
- [ ] Нет утечек памяти (cleanup в useEffect)
- [ ] Layout quality — Layout Engineer sign-off
- [ ] Breakpoint support — если затрагивает стили
- [ ] Export support — если новое CSS-свойство

### При обнаружении проблем
1. Список замечаний → исправить
2. Повторный ревью после исправлений
3. Только после чистого ревью → Phase 6

---

## Tester Protocol

### Pre-merge Checklist
```bash
npx tsc --noEmit          # Типы
npm run dev               # Dev server стартует
npx playwright test       # E2E тесты проходят
```

### Новые тесты
- Написать если: новый UI компонент, новая store-логика, баг без покрытия
- Паттерн: tests/<feature>.spec.ts
- Helpers: createProject, enterPageEditor, addElement, getStoredProject

### Error Lookup Protocol
1. Ошибка → проверить memory/errors.md
2. Найдена → применить решение, увеличить счётчик
3. Счётчик ≥ 3 → Systemic Issue → предложить архитектурный фикс
4. Не найдена → отладить, исправить, добавить в errors.md

---

## PM Protocol (Project Manager)

### Принцип общения
- Пользователь описывает задачу свободным языком
- PM сам решает какие фазы нужны, какие агенты запускаются
- PM докладывает простым языком: что сделано, что дальше, где нужно решение
- Не грузить пользователя техническими деталями агентов — показывать результат

### Приоритизация задачи
PM оценивает задачу и определяет какие фазы нужны:
- **Баг-фикс:** Research → Implementation → Testing → User Review → Merge
- **Новая UI-фича:** Benchmark → Research → Architecture → Design → Implementation → Code Review → Testing → User Review → Merge
- **Рефакторинг:** Research → Architecture → Implementation → Code Review → Testing → Merge
- **Мелкая правка:** Implementation → Testing → Merge

### Worktree Lifecycle
1. **Create:** `EnterWorktree` для каждой задачи
2. **Implement:** Код в изолированном worktree
3. **Test:** tsc + playwright в worktree
4. **Merge:** Только после одобрения пользователя
5. **Cleanup:** Удалить стейлые worktree после мержа

### Deploy
```bash
npm run build        # Проверка production build
npx vercel --prod    # Deploy
```

### Memory Updates (после каждого мержа)
- **errors.md** — новые ошибки, обновить счётчики
- **patterns.md** — новые паттерны, обновить существующие
- **components.md** — новые компоненты, обновить описания
- **competitors.md** — инсайты из benchmark
- **MEMORY.md** — реализованные фичи, архитектурные решения

### Error Escalation
- Ошибка повторяется ≥ 3 раз → Systemic Issue
- Systemic Issue → предложить архитектурный фикс пользователю
- Не применять хотфиксы — искать корневую причину

---

## Code Conventions

### Store Pattern
```typescript
// Изменение состояния — всегда через pushHistory
set((s) => ({
  ...pushHistory(s.history, s.historyIndex, s.project!, newProject),
}))

// Стили — через applyStyleUpdate (breakpoint-aware)
const updated = applyStyleUpdate(el, stylesPatch, activeBpId, extraProps)
```

### CSS Property Pipeline
Новое CSS-свойство проходит 5 шагов:
1. **Types** — добавить в `ElementStyles` (`src/types/index.ts`)
2. **resolveStyles** — cascade resolution (`src/utils/resolveStyles.ts`)
3. **exportHTML** — добавить в PX_PROPS или STRING_PROPS (`src/utils/exportHTML.ts`)
4. **Canvas** — рендеринг на canvas (`src/components/Canvas/Canvas.tsx`)
5. **UI** — секция в Properties panel (`src/components/Properties/`)

### Component Patterns
```typescript
// Секция свойств — всегда CollapsibleSection + PropertyRow
<CollapsibleSection label="Section Name" defaultOpen>
  <PropertyRow label="Prop">
    <FigmaInput prefix="W" value={...} onChange={...} />
  </PropertyRow>
</CollapsibleSection>

// Shared компоненты: CollapsibleSection, PropertyRow, FigmaInput,
// ColorInput, ColorPicker, PropertySelect, SegmentedControl, CompactInput
```

### Файловая структура
```
src/
├── components/          # UI компоненты
│   ├── Properties/      # Панель свойств
│   │   └── shared/      # Переиспользуемые UI-контролы
│   ├── Canvas/          # Canvas рендеринг
│   ├── Layers/          # Дерево слоёв
│   ├── AIChat/          # AI ассистент
│   └── ...
├── store/               # Zustand store (index.ts, helpers.ts, aiChatStore.ts)
├── types/               # TypeScript типы (index.ts, fills.ts)
├── utils/               # Утилиты (resolveStyles, exportHTML, colorUtils, etc.)
├── hooks/               # Custom hooks (useCanvasDnD, useCanvasTransform)
├── constants/           # Константы (breakpoints.ts)
└── styles/              # Design tokens (tokens.ts)
```

---

## Git Conventions

### Branch Naming
- `feat/<feature-name>` — новая фича
- `fix/<bug-description>` — баг-фикс
- `refactor/<what>` — рефакторинг

### Commit Messages (Conventional Commits)
```
feat(properties): add border-radius section
fix(canvas): correct grid child resize on mobile breakpoint
refactor(store): extract breakpoint logic to helper
test(spacing): add margin interaction tests
```

### Rules
- Один коммит = одно логическое изменение
- Не мержить без одобрения пользователя
- Не пушить в main напрямую — только через worktree merge
